import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const sellers = await prisma.sellerChatbot.findMany({
            select: {
                id: true,
                sellerId: true,
                updatedAt: true,
            },
        });

        return NextResponse.json(sellers);
    } catch (error) {
        console.error("Error fetching seller chatbots:", error);
        return NextResponse.json({ error: "Failed to fetch sellers" }, { status: 500 });
    }
}