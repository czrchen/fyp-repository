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
            brandId,
            categoryId,
            price,
            userSession,
        } = body;

        //  Validate required input
        if (!productId || (!userSession)) {
            return NextResponse.json(
                { error: "Missing required fields: productId or user info" },
                { status: 400 }
            );
        }

        // Confirm product exists (for safety)
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { sellerId: true },
        });

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        //  Record a new "cart" event
        await prisma.eventLog.create({
            data: {
                event_time: new Date(),
                event_type: "cart",
                product_id: productId,
                category_id: categoryId || null,
                brandId: brandId || null,
                price: price || 0,
                user_id: user.id,
                user_session: userSession,
            },
        });

        return NextResponse.json({ success: true, message: "Cart event logged" });
    } catch (err) {
        console.error("Error logging add-to-cart event:", err);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
