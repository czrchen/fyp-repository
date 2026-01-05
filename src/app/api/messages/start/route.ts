import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const cookieString = cookieStore.toString();

        const userRes = await fetch(`${process.env.NEXTAUTH_URL}/api/user/current`, {
            headers: { Cookie: cookieString },
            cache: "no-store",
        });

        if (!userRes.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await userRes.json();
        const body = await req.json();
        const { sellerId } = body;

        if (!sellerId) {
            return NextResponse.json({ error: "SellerId missing" }, { status: 400 });
        }

        // Try to find existing session
        let session = await prisma.chatSession.findUnique({
            where: {
                buyerId_sellerId: {
                    buyerId: user.id,
                    sellerId,
                },
            },
        });

        // Create new session if none exists
        if (!session) {
            session = await prisma.chatSession.create({
                data: {
                    buyerId: user.id,
                    sellerId,
                },
            });
        }

        return NextResponse.json({ success: true, sessionId: session.id });
    } catch (err) {
        console.error("Failed to start chat:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
