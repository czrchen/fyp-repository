import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            include: {
                seller: {
                    select: { id: true, store_name: true, store_logo: true },
                },
                variants: {
                    select: { id: true, name: true, productId: true, attributes: true, stock: true, price: true, imageUrl: true }
                },
                brands: true,
                analytcis: true,
                category: true,
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }
}
