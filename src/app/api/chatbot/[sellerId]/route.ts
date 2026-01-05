// src/app/api/chatbot/[sellerId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import stringSimilarity from "string-similarity";
import type { Prisma } from "@prisma/client";

/** What the frontend sends for orders (per item) */
type ChatbotOrder = {
    orderId: string;
    productId: string;
    productName: string;
    imageUrl?: string | null;
    attributes?: Record<string, any> | null;
    status: string;
    deliveredAt?: string | null;
    estimatedDays?: number | null;
};

type Memory = {
    awaitingOrderSelection?: boolean;   // Are we waiting for user to choose an order?
    candidateOrders?: ChatbotOrder[];   // The list of orders they need to pick from
};

/** Simple intent types */
type Intent =
    | "order_status"
    | "delivery"
    | "refund"
    | "rating"
    | "product_search"
    | "general"
    | "bestseller"
    | "new_arrivals"
    | "cart_status";

function fuzzyIncludes(q: string, word: string, maxDistance = 2): boolean {
    // simple Levenshtein-like check
    if (q.includes(word)) return true;
    const variants = q.split(/\s+/);

    for (const v of variants) {
        const dist = levenshtein(v, word);
        if (dist <= maxDistance) return true;
    }
    return false;
}

function levenshtein(a: string, b: string): number {
    const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;

    for (let i = 1; i < dp.length; i++) {
        for (let j = 1; j < dp[0].length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost
            );
        }
    }
    return dp[a.length][b.length];
}

// In-memory store: key = sellerId
const sessionMemory: Record<string, Memory> = {};

// ----------------------------------
// MAIN INTENT DETECTOR (IMPROVED)
// ----------------------------------
function detectIntent(raw: string): Intent {
    const q = raw.toLowerCase().trim();

    // ---------- 1. ORDER STATUS ----------
    const orderKeywords = ["order", "orders", "tracking", "track", "parcel", "shipping status"];
    if (orderKeywords.some(k => q.includes(k))) return "order_status";

    // ---------- 2. DELIVERY ----------
    const deliveryKeywords = ["delivery", "shipping", "ship", "deliverey"];
    if (deliveryKeywords.some(k => q.includes(k))) return "delivery";

    // ---------- 3. REFUND ----------
    const refundKeywords = ["refund", "return", "exchange", "refnd", "retun"];
    if (refundKeywords.some(k => q.includes(k))) return "refund";

    // ---------- 4. RATING ----------
    const ratingKeywords = ["rating", "review", "score", "rate"];
    if (ratingKeywords.some(k => q.includes(k))) return "rating";

    // ---------- 5. BESTSELLER ----------
    const bestsellerKeywords = ["best seller", "bestseller", "popular", "top product", "most sold", "what sells"];
    if (bestsellerKeywords.some(k => q.includes(k))) return "bestseller";

    // ---------- 6. NEW ARRIVALS ----------
    const newArrivalKeywords = ["new arrival", "latest", "just arrived", "new stock", "new item"];
    if (newArrivalKeywords.some(k => q.includes(k))) return "new_arrivals";

    // ---------- 7. CART STATUS ----------
    // Trigger if message mentions cart OR verbs for interacting with cart
    const cartKeywords = ["cart", "crt", "car", "basket"];
    const cartVerbs = ["check", "see", "view", "open", "show", "what", "look"];

    const hasCartWord = cartKeywords.some(k => q.includes(k));
    const hasCartVerb = cartVerbs.some(k => q.includes(k));

    if (hasCartWord && hasCartVerb) return "cart_status";
    if (hasCartWord && q.length <= 20) return "cart_status"; // handles "cart", "crt pls", "cart??"

    // ---------- 8. PRODUCT SEARCH ----------
    const productSearchRules = [
        "recommend",
        "looking for",
        "find",
        "search",
        "show me",
        "want to buy",
        "need product",
        "suggest",
        "any product"
    ];

    if (productSearchRules.some(k => q.includes(k))) {
        return "product_search";
    }

    // ---------- 9. FALLBACK ----------
    return "general";
}

// Extract order ID-like tokens from text
function extractOrderId(raw: string): string | null {
    const matches = raw.match(/[0-9a-zA-Z-]{8,}/g);
    return matches ? matches[0] : null;
}

function cleanKeyword(word: string): string {
    return word
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, "") // removes ? ! . , / \ ' "
        .trim();
}

