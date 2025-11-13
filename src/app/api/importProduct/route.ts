// app/api/admin/importFashion/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function POST() {
    try {
        // 📂 Load JSON file from /data/fashion_clean.json
        const filePath = path.join(process.cwd(), "data", "fashion_clean.json");
        const jsonData = fs.readFileSync(filePath, "utf-8");
        const products = JSON.parse(jsonData);

        // 🪄 Insert into DB
        const result = await prisma.product.createMany({
            data: products,
            skipDuplicates: true,
        });

        return NextResponse.json({ inserted: result.count });
    } catch (err) {
        console.error("❌ Import error:", err);
        return NextResponse.json({ error: "Import failed" }, { status: 500 });
    }
}
