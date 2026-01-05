import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

// Python API URL
const PYTHON_API = process.env.NEXT_PUBLIC_PYTHON_API!;
const PYTHON_API_LOCAL = process.env.NEXT_PUBLIC_PYTHON_API_LOCAL!;

export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const cookieString = cookieStore.toString();

        //  Fetch current user session
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

        // STEP 1 — Fetch last 20 events
        const logs = await prisma.eventLog.findMany({
            where: { user_id: user.id },
            orderBy: { event_time: "desc" },
            // take: 20,
            select: {
                product_id: true,
                category_id: true,
                brandId: true,
                event_type: true,
            },
        });

        // console.log("User Logs: ", logs);

        if (logs.length === 0) {
            return NextResponse.json({ recommended: [] });
        }

        // STEP 2 — Extract sequences
        const product_ids = logs.map(l => l.product_id).reverse();
        const category_ids = logs.map(l => l.category_id).reverse();
        const brand_ids = logs.map(l => l.brandId).reverse();
        const event_types = logs.map(l => l.event_type).reverse();
        const response = await fetch(PYTHON_API_LOCAL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                product_ids,
                category_ids,
                brand_ids,
                event_types,
            }),
        });

        const text = await response.text();

        let data;
        try {
            data = JSON.parse(text);
        } catch {
            console.error(" Python did NOT return JSON!");
            return NextResponse.json({ recommended: [] });
        }

        const predictedCategories = data.recommended_categories;

        if (!predictedCategories || predictedCategories.length === 0) {
            return NextResponse.json({ recommended: [] });
        }

        // STEP 4 — Fetch products from predicted categories
        let products = await prisma.product.findMany({
            where: {
                categoryId: { in: predictedCategories },
            },
            include: {
                variants: true,
                brands: true,
                category: true,
            },
        });

        products = products.sort(() => Math.random() - 0.5).slice(0, 100);

        return NextResponse.json({ recommended: products });
    } catch (err) {
        console.error("Recommendation error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
