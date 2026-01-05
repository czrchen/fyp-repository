import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const cookieString = cookieStore.toString();

        // Get current user
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

        // Get seller record
        const seller = await prisma.seller.findUnique({
            where: { userId: user.id },
            include: {
                performance: true,
                sellerChatbot: true,
                sellerChats: true,
            },
        });

        if (!seller) {
            return NextResponse.json(
                { error: "Seller not found" },
                { status: 404 }
            );
        }

        // Fetch ALL Order Items belonging to this seller
        const sellerOrderItems = await prisma.orderItem.findMany({
            where: { sellerId: seller.id },
            include: {
                product: true,
                variant: true,
                order: {
                    include: {
                        user: true,
                        address: true,
                    },
                },
            },
        });

        // Group items by Order
        const groupedOrders = Object.values(
            sellerOrderItems.reduce((acc: any, item) => {
                if (!acc[item.orderId]) {
                    acc[item.orderId] = {
                        orderId: item.orderId,
                        createdAt: item.order.createdAt,
                        updatedAt: item.order.updatedAt,
                        totalAmount: item.order.totalAmount,
                        paymentMethod: item.order.paymentMethod,
                        user: item.order.user,
                        address: item.order.address,
                        items: [],
                    };
                }
                acc[item.orderId].items.push(item);
                return acc;
            }, {})
        );

        // Stats (from SellerPerformance)
        const perf = seller.performance;
        const stats = {
            totalSales: perf?.totalSales ?? 0,
            totalRevenue: perf?.totalRevenue ?? 0,
            totalViews: perf?.totalViews ?? 0,
            ratingAvg: perf?.ratingAvg ?? 0,
            totalOrders: groupedOrders.length,
            pendingOrders: sellerOrderItems.filter(
                (o) => o.status !== "Delivered"
            ).length,
            completedOrders: sellerOrderItems.filter(
                (o) => o.status === "Delivered"
            ).length,
        };

        // Final Response
        return NextResponse.json({
            seller,
            stats,
            orderItems: sellerOrderItems,
            orders: groupedOrders, // grouped by orderId
        });
    } catch (error) {
        console.error(" Seller Overview Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
