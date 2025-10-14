import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const runtime = "nodejs";

export async function POST(req: Request) {
    const { message } = await req.json();

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",        // or "gpt-3.5-turbo" if you prefer cheaper
            messages: [
                {
                    role: "system",
                    content: `
You are "ShopHelper GPT", an assistant for an online store.  
Use this style: friendly, clear, short sentences.  
Answer using the information below when possible:
- Store type: handmade lifestyle products.
- Tone: polite and helpful.
If unsure, politely ask the user to clarify.
          `,
                },
                { role: "user", content: message },
            ],
            temperature: 0.7,
        });

        const answer = completion.choices[0]?.message?.content?.trim() ?? "No answer.";

        return NextResponse.json({ answer });
    } catch (err: any) {
        console.error("❌ GPT API error:", err.message || err);
        return NextResponse.json(
            { answer: "Sorry, our AI assistant is unavailable right now." },
            { status: 500 }
        );
    }
}
