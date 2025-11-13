import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { orderItemId, productId, rating, comment } = await req.json();

        if (!orderItemId || !productId || !rating) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // 🧩 1️⃣ Find the order item and check if already reviewed
        const orderItem = await prisma.orderItem.findUnique({
            where: { id: orderItemId },
            select: {
                rating: true,
                productId: true,
                variantId: true,
                sellerId: true,
            },
        });

        if (!orderItem) {
            return NextResponse.json(
                { error: "Order item not found" },
                { status: 404 }
            );
        }

        if (orderItem.rating && orderItem.rating > 0) {
            return NextResponse.json(
                { error: "This item has already been reviewed" },
                { status: 400 }
            );
        }

        // 🧩 2️⃣ Update the order item with rating & feedback
        await prisma.orderItem.update({
            where: { id: orderItemId },
            data: {
                rating,
                feedback: comment || null,
            },
        });

        // 🧩 3️⃣ Update ProductAnalytics
        // 🧩 ProductAnalytics
        const productAnalytics = await prisma.productAnalytics.upsert({
            where: { productId },
            create: {
                productId,
                ratingAvg: rating,
                ratingCount: 1,
            },
            update: {},
        });

        const newProductAvg =
            ((productAnalytics.ratingAvg ?? 0) * productAnalytics.ratingCount + rating) /
            (productAnalytics.ratingCount + 1);

        await prisma.productAnalytics.update({
            where: { productId },
            data: {
                ratingAvg: newProductAvg,
                ratingCount: { increment: 1 },
            },
        });

        // 🧩 VariantAnalytics
        if (orderItem.variantId) {
            const variantAnalytics = await prisma.variantAnalytics.upsert({
                where: { variantId: orderItem.variantId },
                create: {
                    variantId: orderItem.variantId,
                    ratingAvg: rating,
                    ratingCount: 1,
                },
                update: {},
            });

            const newVariantAvg =
                ((variantAnalytics.ratingAvg ?? 0) * variantAnalytics.ratingCount + rating) /
                (variantAnalytics.ratingCount + 1);

            await prisma.variantAnalytics.update({
                where: { variantId: orderItem.variantId },
                data: {
                    ratingAvg: newVariantAvg,
                    ratingCount: { increment: 1 },
                },
            });
        }

        // 🧩 SellerPerformance
        const sellerPerformance = await prisma.sellerPerformance.upsert({
            where: { sellerId: orderItem.sellerId },
            create: {
                sellerId: orderItem.sellerId,
                ratingAvg: rating,
                ratingCount: 1,
            },
            update: {},
        });

        const newSellerAvg =
            ((sellerPerformance.ratingAvg ?? 0) * sellerPerformance.ratingCount + rating) /
            (sellerPerformance.ratingCount + 1);

        await prisma.sellerPerformance.update({
            where: { sellerId: orderItem.sellerId },
            data: {
                ratingAvg: newSellerAvg,
                ratingCount: { increment: 1 },
            },
        });

        return NextResponse.json({
            success: true,
            message: "Review submitted successfully",
        });
    } catch (err: any) {
        console.error("❌ Error submitting review:", err);
        return NextResponse.json(
            { error: "Failed to submit review" },
            { status: 500 }
        );
    }
}
