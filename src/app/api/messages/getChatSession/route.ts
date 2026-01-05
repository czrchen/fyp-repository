import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { orderItemId } = await req.json();

        if (!orderItemId) {
            return NextResponse.json(
                { error: "Missing orderItemId" },
                { status: 400 }
            );
        }

        // 1. Get OrderItem
        const orderItem = await prisma.orderItem.findUnique({
            where: { id: orderItemId },
            select: {
                orderId: true,
                sellerId: true,
            },
        });

        if (!orderItem) {
            return NextResponse.json(
                { error: "Order item not found" },
                { status: 404 }
            );
        }

        // 2. Get buyerId from Order
        const order = await prisma.order.findUnique({
            where: { id: orderItem.orderId },
            select: { userId: true },
        });

        if (!order) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        const buyerId = order.userId;
        const sellerId = orderItem.sellerId;

        // 3. Find or create ChatSession
        const chatSession = await prisma.chatSession.upsert({
            where: {
                buyerId_sellerId: {
                    buyerId,
                    sellerId,
                },
            },
            update: {}, // no update needed
            create: {
                buyerId,
                sellerId,
                isActive: true,
            },
            select: {
                id: true,
            },
        });

        return NextResponse.json({
            chatSessionId: chatSession.id,
        });
    } catch (error) {
        console.error("Get/Create ChatSession Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
