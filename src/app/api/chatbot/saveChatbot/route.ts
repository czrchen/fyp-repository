import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";   // ✅ make sure this import exists
import prisma from "@/lib/prisma";         // ✅ your prisma client

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { sellerId, faqs, storeDescription } = body;

        if (!sellerId) {
            return NextResponse.json({ error: "Missing sellerId" }, { status: 400 });
        }

        await prisma.sellerChatbot.upsert({
            where: { sellerId },
            update: {
                faqs: faqs as unknown as Prisma.InputJsonValue, // ✅ final safe cast
                storeDescription,
            },
            create: {
                sellerId,
                faqs: faqs as unknown as Prisma.InputJsonValue, // ✅ final safe cast
                storeDescription,
            },
        });

        return NextResponse.json({ message: "Chatbot and store info saved." });
    } catch (error) {
        console.error("Error saving chatbot:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
