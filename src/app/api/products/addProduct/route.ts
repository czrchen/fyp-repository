import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            name,
            description,
            price,
            stock,
            tags,
            imageUrl,
            galleryUrls,
            attributes,
            sellerId,
            categoryId,
            subcategoryId,
            brandId,
            variants = [],
        } = body;

        // ✅ Validation
        if (!name || !sellerId || !categoryId) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // 🧠 Common product fields
        const baseData = {
            name,
            description: description || "",
            price: Number(price) || 0,
            stock: Number(stock) || 0,
            tags: Array.isArray(tags) ? tags : [],
            imageUrl: imageUrl || null,
            galleryUrls: Array.isArray(galleryUrls) ? galleryUrls : [],
            attributes: typeof attributes === "object" ? attributes : {},
            sellerId,
            categoryId,
            subcategoryId,
            brandId,
            status: true,
        };

        // -------------------------------
        // 🧩 CASE 1: PRODUCT WITH VARIANTS
        // -------------------------------
        if (variants.length > 0) {
            // 1️⃣ Create parent product
            const product = await prisma.product.create({
                data: {
                    ...baseData,
                    // Optionally, total stock = sum of all variants
                    stock: variants.reduce(
                        (sum: number, v: any) => sum + (Number(v.stock) || 0),
                        0
                    ),
                },
            });

            // 2️⃣ Create associated variants
            await prisma.productVariant.createMany({
                data: variants.map((v: any) => ({
                    productId: product.id,
                    name: v.name,
                    attributes:
                        typeof v.attributes === "object"
                            ? v.attributes
                            : JSON.parse(v.attributes || "{}"),
                    stock: Number(v.stock) || 0,
                    price: v.price ? Number(v.price) : null,
                    sku: v.sku || null,
                    imageUrl: v.imageUrl || null,
                })),
            });

            return NextResponse.json(
                { message: "Variant product created successfully", product },
                { status: 201 }
            );
        }

        // -------------------------------
        // 🧩 CASE 2: SINGLE PRODUCT
        // -------------------------------
        const product = await prisma.product.create({
            data: baseData,
        });

        return NextResponse.json(
            { message: "Single product created successfully", product },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("❌ Failed to add product:", error);
        return NextResponse.json(
            { error: "Failed to add product", details: error.message },
            { status: 500 }
        );
    }
}
