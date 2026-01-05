import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        // Only include data from the last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 8);

        // Trending based on last 6 months of events
        const trending = await prisma.eventLog.groupBy({
            by: ["product_id"],
            where: {
                event_type: "view",
                event_time: {                    // use event_time
                    gte: sixMonthsAgo,
                },
            },
            _count: {
                product_id: true,
            },
            orderBy: {
                _count: {
                    product_id: "desc",
                },
            },
            take: 50,
        });

        // Extract product IDs
        const productIds = trending.map((t) => t.product_id);

        if (productIds.length === 0) {
            return NextResponse.json({ recommended: [] });
        }

        // Fetch product details
        const products = await prisma.product.findMany({
            where: {
                id: { in: productIds },
            },
            include: {
                variants: true,
                brands: true,
                category: true,
            },
        });

        // Preserve trending order
        const ordered = productIds.map((id) =>
            products.find((p) => p.id === id)
        );

        return NextResponse.json({ recommended: ordered });
    } catch (err) {
        console.error("Trending error:", err);
        return NextResponse.json(
            { error: "Failed to fetch trending products" },
            { status: 500 }
        );
    }
}
