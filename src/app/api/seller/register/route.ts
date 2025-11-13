import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { userId, store_name, store_description, store_logo } = await req.json();

        if (!userId || !store_name) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const existing = await prisma.seller.findUnique({ where: { userId } });
        if (existing) {
            return NextResponse.json({ error: "User already has a seller profile" }, { status: 400 });
        }

        const seller = await prisma.seller.create({
            data: {
                userId,
                store_name,
                store_description,
                store_logo,
            },
        });

        // update user.isSeller to true
        await prisma.user.update({
            where: { id: userId },
            data: { isSeller: true },
        });

        return NextResponse.json(seller, { status: 201 });
    } catch (error) {
        console.error("Error registering seller:", error);
        return NextResponse.json({ error: "Failed to register seller" }, { status: 500 });
    }
}
