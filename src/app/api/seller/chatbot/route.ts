// /app/api/seller/chatbot/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
    try {
        // Use the EXACT same authentication pattern as your working API
        const cookieStore = await cookies();
        const cookieString = cookieStore.toString();

        // 1️⃣ Fetch the logged-in user info from your /api/user/current route
        const res = await fetch(`${process.env.NEXTAUTH_URL}/api/user/current`, {
            headers: {
                Cookie: cookieString,
            },
            cache: "no-store",
        });

        if (!res.ok) {
            console.log("❌ Unauthorized - no user session");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await res.json();
        if (!user?.id) {
            console.log("❌ User not found");
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // console.log("✅ User authenticated:", user.id);

        // 2️⃣ Find the seller linked to that user
        const seller = await prisma.seller.findUnique({
            where: { userId: user.id },
        });

        if (!seller) {
            console.log("❌ No seller profile found for user:", user.id);
            // Return 200 with empty data (not 404) to match working pattern
            return NextResponse.json({
                message: "No seller profile found",
                chatbot: null,
            });
        }

        // console.log("✅ Seller found:", seller.id);

        // 3️⃣ Fetch chatbot linked to that seller
        const chatbot = await prisma.sellerChatbot.findUnique({
            where: { sellerId: seller.id },
            include: {
                seller: {
                    select: { id: true, store_name: true, store_logo: true },
                },
            },
        });

        if (!chatbot) {
            console.log("⚠️ No chatbot configured for seller:", seller.id);
            // Return 200 with empty data (not 404)
            return NextResponse.json({
                message: "No chatbot configured",
                chatbot: null,
            });
        }

        // console.log("✅ Chatbot found:", chatbot.id);

        return NextResponse.json(chatbot);
    } catch (error) {
        console.error("❌ Error fetching seller chatbot:", error);
        return NextResponse.json(
            {
                error: "Failed to fetch chatbot",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}