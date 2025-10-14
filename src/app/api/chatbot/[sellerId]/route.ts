import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import stringSimilarity from "string-similarity";

export const runtime = "nodejs";

type FAQ = { question: string; answer: string };

export async function POST(
    req: Request,
    context: { params: { sellerId: string } }
) {
    const { sellerId } = context.params;
    const { question } = (await req.json()) as { question: string };

    if (!question) {
        return NextResponse.json({ answer: "Please provide a question." }, { status: 400 });
    }

    // 1️⃣ Fetch seller chatbot config
    const bot = await prisma.sellerChatbot.findUnique({ where: { sellerId } });
    if (!bot) {
        return NextResponse.json({ answer: "This store does not have a chatbot yet." });
    }

    const faqs = (bot.faqs as FAQ[]) || [];
    const storeDescription = bot.storeDescription || "";

    if (faqs.length === 0 && !storeDescription) {
        return NextResponse.json({
            answer:
                "This store has not added any FAQs or description yet. Please contact the seller for more information.",
        });
    }

    // 2️⃣ Rule-based matching first
    const questions = faqs.map((f) => f.question);
    const { bestMatch, bestMatchIndex } = stringSimilarity.findBestMatch(question, questions);

    if (bestMatch.rating >= 0.45) {
        const answer = faqs[bestMatchIndex].answer;
        return NextResponse.json({ answer });
    }

    // ✅ Gemini fallback using direct API call
    try {
        const faqText =
            faqs.length > 0
                ? faqs.map((f, i) => `${i + 1}. Q: ${f.question}\nA: ${f.answer}`).join("\n")
                : "No FAQs provided.";

        const descriptionText = storeDescription
            ? `Store Description: ${storeDescription}`
            : "";

        const prompt = `
You are a helpful and friendly assistant for an online store.

${descriptionText}

Here are the store's FAQs:
${faqText}

Customer asked: "${question}"

Based on the above, answer the customer politely and accurately.
If unsure, say you're not certain and suggest contacting the seller.
Keep your response short, clear, and friendly.
`;

        // Use gemini-2.5-flash (the fastest and most stable model you have access to)
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: prompt,
                                },
                            ],
                        },
                    ],
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.text();
            console.error("❌ Gemini API error:", response.status, errorData);
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const aiAnswer = data.candidates[0].content.parts[0].text.trim();

        console.log(`💬 Gemini fallback succeeded for seller ${sellerId}`);

        return NextResponse.json({ answer: aiAnswer });
    } catch (error: any) {
        console.error("❌ Gemini fallback error:", error);
        return NextResponse.json({
            answer:
                "Sorry, I'm having trouble finding the right answer right now. Please contact the seller.",
        });
    }
}