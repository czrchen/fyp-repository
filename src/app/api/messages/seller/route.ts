import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
    try {
        const cookieStore = await cookies(); //  await here
        const cookieString = cookieStore.toString();
        // Fetch the logged-in user info from your /api/user/current route
        const res = await fetch(`${process.env.NEXTAUTH_URL}/api/user/current`, {
            headers: {
                Cookie: cookieString, //  pass session cookies correctly
            },
            cache: "no-store",
        });

        if (!res.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await res.json();
        if (!user?.id) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Find the seller linked to that user
        const seller = await prisma.seller.findUnique({
            where: { userId: user.id },
        });

        if (!seller) {
            return NextResponse.json({ error: "Seller not found" }, { status: 404 });
        }

        // Fetch all active chat sessions for this seller
        const chatSessions = await prisma.chatSession.findMany({
            where: { sellerId: seller.id, isActive: true },
            include: {
                buyer: { select: { id: true, full_name: true, email: true } },
                messages: { orderBy: { createdAt: "asc" } },
            },
            orderBy: { updatedAt: "desc" },
        });

        // Format the response
        const formatted = chatSessions.map((s) => {

            // Count unread for THIS buyer:
            // "Unread for buyer" = messages from seller that are not read yet
            const unreadCount = s.messages.filter(
                (m) => m.senderType === "buyer" && m.isRead === false
            ).length;

            const filteredMessages = s.messages.filter(
                (m) => !m.isChatbot);

            return {
                id: s.id,
                buyerId: s.buyerId,
                sellerId: s.sellerId,
                buyerName: s.buyer.full_name,
                isActive: s.isActive,
                unreadCount,
                messages: filteredMessages,
            };
        });

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Failed to fetch seller chat sessions:", error);
        return NextResponse.json(
            { error: "Failed to load seller chats" },
            { status: 500 }
        );
    }
}
