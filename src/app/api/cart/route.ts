import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const cookieString = cookieStore.toString();

        // ✅ Fetch current user session
        const res = await fetch(`${process.env.NEXTAUTH_URL}/api/user/current`, {
            headers: { Cookie: cookieString },
            cache: "no-store",
        });

        if (!res.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await res.json();
        if (!user?.id) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // ✅ Fetch all cart items for this user
        const items = await prisma.cartItem.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            include: {
                product: true,
                variant: true,
                seller: true,
            },

        });

        return NextResponse.json({ items });
    } catch (error) {
        console.error("❌ Fetch cart error:", error);
        return NextResponse.json({ error: "Failed to load cart" }, { status: 500 });
    }
}
