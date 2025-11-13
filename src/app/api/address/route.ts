import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const data = await req.json();

        // Validate required fields
        if (!data.userId || !data.street || !data.city || !data.state) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const newAddress = await prisma.address.create({
            data: {
                userId: data.userId,
                label: data.label ?? "Default",
                street: data.street,
                city: data.city,
                state: data.state,
                postcode: data.postcode ?? null,
                country: data.country ?? null,
            },
        });

        return NextResponse.json(newAddress, { status: 201 });
    } catch (error) {
        console.error("Error creating address:", error);
        return NextResponse.json(
            { error: "Failed to create address" },
            { status: 500 }
        );
    }
}
