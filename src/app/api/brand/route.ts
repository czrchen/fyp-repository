import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// =========================
// GET: Fetch all brands
// =========================
export async function GET() {
    try {
        const brands = await prisma.brand.findMany({
            orderBy: { name: "asc" }, // optional: sort alphabetically
        });

        return NextResponse.json(brands);
    } catch (error) {
        console.error("GET /api/brand error:", error);
        return NextResponse.json(
            { error: "Failed to load brands" },
            { status: 500 }
        );
    }
}

// =========================
// POST: Add new brand
// =========================
export async function POST(req: Request) {
    try {
        const { name } = await req.json();

        if (!name || !name.trim()) {
            return NextResponse.json(
                { error: "Brand name is required" },
                { status: 400 }
            );
        }

        // Prevent duplicates
        const exists = await prisma.brand.findUnique({
            where: { name },
        });

        if (exists) {
            return NextResponse.json(
                { error: "Brand already exists" },
                { status: 409 }
            );
        }

        const newBrand = await prisma.brand.create({
            data: { name },
        });

        return NextResponse.json(newBrand, { status: 201 });
    } catch (error) {
        console.error("POST /api/brand error:", error);
        return NextResponse.json(
            { error: "Failed to create brand" },
            { status: 500 }
        );
    }
}
