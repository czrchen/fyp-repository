import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
    req: Request,
    { params }: { params: { sessionId: string } }
) {
    const { sessionId } = params;
    console.log("Session Id", sessionId);

    try {
        const { userType } = await req.json(); // 👈 receive from client ("buyer" or "seller")

        if (!userType || !["buyer", "seller"].includes(userType)) {
            return NextResponse.json(
                { error: "Invalid or missing userType" },
                { status: 400 }
            );
        }

        // Determine which messages to mark as read
        const oppositeType = userType === "buyer" ? "seller" : "buyer";

        const result = await prisma.chatMessage.updateMany({
            where: {
                sessionId,
                senderType: oppositeType, // 👈 only mark messages from the opposite side
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });

        return NextResponse.json({ updated: result.count }, { status: 200 });
    } catch (error) {
        console.error("❌ Error marking messages as read:", error);
        return NextResponse.json(
            { error: "Failed to mark messages as read" },
            { status: 500 }
        );
    }
}
