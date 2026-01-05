import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { variants, ...productData } = body;

        // CASE 1: Variant-based product
        if (Array.isArray(variants) && variants.length > 0) {
            // Update the main product info
            await prisma.product.update({
                where: { id },
                data: {
                    name: productData.name,
                    description: productData.description || "",
                    status: productData.status ?? true,
                    tags: productData.tags ?? [],
                    updatedAt: new Date(),
                },
            });

            // Sync all variants (simplified full replace approach)
            // Delete old variants, then recreate from the new array
            await prisma.productVariant.deleteMany({
                where: { productId: id },
            });

            await prisma.productVariant.createMany({
                data: variants.map((v: any) => ({
                    id: v.id || crypto.randomUUID(),
                    productId: id,
                    name: v.name || "Untitled Variant",
                    price: v.price ?? 0,
                    stock: v.stock ?? 0,
                    sku: v.sku || null,
                    imageUrl: v.imageUrl || null,
                    attributes: v.attributes || {},
                })),
            });

            return NextResponse.json(
                { ok: true, message: "Product and variants updated" },
                { status: 200 }
            );
        }

        // CASE 2: Simple product (no variants)
        const { price, stock, status, name, description, tags, imageUrl, galleryUrls, attributes } =
            productData;

        const updatedProduct = await prisma.product.update({
            where: { id },
            data: {
                name,
                description,
                price: parseFloat(price),
                stock: parseInt(stock),
                status: Boolean(status),
                tags: tags ?? [],
                imageUrl: imageUrl ?? null,
                galleryUrls: galleryUrls ?? [],
                attributes: attributes ?? {},
                updatedAt: new Date(),
            },
        });

        return NextResponse.json(updatedProduct, { status: 200 });
    } catch (err) {
        console.error("Error updating product:", err);
        return NextResponse.json(
            { error: "Failed to update product" },
            { status: 500 }
        );
    }
}