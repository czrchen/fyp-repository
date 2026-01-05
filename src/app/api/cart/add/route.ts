import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    try {
        /* -------------------- AUTH -------------------- */
        const cookieStore = await cookies();
        const cookieString = cookieStore.toString();

        const authRes = await fetch(
            `${process.env.NEXTAUTH_URL}/api/user/current`,
            {
                headers: { Cookie: cookieString },
                cache: "no-store",
            }
        );

        if (!authRes.ok) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const user = await authRes.json();
        if (!user?.id) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        /* -------------------- REQUEST BODY -------------------- */
        const body = await req.json();
        const {
            productId,
            variantId,
            attributes,
            quantity,
            price,
            image,
            sellerId,
            sellerName,
        } = body;

        if (!productId || !quantity || quantity <= 0) {
            return NextResponse.json(
                { error: "Invalid request data" },
                { status: 400 }
            );
        }

        /* -------------------- FETCH PRODUCT + VARIANT -------------------- */
        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: { variants: true },
        });

        if (!product) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            );
        }

        let availableStock = product.stock;

        if (variantId) {
            const variant = product.variants.find(
                (v) => v.id === variantId
            );

            if (!variant) {
                return NextResponse.json(
                    { error: "Variant not found" },
                    { status: 404 }
                );
            }

            availableStock = variant.stock;
        }

        /* -------------------- EXISTING CART ITEM -------------------- */
        const existing = await prisma.cartItem.findFirst({
            where: {
                userId: user.id,
                productId,
                variantId: variantId ?? null,
                attributes: attributes
                    ? { equals: attributes }
                    : { equals: null },
            },
        });

        const existingQty = existing?.quantity ?? 0;
        const finalQty = existingQty + quantity;

        /* -------------------- STOCK VALIDATION -------------------- */
        if (finalQty > availableStock) {
            return NextResponse.json(
                {
                    error: "Insufficient stock",
                    availableStock,
                    requested: finalQty,
                },
                { status: 400 }
            );
        }

        /* -------------------- UPDATE OR CREATE -------------------- */
        if (existing) {
            const updated = await prisma.cartItem.update({
                where: { id: existing.id },
                data: {
                    quantity: finalQty,
                },
            });

            return NextResponse.json(updated);
        }

        const newItem = await prisma.cartItem.create({
            data: {
                userId: user.id,
                productId,
                variantId: variantId ?? null,
                attributes: attributes ?? null,
                quantity,
                price,
                image,
                sellerId,
                sellerName,
            },
        });

        return NextResponse.json(newItem);
    } catch (error) {
        console.error("Add to cart error:", error);
        return NextResponse.json(
            { error: "Failed to add to cart" },
            { status: 500 }
        );
    }
}