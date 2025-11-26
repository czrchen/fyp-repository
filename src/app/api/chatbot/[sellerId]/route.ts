// src/app/api/chatbot/[sellerId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import stringSimilarity from "string-similarity";
import type { Prisma } from "@prisma/client";

/** What the frontend sends for orders */
type ChatbotOrder = {
    orderId: string;
    productId: string;

    productName: string;         // ⭐ REQUIRED: allows “what item is inside?”
    imageUrl?: string | null;     // ⭐ Optional: AI can describe or show item
    attributes?: Record<string, any> | null; // ⭐ Color/size/spec

    status: string;
    deliveredAt?: string | null;
    estimatedDays?: number | null;
};

/** Simple intent types */
type Intent = "order_status" | "delivery" | "refund" | "rating" | "general";

/** Memory per seller (you can extend later if needed) */
type Memory = {
    lastIntent?: Intent;
    lastOrderId?: string;
};

// In-memory store: key = sellerId (for now)
const sessionMemory: Record<string, Memory> = {};

// 🔍 Intent detection
function detectIntent(raw: string): Intent {
    const q = raw.toLowerCase();

    if (q.includes("order") || q.includes("tracking") || q.includes("parcel")) {
        return "order_status";
    }
    if (q.includes("arrive") || q.includes("delivery") || q.includes("shipping")) {
        return "delivery";
    }
    if (q.includes("refund") || q.includes("return")) {
        return "refund";
    }
    if (q.includes("rating") || q.includes("review") || q.includes("score")) {
        return "rating";
    }
    return "general";
}

// 🔎 Extract order ID-like tokens from text
function extractOrderId(raw: string): string | null {
    const matches = raw.match(/[0-9a-zA-Z-]{8,}/g);
    return matches ? matches[0] : null;
}

