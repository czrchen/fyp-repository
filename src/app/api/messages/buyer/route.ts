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

        // Get buyer's active chat sessions
        const chatSessions = await prisma.chatSession.findMany({
            where: {
                buyerId: user.id,
                isActive: true,
            },
            include: {
                seller: {
                    select: { id: true, store_name: true, store_logo: true },
                },
                messages: {
                    orderBy: { createdAt: "asc" },
                },
            },
            orderBy: { updatedAt: "desc" },
        });

        // Format + add unreadCount
        const formatted = chatSessions.map((s) => {
            const unreadCount = s.messages.filter(
                (m) => m.senderType === "seller" && m.isRead === false
            ).length;

            return {
                id: s.id,
                buyerId: s.buyerId,
                sellerId: s.sellerId,
                sellerName: s.seller.store_name,
                sellerLogo: s.seller.store_logo,
                isActive: s.isActive,
                unreadCount,

                messages: s.messages.map((m) => ({
                    id: m.id,
                    senderType: m.senderType,
                    senderId: m.senderId,
                    content: m.content,
                    isRead: m.isRead,
                    isChatbot: m.isChatbot,
                    createdAt: m.createdAt,

                    // FIX STARTS HERE
                    messageType: (m as any).type ?? "text",
                    payload: (m as any).payload ?? null,
                    // FIX ENDS HERE
                })),
            };
        });

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Failed to fetch buyer messages:", error);
        return NextResponse.json(
            { error: "Failed to load chat sessions" },
            { status: 500 }
        );
    }
}
