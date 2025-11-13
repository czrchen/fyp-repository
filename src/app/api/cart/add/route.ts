import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    try {
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

        const body = await req.json();
        const {
            productId,
            variantId,
            attributes, // ✅ NEW
            quantity,
            price,
            image,
            sellerId,
            sellerName,
        } = body;

        // ✅ Check for same product+variant+attributes combo
        const existing = await prisma.cartItem.findFirst({
            where: {
                userId: user.id,
                productId,
                variantId: variantId ?? null,
                attributes: attributes ? { equals: attributes } : { equals: null }, // ✅ fixed
            },
        });

        if (existing) {
            const updated = await prisma.cartItem.update({
                where: { id: existing.id },
                data: { quantity: existing.quantity + quantity },
            });
            return NextResponse.json(updated);
        }

        // ✅ Otherwise create new item
        const newItem = await prisma.cartItem.create({
            data: {
                userId: user.id,
                productId,
                variantId,
                attributes, // ✅ store JSON attributes
                quantity,
                price,
                image,
                sellerId,
                sellerName,
            },
        });

        return NextResponse.json(newItem);
    } catch (error) {
        console.error("❌ Add to cart error:", error);
        return NextResponse.json(
            { error: "Failed to add to cart" },
            { status: 500 }
        );
    }
}
