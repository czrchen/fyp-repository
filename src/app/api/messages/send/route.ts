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

        const { sessionId, content, senderType, isChatbot } = await req.json();

        if (!sessionId || !content || !senderType) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // 🧠 Determine chatbot flag safely
        const chatbotFlag = isChatbot === null ? false : isChatbot;
        const isRead = chatbotFlag ? true : false; // ✅ chatbot messages are always read

        // 📨 Create a new message
        const newMessage = await prisma.chatMessage.create({
            data: {
                sessionId,
                senderType,
                senderId: session.user.id,
                content,
                isRead,               // ✅ handled above
                isChatbot: chatbotFlag, // ✅ handled dynamically
            },
        });

        // 🕒 Update chat session timestamp
        await prisma.chatSession.update({
            where: { id: sessionId },
            data: { updatedAt: new Date() },
        });

        return NextResponse.json(newMessage);
    } catch (error) {
        console.error("❌ Error creating chat message:", error);
        return NextResponse.json(
            { error: "Failed to send message" },
            { status: 500 }
        );
    }
}
