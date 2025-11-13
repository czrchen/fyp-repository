import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    try {
        // 1️⃣ Get current user from /api/user/current
        const cookieStore = await cookies();
        const cookieString = cookieStore.toString();
        const res = await fetch(`${process.env.NEXTAUTH_URL}/api/user/current`, {
            headers: { Cookie: cookieString },
            cache: "no-store",
        });

        if (!res.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const user = await res.json();
        if (!user?.id) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // 2️⃣ Find or create Seller record
        let seller = await prisma.seller.findUnique({ where: { userId: user.id } });
        if (!seller) {
            // 👇 Auto-create a seller profile if missing (for Google users, etc.)
            seller = await prisma.seller.create({
                data: {
                    userId: user.id,
                    store_name: `${user.full_name || "My Store"}`,
                    store_description: "",
                },
            });
        }

        // 3️⃣ Parse request body
        const { faqs, storeDescription } = await req.json();

        // 4️⃣ Create or update the chatbot
        const chatbot = await prisma.sellerChatbot.upsert({
            where: { sellerId: seller.id },
            update: {
                faqs,
                storeDescription,
            },
            create: {
                sellerId: seller.id,
                faqs,
                storeDescription,
            },
        });

        return NextResponse.json(chatbot);
    } catch (error) {
        console.error("❌ Error saving chatbot:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
