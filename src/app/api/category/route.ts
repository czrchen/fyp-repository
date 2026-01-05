import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

//  GET /api/categories?level=main&includeChildren=true
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const parentId = searchParams.get("parentId");
        const level = searchParams.get("level");
        const includeChildren = searchParams.get("includeChildren") === "true";

        const where =
            level === "main"
                ? { parentId: null }
                : parentId
                    ? { parentId }
                    : {};

        const categories = await prisma.category.findMany({
            where,
            orderBy: { name: "asc" },
            include: includeChildren
                ? { children: { select: { id: true, name: true, parentId: true } } }
                : undefined, // only include if requested
        });

        return NextResponse.json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        return NextResponse.json(
            { error: "Failed to fetch categories" },
            { status: 500 }
        );
    }
}

//  POST /api/categories
export async function POST(req: Request) {
    try {
        const { name, parentId } = await req.json();

        if (!name)
            return NextResponse.json(
                { error: "Name is required" },
                { status: 400 }
            );

        const category = await prisma.category.create({
            data: { name, parentId: parentId || null },
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error("Error creating category:", error);
        return NextResponse.json(
            { error: "Failed to create category" },
            { status: 500 }
        );
    }
}
