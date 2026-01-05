import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/checkout/validate
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { items } = body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: "No items provided for validation" },
                { status: 400 }
            );
        }

        for (const item of items) {
            const { productId, variantId, quantity } = item;

            if (!productId || !quantity || quantity <= 0) {
                return NextResponse.json(
                    { error: "Invalid item data" },
                    { status: 400 }
                );
            }

            /* ---------- FETCH PRODUCT + VARIANTS ---------- */
            const product = await prisma.product.findUnique({
                where: { id: productId },
                include: { variants: true },
            });

            if (!product) {
                return NextResponse.json(
                    { error: "Product not found", productId },
                    { status: 404 }
                );
            }

            /* ---------- DETERMINE AVAILABLE STOCK ---------- */
            let availableStock = product.stock;

            if (variantId) {
                const variant = product.variants.find(
                    (v) => v.id === variantId
                );

                if (!variant) {
                    return NextResponse.json(
                        { error: "Variant not found", productId, variantId },
                        { status: 404 }
                    );
                }

                availableStock = variant.stock;
            }

            /* ---------- STOCK VALIDATION ---------- */
            if (availableStock < quantity) {
                return NextResponse.json(
                    {
                        error: "Insufficient stock",
                        productId,
                        variantId: variantId ?? null,
                        availableStock,
                        requestedQuantity: quantity,
                    },
                    { status: 400 }
                );
            }
        }

        /* ---------- ALL ITEMS VALID ---------- */
        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("Checkout validation error:", err);
        return NextResponse.json(
            { error: "Failed to validate checkout items" },
            { status: 500 }
        );
    }
}
