import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

// 🔥 YOU WILL UPDATE THIS: Python API URL
const PYTHON_API = "http://127.0.0.1:8000/predict";

export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const cookieString = cookieStore.toString();

        // ✅ Fetch current user session
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
            take: 20,
            select: {
                product_id: true,
                category_id: true,
                brandId: true,
                event_type: true,
            },
        });

        if (logs.length === 0) {
            return NextResponse.json({ recommended: [] });
        }

        // STEP 2 — Extract sequences
        const product_ids = logs.map((l) => l.product_id);
        const category_ids = logs.map((l) => l.category_id);
        const brand_ids = logs.map((l) => l.brandId);
        const event_types = logs.map((l) => l.event_type);

        // STEP 3 — Call Python API
        const response = await fetch(PYTHON_API, {
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
        console.log("🔥 Python raw response:", text);

        let data;
        try {
            data = JSON.parse(text);
        } catch {
            console.error("❌ Python did NOT return JSON!");
            return NextResponse.json({ recommended: [] });
        }

        const predictedCategories = data.recommended_categories;

        console.log("Predicted categories from Python:", predictedCategories);

        if (!predictedCategories || predictedCategories.length === 0) {
            return NextResponse.json({ recommended: [] });
        }

        // STEP 4 — Fetch products from predicted categories
        const products = await prisma.product.findMany({
            where: {
                categoryId: { in: predictedCategories },
            },
            take: 20,
        });

        return NextResponse.json({ recommended: products });
    } catch (err) {
        console.error("Recommendation error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
