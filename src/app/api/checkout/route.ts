import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

// ✅ POST /api/checkout
export async function POST(req: Request) {
    try {
        // const cookieStore = await cookies();
        // const cookieString = cookieStore.toString();

        // // ✅ Fetch current user session
        // const res = await fetch(`${process.env.NEXTAUTH_URL}/api/user/current`, {
        //     headers: { Cookie: cookieString },
        //     cache: "no-store",
        // });

        // if (!res.ok) {
        //     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        // }

        // const user = await res.json();
        // if (!user?.id) {
        //     return NextResponse.json({ error: "User not found" }, { status: 404 });
        // }

        const body = await req.json();
        const { items, addressId, paymentMethod, userSession, userId } = body;

        if (!items || items.length === 0) {
            return NextResponse.json(
                { error: "No items selected for checkout" },
                { status: 400 }
            );
        }

        // 🧮 Calculate total
        const totalAmount = items.reduce(
            (sum: number, item: any) => sum + item.price * item.quantity,
            0
        );

        // ✅ Run everything in a single transaction
        const order = await prisma.$transaction(async (tx) => {
            // 1️⃣ Create the order
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

            // 2️⃣ Loop through each item in checkout
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

                // 🧩 Fetch product info for category & brand
                const productInfo = await tx.product.findUnique({
                    where: { id: productId },
                    select: { categoryId: true, brandId: true },
                });

                // 🧩 Create order item
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

                // 🧩 Update stock
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

                // 🧩 Update product analytics
                await tx.productAnalytics.upsert({
                    where: { productId },
                    update: { salesCount: { increment: quantity } },
                    create: { productId, salesCount: quantity },
                });

                // 🧩 Update variant analytics (if applicable)
                if (variantId) {
                    await tx.variantAnalytics.upsert({
                        where: { variantId },
                        update: { salesCount: { increment: quantity } },
                        create: { variantId, salesCount: quantity },
                    });
                }

                // 🧩 Update seller performance
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

                // 🧩 Prepare purchase log data
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

                // 🧩 Remove from cart
                await tx.cartItem.delete({ where: { id: cartItemId } });
            }

            // 3️⃣ Insert all purchase events at once
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
        console.error("❌ Checkout Error:", err);
        return NextResponse.json(
            { error: "Failed to process checkout" },
            { status: 500 }
        );
    }
}
