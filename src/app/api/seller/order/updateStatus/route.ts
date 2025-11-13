import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // adjust if your prisma path is different

export async function POST(req: Request) {
    try {
        const { orderId, itemId, status } = await req.json();

        if (!orderId || !itemId || !status) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // 1. Update the order item
        const updatedItem = await prisma.orderItem.update({
            where: { id: itemId },
            data: { status },
        });

        // 2. Optional: Recalculate order completion
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true },
        });

        const allDelivered = order?.items.every(
            (item) => item.status === "Delivered"
        );

        // if (order && allDelivered) {
        //     await prisma.order.update({
        //         where: { id: orderId },
        //         data: { status: "Completed" },
        //     });
        // }

        return NextResponse.json({
            message: "Status updated successfully",
            updatedItem,
        });
    } catch (error) {
        console.error("Update status error:", error);
        return NextResponse.json(
            { error: "Server error updating status" },
            { status: 500 }
        );
    }
}
