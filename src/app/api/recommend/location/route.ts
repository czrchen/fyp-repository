import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

// Random shuffle (Fisher–Yates, best)
function shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Fetch + shuffle helper
async function getRandomProductsByCategories(categoryIds: string[], limit = 50) {
    if (!categoryIds.length) return [];

    let products = await prisma.product.findMany({
        where: { categoryId: { in: categoryIds } },
        include: {
            variants: true,
            brands: true,
            category: true,
        },
    });

    return shuffle(products).slice(0, limit);
}

// Fallback random by product IDs
async function getRandomProductsByIds(ids: string[], limit = 50) {
    if (!ids.length) return [];

    let products = await prisma.product.findMany({
        where: { id: { in: ids } },
        include: {
            variants: true,
            brands: true,
            category: true,
        },
    });

    return shuffle(products).slice(0, limit);
}

export async function GET() {
    try {
        const cookieStore = await cookies();
        const cookieString = cookieStore.toString();

        // 1. Get logged-in user
        const res = await fetch(`${process.env.NEXTAUTH_URL}/api/user/current`, {
            headers: { Cookie: cookieString },
            cache: "no-store",
        });

        if (!res.ok) return NextResponse.json({ recommended: [] });

        const user = await res.json();

        // 2. Fetch user addresses
        const addressData = await prisma.address.findMany({
            where: { userId: user.id },
        });

        let defaultAddress = addressData.find(a => a.label === "Default");

        if (!defaultAddress && addressData.length > 0) {
            defaultAddress = addressData.sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )[0];
        }

        const userCity = defaultAddress?.city;
        const userState = defaultAddress?.state;

        const allCities = addressData.map(a => a.city).filter(Boolean);
        const allStates = addressData.map(a => a.state).filter(Boolean);
        const fuzzyLocation = (user.location || "").toLowerCase();

        // 3. Helper to count top categories
        const getTopCategories = (logs: any[], topN = 3) => {
            const counts: Record<string, number> = {};

            logs.forEach(log => {
                if (!log.category_id) return;
                counts[log.category_id] = (counts[log.category_id] || 0) + 1;
            });

            return Object.entries(counts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, topN)
                .map(([id]) => id);
        };

        let logs = [];

        // Tier 1 — City match
        if (userCity) {
            logs = await prisma.eventLog.findMany({
                where: { user: { addresses: { some: { city: userCity } } } },
                take: 500,
            });

            if (logs.length > 30) {
                const top = getTopCategories(logs);
                const products = await getRandomProductsByCategories(top);
                return NextResponse.json({ recommended: products });
            }
        }

        // Tier 2 — State match
        if (userState) {
            logs = await prisma.eventLog.findMany({
                where: { user: { addresses: { some: { state: userState } } } },
                take: 500,
            });

            if (logs.length > 30) {
                const top = getTopCategories(logs);
                const products = await getRandomProductsByCategories(top);
                return NextResponse.json({ recommended: products });
            }
        }

        // Tier 3 — Other addresses
        if (allCities.length || allStates.length) {
            logs = await prisma.eventLog.findMany({
                where: {
                    OR: [
                        { user: { addresses: { some: { city: { in: allCities } } } } },
                        { user: { addresses: { some: { state: { in: allStates } } } } },
                    ],
                },
                take: 500,
            });

            if (logs.length > 30) {
                const top = getTopCategories(logs);
                const products = await getRandomProductsByCategories(top);
                return NextResponse.json({ recommended: products });
            }
        }

        // Tier 4 — Fuzzy match against user.location
        if (fuzzyLocation.length > 1) {
            logs = await prisma.eventLog.findMany({
                where: { user: { location: { contains: fuzzyLocation, mode: "insensitive" } } },
                take: 500,
            });

            if (logs.length > 20) {
                const top = getTopCategories(logs);
                const products = await getRandomProductsByCategories(top);
                return NextResponse.json({ recommended: products });
            }
        }

        // Tier 5 — Global fallback trending (random)
        const trending = await prisma.eventLog.groupBy({
            by: ["product_id"],
            _count: { product_id: true },
            orderBy: { _count: { product_id: "desc" } },
            take: 200, // bigger sample for better randomness
        });

        const fallback = await getRandomProductsByIds(
            trending.map(t => t.product_id),
            50
        );

        return NextResponse.json({ recommended: fallback });

    } catch (err) {
        console.error("Location recommendation error:", err);
        return NextResponse.json({ recommended: [] });
    }
}
