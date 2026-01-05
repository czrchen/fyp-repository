import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function PATCH(req: Request) {
    try {
        //  1. Get current logged-in user
        const cookieStore = await cookies();
        const cookieString = cookieStore.toString();

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

        //  2. Parse request body
        const body = await req.json();
        const { id, quantity } = body; // 👈 simplified

        //  3. Validate input
        if (!id || typeof quantity !== "number" || quantity < 1) {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 });
        }

        //  4. Ensure the item belongs to the current user
        const existing = await prisma.cartItem.findUnique({
            where: { id },
        });

        if (!existing || existing.userId !== user.id) {
            return NextResponse.json({ error: "Item not found or unauthorized" }, { status: 404 });
        }

        //  5. Update quantity
        const updated = await prisma.cartItem.update({
            where: { id },
            data: { quantity },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error(" Update cart error:", error);
        return NextResponse.json(
            { error: "Failed to update cart" },
            { status: 500 }
        );
    }
}
