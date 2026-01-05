import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

type FAQ = { question: string; answer: string };

export async function GET(
    req: Request,
    context: { params: Promise<{ sellerId: string }> }
) {
    try {

        const { sellerId } = await context.params; //  await params here
        const bot = await prisma.sellerChatbot.findUnique({
            where: { sellerId: sellerId },
        });

        if (!bot) {
            return NextResponse.json({
                faqs: [],
                message: "This store does not have a chatbot yet.",
            });
        }

        const faqs = (bot.faqs as FAQ[]) || [];

        return NextResponse.json({ faqs });
    } catch (error) {
        console.error(" Failed to fetch FAQs:", error);
        return NextResponse.json(
            { faqs: [], message: "Failed to load FAQs." },
            { status: 500 }
        );
    }
}
