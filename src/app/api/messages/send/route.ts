import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const {
            sessionId,
            content,
            senderType,
            isChatbot,
            messageType = "text",
            payload = null
        } = await req.json();

        if (!sessionId || !senderType) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Chatbot messages are always auto-read
        let isRead = isChatbot ? true : false;
        isRead = messageType === "status_update" ? false : isRead;

        const newMessage = await prisma.chatMessage.create({
            data: {
                sessionId,
                senderType,
                senderId: session.user.id,
                content: content ?? "",
                type: messageType,
                payload,
                isRead,
                isChatbot: !!isChatbot,
            },
        });

        await prisma.chatSession.update({
            where: { id: sessionId },
            data: { updatedAt: new Date() },
        });

        return NextResponse.json(newMessage);
    } catch (error) {
        console.error(" Error creating chat message:", error);
        return NextResponse.json(
            { error: "Failed to send message" },
            { status: 500 }
        );
    }
}
