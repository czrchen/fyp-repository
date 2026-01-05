import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { orderId, itemId, status, estimatedDays } = await req.json();

        if (!orderId || !itemId || !status) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Fetch current item
        const item = await prisma.orderItem.findUnique({
            where: { id: itemId },
        });

        if (!item) {
            return NextResponse.json(
                { error: "Order item not found" },
                { status: 404 }
            );
        }

        const current = item.status;

        // -------------------------
        //  INVALID STATUS RULES
        // -------------------------
        const invalid =
            (current === "Delivered" && status === "Pending") ||
            (current === "Delivered" && status === "Cancelled") ||
            current === "Received"; // received = final state, no changes allowed

        if (invalid) {
            return NextResponse.json(
                { error: `Invalid status change from ${current} to ${status}` },
                { status: 400 }
            );
        }

        // -------------------------
        // ✔ Prepare update data
        // -------------------------
        const updateData: any = { status };

        if (status === "Delivered") {
            updateData.deliveredAt = new Date();
            updateData.estimatedDays = Number(estimatedDays);
        }

        if (status === "Received") {
            updateData.receivedAt = new Date();
        }

        // -------------------------
        // ✔ Update the order item
        // -------------------------
        const updatedItem = await prisma.orderItem.update({
            where: { id: itemId },
            data: updateData,
        });

        // -------------------------
        // (Optional) Check full order completion
        // -------------------------
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true },
        });

        const allCompleted = order?.items.every(
            (it) => it.status === "Received" || it.status === "Cancelled"
        );

        // You can enable this if needed:
        // if (order && allCompleted) {
        //   await prisma.order.update({
        //     where: { id: orderId },
        //     data: { status: "Completed" },
        //   });
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
