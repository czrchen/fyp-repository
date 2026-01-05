import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const cookieString = cookieStore.toString();

        // Fetch logged-in user
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

        // Fetch user interests
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { interests: true },
        });

        if (!dbUser || !dbUser.interests || dbUser.interests.length === 0) {
            return NextResponse.json({ recommended: [] });
        }

        const interests = dbUser.interests;
        console.log("Interest: ", interests)

        // Find matching categories by interest keywords
        const categories = await prisma.category.findMany({
            where: {
                OR: interests.map((interest) => ({
                    id: { contains: interest, mode: "insensitive" },
                })),
            },
            select: { id: true, name: true },
        });

        if (categories.length === 0) {
            return NextResponse.json({ recommended: [] });
        }

        const categoryIds = categories.map((c) => c.id);

        // Fetch products under these categories
        const products = await prisma.product.findMany({
            where: { categoryId: { in: categoryIds } },
            include: {
                variants: true,
                brands: true,
                category: true,
            },
            take: 50,
        });

        return NextResponse.json({
            recommended: products,
            matchedCategories: categories,
        });
    } catch (err) {
        console.error("Cold start error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
