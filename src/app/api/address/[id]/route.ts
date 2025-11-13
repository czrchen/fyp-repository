import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const data = await req.json();

        // Validate
        if (!params.id) {
            return NextResponse.json({ error: "Missing address ID" }, { status: 400 });
        }

        const updated = await prisma.address.update({
            where: { id: Number(params.id) },
            data: {
                label: data.label ?? null,
                street: data.street,
                city: data.city,
                state: data.state,
                postcode: data.postcode ?? null,
                country: data.country ?? null,
            },
        });

        return NextResponse.json(updated, { status: 200 });
    } catch (error) {
        console.error("Error updating address:", error);
        return NextResponse.json(
            { error: "Failed to update address" },
            { status: 500 }
        );
    }
}