function extractOrderKeyword(q: string): string[] {
    const text = q.toLowerCase();

    const IGNORE = new Set([
        "can", "you", "check", "track", "order", "orders",
        "with", "my", "the", "a", "an", "pls", "please",
        "find", "show", "is", "in", "for", "status",
        "me", "this", "those", "them", "want", "to",
        "see", "look", "up", "any", "i", "contain"
    ]);

    const words = text
        .split(/\s+/)
        .map(cleanKeyword)
        .filter(w => w && !IGNORE.has(w));

    //  ONLY accept keywords longer than 5 characters
    const validKeywords = words.filter(w =>
        w.length > 4 && !/^\d+$/.test(w)
    );

    return validKeywords;
}

function fuzzyMatchProduct(productName: string, keyword: string, maxDistance = 1): boolean {
    const name = productName.toLowerCase().split(/\s+/);

    // Exact contains
    if (productName.toLowerCase().includes(keyword)) return true;

    // Fuzzy per word
    for (const w of name) {
        if (levenshtein(w, keyword) <= maxDistance) {
            return true;
        }
    }

    return false;
}

// Standard product payload shape
function formatProduct(p: any) {
    return {
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        imageUrl: p.imageUrl,
        tags: p.tags,
        attributes: p.attributes,
        ratingAvg: p.ratingAvg,
        ratingCount: p.ratingCount,
        brand: p.brands?.id,
        variant: p.variants ?? [],
        category: p.category?.id,
        stock: p.stock,
        sellerId: p.sellerId,
        sellerName: p.seller?.store_name,
    };
}

// Smart product search function (no embeddings, pure lexical scoring)
async function searchProducts(sellerId: string, query: string) {
    const STOPWORDS = new Set([
        "for", "with", "the", "a", "an", "me", "you",
        "please", "some", "any", "have", "want", "do", "show"
    ]);

    const searchTerms = query
        .toLowerCase()
        .split(/\s+/)
        .map(t => t.trim())
        .filter(t =>
            t.length >= 4 &&         // MUST be at least 4 characters
            !STOPWORDS.has(t) &&
            /^[a-z0-9]+$/i.test(t)   // optional: avoid symbols like "??!" etc
        );

    const products = await prisma.product.findMany({
        where: { sellerId, status: true, stock: { gt: 0 } },
        include: { brands: true, category: true, subcategory: true, variants: true, seller: true },
    });

    const scored = products.map((product) => {
        let score = 0;

        const name = product.name.toLowerCase();
        const desc = product.description?.toLowerCase() ?? "";
        const cat = product.category?.name?.toLowerCase() ?? "";
        const tags = (product.tags || []).map((t: string) => t.toLowerCase());

        searchTerms.forEach(term => {
            // NAME MATCH
            if (name.includes(term)) {
                score += 10;
            }
            // DESCRIPTION MATCH
            if (desc.includes(term)) {
                score += 5;
            }
            // CATEGORY MATCH
            if (cat.includes(term)) {
                score += 6;
            }
            // TAG MATCH
            tags.forEach(tag => {
                if (tag.includes(term)) {
                    score += 8;
                }
            });
        });


        return { product, score };
    });

    const positiveMatches = scored.filter(p => p.score > 10);
    if (positiveMatches.length === 0) return [];

    return positiveMatches
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
        .map(p => p.product);
}

// Best sellers in last 30 days for this seller
async function getBestSellersForSeller(sellerId: string) {
    // 1) Get all products of this seller
    const products = await prisma.product.findMany({
        where: {
            sellerId,
            status: true,
            stock: { gt: 0 },
        },
        select: { id: true },
    });

    if (products.length === 0) return [];

    const productIds = products.map((p) => p.id);

    // 2) Look at EventLog for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const grouped = await prisma.eventLog.groupBy({
        by: ["product_id"],
        where: {
            product_id: { in: productIds },
            event_time: { gte: thirtyDaysAgo },
            event_type: "view", // could change to "purchase" if you log that
        },
        _count: {
            product_id: true,
        },
        orderBy: {
            _count: {
                product_id: "desc",
            },
        },
        take: 10,
    });

    if (grouped.length === 0) return [];

    const bestIds = grouped.map((g) => g.product_id);

    const bestProducts = await prisma.product.findMany({
        where: { id: { in: bestIds } },
        include: {
            brands: true,
            category: true,
            subcategory: true,
            variants: true,
            seller: true,
        },
    });

    // Keep order according to `grouped`
    const ordered = bestIds
        .map((id) => bestProducts.find((p) => p.id === id))
        .filter(Boolean);

    return ordered;
}