// ✅ Route handler
export async function POST(
    req: NextRequest,
    { params }: { params: { sellerId: string } }
) {
    const { sellerId } = params;

    // Read body with proper typing
    const body = (await req.json()) as {
        question: string;
        orders?: ChatbotOrder[];
    };

    console.log("Body: ", body);

    const question = body.question?.trim();
    const userOrders: ChatbotOrder[] = body.orders ?? [];

    if (!question) {
        return NextResponse.json(
            { answer: "Please provide a question." },
            { status: 400 }
        );
    }

    // 1️⃣ Fetch seller chatbot config
    const bot = await prisma.sellerChatbot.findUnique({
        where: { sellerId },
    });

    if (!bot) {
        return NextResponse.json({
            answer: "This store does not have a chatbot yet.",
        });
    }

    // 2️⃣ Fetch seller rating performance
    const performance = await prisma.sellerPerformance.findUnique({
        where: { sellerId },
        select: {
            ratingAvg: true,
            ratingCount: true,
        },
    });

    let ratingText = "Store rating information is not available.";
    if (performance) {
        const avg = performance.ratingAvg ?? 0;
        const count = performance.ratingCount ?? 0;
        if (count > 0) {
            ratingText = `This store has an average rating of ${avg.toFixed(
                1
            )} based on ${count} reviews.`;
        } else {
            ratingText = "This store has not received any ratings yet.";
        }
    }

    // 3️⃣ Memory bucket for this seller
    const memoryKey = sellerId;
    if (!sessionMemory[memoryKey]) {
        sessionMemory[memoryKey] = {};
    }
    const memory = sessionMemory[memoryKey];

    // 4️⃣ Detect intent + store in memory
    const intent: Intent = detectIntent(question);
    memory.lastIntent = intent;

    // 5️⃣ Extract orderId from current question (if any)
    const extractedOrderId = extractOrderId(question);
    if (extractedOrderId) {
        memory.lastOrderId = extractedOrderId;
    }

    // 6️⃣ If asking about order but no order ID provided
    if (intent === "order_status" && !memory.lastOrderId) {
        if (userOrders.length === 1) {
            // Only one order with this seller → auto-use it
            memory.lastOrderId = userOrders[0].orderId;
        } else if (userOrders.length > 1) {
            // Ask user to clarify which order
            const exampleId = userOrders[0].orderId;
            return NextResponse.json({
                answer: `You have ${userOrders.length} orders with this seller. Please tell me which one (for example: "Order ${exampleId}").`,
            });
        } else {
            // No orders at all
            return NextResponse.json({
                answer:
                    "I couldn't find any orders with this seller under your account.",
            });
        }
    }

    // 7️⃣ If we have an orderId in memory, try to match it
    let matchedOrder: ChatbotOrder | undefined;
    if (memory.lastOrderId) {
        matchedOrder = userOrders.find(
            (o) => o.orderId === memory.lastOrderId
        );
    }

    // 8️⃣ Prepare user order text for Gemini
    let userOrdersText = "You have no orders with this seller.";
    if (matchedOrder) {
        userOrdersText = `
Focused order:
- Order ID: ${matchedOrder.orderId}
- Product: ${matchedOrder.productName}
- Status: ${matchedOrder.status}
- Estimated Arrival: ${matchedOrder.estimatedDays ?? "N/A"} days
- Delivered At: ${matchedOrder.deliveredAt ?? "Not delivered yet"}
- Attributes: ${matchedOrder.attributes ? JSON.stringify(matchedOrder.attributes) : "None"}
- Image URL: ${matchedOrder.imageUrl ?? "N/A"}
`;
    } else if (userOrders.length > 0) {
        userOrdersText = userOrders
            .map(
                (o, idx) => `
${idx + 1}. Order ID: ${o.orderId}
   - Product: ${o.productName}
   - Status: ${o.status}
   - Attributes: ${o.attributes ? JSON.stringify(o.attributes) : "None"}
`
            )
            .join("\n");
    }

    // 9️⃣ Parse FAQs from Prisma Json safely
    type FAQ = { question: string; answer: string };

    const faqsValue = bot.faqs as Prisma.JsonValue | null;
    let faqs: FAQ[] = [];

    if (Array.isArray(faqsValue)) {
        faqs = faqsValue
            .map((f) => {
                if (
                    f &&
                    typeof f === "object" &&
                    "question" in f &&
                    "answer" in f
                ) {
                    const obj = f as { question?: unknown; answer?: unknown };
                    return {
                        question: String(obj.question ?? ""),
                        answer: String(obj.answer ?? ""),
                    };
                }
                return null;
            })
            .filter((f): f is FAQ => f !== null);
    }

    const faqText =
        faqs.length > 0
            ? faqs
                .map(
                    (f, i) => `${i + 1}. Q: ${f.question}\nA: ${f.answer}`
                )
                .join("\n")
            : "No FAQs available.";

    // 🔟 Rule-based FAQ similarity match first
    if (faqs.length > 0) {
        const questions = faqs.map((f) => f.question);
        const { bestMatch, bestMatchIndex } =
            stringSimilarity.findBestMatch(question, questions);

        if (bestMatch.rating >= 0.45) {
            return NextResponse.json({
                answer: faqs[bestMatchIndex].answer,
            });
        }
    }

    // ⓫ Build prompt for Gemini
    const prompt = `
You are a smart assistant for an online store.

Store description:
${bot.storeDescription || "No description provided."}

Store rating:
${ratingText}

Customer's orders with this seller:
${userOrdersText}

Detected intent: ${intent}

If intent is "order_status" or "delivery" and a focused order is shown above,
use its status and dates to answer.
If intent is "rating", answer using the store rating info.
If you don't know something, say you are not sure and suggest contacting the seller.

Customer asked: "${question}"

Previous memory state:
${JSON.stringify(memory, null, 2)}

Respond in a short, clear, friendly tone.
`;

    // ⓬ Call Gemini
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                }),
            }
        );

        if (!response.ok) {
            const errText = await response.text();
            console.error("Gemini API error:", response.status, errText);
            return NextResponse.json({
                answer:
                    "Sorry, I'm having trouble generating an answer right now. Please try again or contact the seller.",
            });
        }

        const data = (await response.json()) as any;
        const aiAnswer =
            data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
            "Sorry, I couldn't find a good answer. Please contact the seller.";

        return NextResponse.json({ answer: aiAnswer });
    } catch (error) {
        console.error("Gemini fallback error:", error);
        return NextResponse.json({
            answer:
                "Sorry, I'm having trouble answering right now. Please contact the seller.",
        });
    }
}
