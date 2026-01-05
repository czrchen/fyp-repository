import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // adjust path if needed
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
            brandId,
            categoryId,
            price,
            userSession,
        } = body;

        //  Basic validation
        if (!productId || (!userSession)) {
            return NextResponse.json(
                { error: "Missing required fields: productId or user info" },
                { status: 400 }
            );
        }

        // Get product info (to update seller performance)
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { sellerId: true },
        });

        if (!product) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            );
        }

        //  Start transaction: insert event + update analytics
        await prisma.$transaction(async (tx) => {
            // Insert EventLog
            await tx.eventLog.create({
                data: {
                    event_time: new Date(),
                    event_type: "view",
                    product_id: productId, //  camelCase
                    category_id: categoryId || null,
                    brandId: brandId || null,
                    price: price || 0,
                    user_id: user.id,
                    user_session: userSession,
                },
            });

            // ProductAnalytics
            await tx.productAnalytics.upsert({
                where: { productId },
                update: { views: { increment: 1 } },
                create: { productId, views: 1 },
            });

            // SellerPerformance
            await tx.sellerPerformance.upsert({
                where: { sellerId: product.sellerId },
                update: { totalViews: { increment: 1 } },
                create: { sellerId: product.sellerId, totalViews: 1 },
            });
        });

        return NextResponse.json({ success: true, message: "View logged" });
    } catch (err) {
        console.error("Error logging event:", err);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
