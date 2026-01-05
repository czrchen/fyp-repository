import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

//  POST /api/checkout
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { items, addressId, paymentMethod, userSession, userId, checkoutCart } = body;

        if (!items || items.length === 0) {
            return NextResponse.json(
                { error: "No items selected for checkout" },
                { status: 400 }
            );
        }

        // Calculate total
        const totalAmount = items.reduce(
            (sum: number, item: any) => sum + item.price * item.quantity,
            0
        );

        //  Run everything in a single transaction
        const order = await prisma.$transaction(async (tx) => {
            // Create the order
            const newOrder = await tx.order.create({
                data: {
                    userId: userId,
                    addressId: addressId ?? null,
                    totalAmount,
                    paymentMethod: paymentMethod ?? "FPX",
                },
            });

            // Prepare event logs
            const purchaseLogs: any[] = [];

            // Loop through each item in checkout
            for (const item of items) {
                const {
                    id: cartItemId,
                    productId,
                    variantId,
                    sellerId,
                    price,
                    quantity,
                    image,
                } = item;

                /* ---------- FETCH CURRENT STOCK ---------- */
                const product = await tx.product.findUnique({
                    where: { id: productId },
                    include: { variants: true },
                });

                if (!product) {
                    throw new Error("Product not found");
                }

                let availableStock = product.stock;

                if (variantId) {
                    const variant = product.variants.find(v => v.id === variantId);

                    if (!variant) {
                        throw new Error("Variant not found");
                    }

                    availableStock = variant.stock;
                }

                /* ---------- FINAL STOCK VALIDATION ---------- */
                if (availableStock < quantity) {
                    throw new Error(
                        `Insufficient stock for product ${productId}`
                    );
                }


                // Fetch product info for category & brand
                const productInfo = await tx.product.findUnique({
                    where: { id: productId },
                    select: { categoryId: true, brandId: true },
                });

                // Create order item
                await tx.orderItem.create({
                    data: {
                        orderId: newOrder.id,
                        productId,
                        variantId,
                        sellerId,
                        price,
                        quantity,
                        subtotal: price * quantity,
                        imageUrl: image,
                        attributes: item.attributes ?? {},
                    },
                });

                // Update stock
                if (variantId) {
                    await tx.productVariant.update({
                        where: { id: variantId },
                        data: { stock: { decrement: quantity } },
                    });
                }

                await tx.product.update({
                    where: { id: productId },
                    data: { stock: { decrement: quantity } },
                });

                // Update product analytics
                await tx.productAnalytics.upsert({
                    where: { productId },
                    update: { salesCount: { increment: quantity } },
                    create: { productId, salesCount: quantity },
                });

                // Update variant analytics (if applicable)
                if (variantId) {
                    await tx.variantAnalytics.upsert({
                        where: { variantId },
                        update: { salesCount: { increment: quantity } },
                        create: { variantId, salesCount: quantity },
                    });
                }

                // Update seller performance
                await tx.sellerPerformance.upsert({
                    where: { sellerId },
                    update: {
                        totalSales: { increment: quantity },
                        totalRevenue: { increment: price * quantity },
                    },
                    create: {
                        sellerId,
                        totalSales: quantity,
                        totalRevenue: price * quantity,
                    },
                });

                // Prepare purchase log data
                purchaseLogs.push({
                    event_time: new Date(),
                    event_type: "purchase",
                    product_id: productId,
                    category_id: productInfo?.categoryId ?? null,
                    brandId: productInfo?.brandId ?? null,
                    price,
                    user_id: userId,
                    user_session: userSession || "guest",
                });

                if (checkoutCart) {
                    // Remove from cart
                    await tx.cartItem.delete({ where: { id: cartItemId } });
                }
            }

            // Insert all purchase events at once
            if (purchaseLogs.length > 0) {
                await tx.eventLog.createMany({ data: purchaseLogs });
            }

            return newOrder;
        });

        return NextResponse.json({
            success: true,
            message: "Checkout successful",
            orderId: order.id,
        });
    } catch (err: any) {
        console.error("Checkout Error:", err);

        if (
            typeof err.message === "string" &&
            err.message.includes("Insufficient stock")
        ) {
            return NextResponse.json(
                {
                    error: "Checkout failed due to insufficient stock",
                    refundRequired: true,
                }
            );
        }

        return NextResponse.json(
            { error: "Failed to process checkout" },
            { status: 500 }
        );
    }
}
