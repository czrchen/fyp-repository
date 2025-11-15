import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const sellers = await prisma.seller.findMany({
            include: {
                performance: true,
                products: true,
            },
        });

        return NextResponse.json(sellers);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch sellers" }, { status: 500 });
    }
}