// ---------- Route Handler ----------

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ sellerId: string }> }
) {
    const { sellerId } = await params;

    const body = (await req.json()) as {
        question: string;
        orders?: ChatbotOrder[];
        cart?: any[];
    };

    const question = body.question?.trim();
    const userOrders: ChatbotOrder[] = body.orders ?? [];
    const items: any[] = body.cart ?? [];

    const activeOrders = userOrders.filter((o) => {
        const s = (o.status || "").toLowerCase();
        return s !== "completed";
    });

    if (!question) {
        return NextResponse.json(
            {
                type: "text",
                content: "Please provide a question.",
            },
            { status: 400 }
        );
    }

    // Fetch seller chatbot config
    const bot = await prisma.sellerChatbot.findUnique({
        where: { sellerId },
    });

    if (!bot) {
        return NextResponse.json({
            type: "text",
            content: "This store does not have a chatbot yet.",
        });
    }

    // Fetch seller rating performance
    const performance = await prisma.sellerPerformance.findUnique({
        where: { sellerId },
        select: { ratingAvg: true, ratingCount: true },
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

    // Memory bucket for this seller
    const memoryKey = sellerId;
    if (!sessionMemory[memoryKey]) {
        sessionMemory[memoryKey] = {};
    }
    const memory = sessionMemory[memoryKey];

    // Detect intent + store in memory
    const intent: Intent = detectIntent(question);

    // Extract orderId from current question (if any)
    const extractedOrderId = extractOrderId(question);
    if (extractedOrderId) {

        // User explicitly mentioned an order ID → show details
        const items = userOrders.filter((o) => o.orderId === extractedOrderId);
        if (items.length > 0) {
            return NextResponse.json({
                type: "order_detail",
                content: "",
                payload: items,
            });
        }
    }

    // If asking about order/delivery but no order ID provided yet
    if (intent === "order_status" || intent === "delivery") {

        const keywords = extractOrderKeyword(question); // jersey, shirt, shoe, etc.

        if (activeOrders.length === 0) {
            return NextResponse.json({
                type: "text",
                content: "You don’t have any orders with this shop yet.",
            });
        }

        // SPECIAL CASE → "recent order"
        if (question.toLowerCase().includes("recent")) {
            const sorted = [...userOrders].sort((a, b) =>
                new Date(b.deliveredAt ?? b.orderId).getTime() -
                new Date(a.deliveredAt ?? a.orderId).getTime()
            );

            const recent = sorted[0];
            return NextResponse.json({
                type: "order_detail",
                content: "Here is your most recent order:",
                payload: userOrders.filter(o => o.orderId === recent.orderId)
            });
        }

        // Step 1: If there is a keyword, filter by product name
        let matching = activeOrders;
        let matchedKeyword: string | null = null;
        if (keywords.length > 0) {
            for (const keyword of keywords) {

                // ---------- Stage 1: EXACT ----------
                let exactMatches = activeOrders.filter(o =>
                    o.productName.toLowerCase().includes(keyword)
                );

                if (exactMatches.length > 0) {
                    matching = Array.from(
                        new Map(exactMatches.map(item => [item.orderId, item])).values()
                    );
                    matchedKeyword = keyword;   //  store matched keyword
                    break;
                }

                // ---------- Stage 2: FUZZY ----------
                let fuzzyMatches = activeOrders.filter(o =>
                    fuzzyMatchProduct(o.productName, keyword)
                );

                if (fuzzyMatches.length > 0) {
                    matching = Array.from(
                        new Map(fuzzyMatches.map(item => [item.orderId, item])).values()
                    );
                    matchedKeyword = keyword;   //  store matched keyword
                    break;
                }
            }
        }

        if (memory.awaitingOrderSelection) {
            // Detect if user is asking a NEW question instead of choosing a number
            const isNumber = /^\d+$/.test(question.trim());

            // User typed text, not a number → reset selection mode
            if (!isNumber) {
                memory.awaitingOrderSelection = false;
                memory.candidateOrders = [];
            }
        }

        // Step 2: If user is already choosing between multiple orders
        if (memory.awaitingOrderSelection) {
            const num = parseInt(question);
            if (!isNaN(num) && num > 0 && num <= memory.candidateOrders!.length) {
                const chosen = memory.candidateOrders![num - 1];

                // reset memory
                memory.awaitingOrderSelection = false;
                memory.candidateOrders = [];

                return NextResponse.json({
                    type: "order_detail",
                    content: "",
                    payload: userOrders.filter(o => o.orderId === chosen.orderId)
                });
            }

            return NextResponse.json({
                type: "text",
                content: "Please choose an order by number."
            });
        }

        if (keywords.length < 1) {
            return NextResponse.json({
                type: "order_list",
                content: "Here are your orders:",
                payload: activeOrders
            });
        }

        // Step 3: If exactly one order matches keyword → show it
        if (keywords.length >= 1 && matching.length === 1) {
            return NextResponse.json({
                type: "order_detail",
                content: "",
                payload: userOrders.filter(o => o.orderId === matching[0].orderId)
            });
        }

        // Step 4: If multiple orders match → ask user to pick one
        if (keywords.length >= 1 && matching.length > 1) {
            memory.awaitingOrderSelection = true;
            memory.candidateOrders = matching;

            return NextResponse.json({
                type: "order_list",
                content: `I found ${matching.length} orders related to "${matchedKeyword}". Please select one:`,
                payload: matching
            });
        }

        // Step 5: If keyword found but no matching order
        if (keywords.length >= 1 && matching.length === 0) {
            return NextResponse.json({
                type: "order_list",
                content: `I couldn't find any orders related to "${matchedKeyword}". Here are all your active orders:`,
                payload: activeOrders
            });
        }

        // Step 6: If no keyword provided → fallback to all active orders
        return NextResponse.json({
            type: "order_list",
            content: "Here are your orders:",
            payload: activeOrders
        });
    }

    // PRODUCT SEARCH INTENT
    if (intent === "product_search") {

        // -------------------------------------
        // 1) Stage 1 — EXACT lexical search first
        // -------------------------------------
        const exactMatches = await searchProducts(sellerId, question);

        if (exactMatches.length > 0) {
            return NextResponse.json({
                type: "product_list",
                content: `I found ${exactMatches.length} product${exactMatches.length > 1 ? "s" : ""} that match your search:`,
                payload: exactMatches.map(formatProduct),
            });
        }

        // -------------------------------------
        // 2) Stage 2 — Fuzzy fallback ONLY IF exact found nothing
        // -------------------------------------

        // Extract a meaningful keyword (same logic used for order search)
        const rawWords = question
            .toLowerCase()
            .split(/\s+/)
            .filter(w => w.trim().length > 0);

        const STOPWORDS = new Set(["for", "with", "the", "a", "an", "me", "you", "please", "show", "do", "any", "find"]);
        const keywords = rawWords.filter(w => !STOPWORDS.has(w));

        // No meaningful keyword = no fuzzy search
        if (keywords.length === 0) {
            return NextResponse.json({
                type: "text",
                content: "I couldn't understand what product you're looking for. Could you rephrase your search?",
            });
        }

        const keyword = keywords[keywords.length - 1]; // last meaningful word

        // Prevent fuzzy accidents for very short words (hi, ok, yo)
        if (keyword.length < 3) {
            return NextResponse.json({
                type: "text",
                content: `I couldn't find any products matching "${keyword}". Could you describe it more clearly?`,
            });
        }

        // Load all products for fuzzy matching
        const allProducts = await prisma.product.findMany({
            where: { sellerId, status: true, stock: { gt: 0 } },
            include: { brands: true, category: true, subcategory: true, variants: true, seller: true },
        });

        // Fuzzy matching
        const fuzzyMatches = allProducts.filter(p =>
            fuzzyMatchProduct(p.name, keyword)
        );

        if (fuzzyMatches.length === 0) {
            return NextResponse.json({
                type: "text",
                content: `I couldn't find any products related to "${keyword}". Try a different description.`,
            });
        }

        return NextResponse.json({
            type: "product_list",
            content: `I found ${fuzzyMatches.length} products that closely match "${keyword}":`,
            payload: fuzzyMatches.map(formatProduct),
        });
    }


    // NEW ARRIVALS
    if (intent === "new_arrivals") {
        const newProducts = await prisma.product.findMany({
            where: {
                sellerId,
                status: true,
                stock: { gt: 0 },
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 10,
            include: {
                brands: true,
                category: true,
                subcategory: true,
                variants: true,
                seller: true,
            },
        });

        if (newProducts.length === 0) {
            return NextResponse.json({
                type: "text",
                content: "This seller doesn't have any new arrivals yet.",
            });
        }

        return NextResponse.json({
            type: "product_list",
            content: "Here are the latest new arrivals from this seller:",
            payload: newProducts.map(formatProduct),
        });
    }

    //  BESTSELLER INTENT
    if (intent === "bestseller") {
        const bestProducts = await getBestSellersForSeller(sellerId);

        if (bestProducts.length === 0) {
            return NextResponse.json({
                type: "text",
                content:
                    "I couldn't find clear best sellers for this store yet. Maybe try asking for new arrivals or a specific product type?",
            });
        }

        return NextResponse.json({
            type: "product_list",
            content: "Here are some of this seller's most popular products in the last 30 days:",
            payload: bestProducts.map(formatProduct),
        });
    }

    // CART STATUS INTENT
    if (intent === "cart_status") {

        const sellerCartItems = items.filter(
            (item) => item.sellerId === sellerId
        );

        if (sellerCartItems.length === 0) {
            return NextResponse.json({
                type: "text",
                content: "Your cart does not contain any products from this seller.",
            });
        }

        return NextResponse.json({
            type: "cart_list",
            content: `You currently have ${sellerCartItems.length
                } item${sellerCartItems.length > 1 ? "s" : ""} from this seller in your cart:`,
            payload: sellerCartItems,
        });
    }

    // If we have an orderId in memory (from previous turn), we can use it to focus order text for Gemini
    let matchedOrder: ChatbotOrder | undefined;

    let userOrdersText = "You have no orders with this seller.";
    if (matchedOrder) {
        userOrdersText = `
Focused order:
  - Order ID: ${matchedOrder.orderId}
  - Product: ${matchedOrder.productName}
  - Status: ${matchedOrder.status}
  - Estimated Arrival: ${matchedOrder.estimatedDays ?? "N/A"} days
  - Delivered At: ${matchedOrder.deliveredAt ?? "Not delivered yet"}
  - Attributes: ${matchedOrder.attributes ? JSON.stringify(matchedOrder.attributes) : "None"
            }
  - Image URL: ${matchedOrder.imageUrl ?? "N/A"}
    `;
    } else if (activeOrders.length > 0) {
        userOrdersText = activeOrders
            .map(
                (o, idx) => `
${idx + 1}. [ACTIVE] Order ID: ${o.orderId}
   - Product: ${o.productName}
   - Status: ${o.status}
   - Attributes: ${o.attributes ? JSON.stringify(o.attributes) : "None"}
   - Image URL: ${o.imageUrl ?? "N/A"}
      `
            )
            .join("\n");
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

    // Parse FAQs from Prisma Json safely
    type FAQ = { question: string; answer: string };
    const faqsValue = bot.faqs as Prisma.JsonValue | null;
    let faqs: FAQ[] = [];
    if (Array.isArray(faqsValue)) {
        faqs = faqsValue
            .map((f) => {
                if (f && typeof f === "object" && "question" in f && "answer" in f) {
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

    // Rule-based FAQ similarity match first
    if (faqs.length > 0) {
        const questions = faqs.map((f) => f.question);
        const { bestMatch, bestMatchIndex } = stringSimilarity.findBestMatch(
            question,
            questions
        );
        if (bestMatch.rating >= 0.45) {
            return NextResponse.json({
                type: "text",
                content: faqs[bestMatchIndex].answer,
            });
        }
    }

    // Build prompt for Gemini
    const prompt = `
You are a smart assistant for an online store.

Store description: ${bot.storeDescription || "No description provided."}
Store rating: ${ratingText}

Customer's orders with this seller:
${userOrdersText}

Detected intent: ${intent}

If intent is "order_status" or "delivery" and a focused order is shown above, use its status and dates to answer.
If intent is "rating", answer using the store rating info.
If you don't know something, say you are not sure and suggest contacting the seller.

Customer asked: "${question}"

Previous memory state: ${JSON.stringify(memory, null, 2)}

IMPORTANT: Respond in plain text only. Do NOT use any markdown formatting like **bold**, *italic*, or \`code\`. Just write naturally without any special characters for emphasis.

Respond in a short, clear, friendly tone.
  `;

    // Call Gemini as plain text fallback
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
                type: "text",
                content:
                    "Sorry, I'm having trouble generating an answer right now. Please try again or contact the seller.",
            });
        }

        const data = (await response.json()) as any;
        const aiAnswer =
            data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
            "Sorry, I couldn't find a good answer. Please contact the seller.";

        return NextResponse.json({
            type: "text",
            content: aiAnswer,
        });
    } catch (error) {
        console.error("Gemini fallback error:", error);
        return NextResponse.json({
            type: "text",
            content:
                "Sorry, I'm having trouble answering right now. Please contact the seller.",
        });
    }
}
