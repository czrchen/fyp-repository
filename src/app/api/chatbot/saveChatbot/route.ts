import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface FAQ {
    question: string;
    answer: string;
}

export async function POST(req: Request) {
    const body = await req.json();
    const { sellerId, faqs, storeDescription } = body as {
        sellerId: string;
        faqs: FAQ[];
        storeDescription?: string;
    };

    if (!sellerId) {
        return NextResponse.json({ error: "Missing sellerId" }, { status: 400 });
    }

    await prisma.sellerChatbot.upsert({
        where: { sellerId },
        update: { faqs, storeDescription },
        create: { sellerId, faqs, storeDescription },
    });

    return NextResponse.json({ message: "Chatbot and store info saved." });
}
