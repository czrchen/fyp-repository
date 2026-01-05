import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const data = await req.json();

        if (!id) {
            return NextResponse.json(
                { error: "Missing address ID" },
                { status: 400 }
            );
        }

        const addressId = Number(id);

        // Fetch the address (to get userId)
        const currentAddress = await prisma.address.findUnique({
            where: { id: addressId },
            select: { id: true, userId: true, label: true },
        });

        if (!currentAddress) {
            return NextResponse.json(
                { error: "Address not found" },
                { status: 404 }
            );
        }

        const userId = currentAddress.userId;
        const newLabel = data.label ?? currentAddress.label;

        // Run all logic in a transaction
        const updatedAddress = await prisma.$transaction(async (tx) => {
            // Case A: Setting this address as Default
            if (newLabel === "Default") {
                // Remove Default from all other addresses of this user
                await tx.address.updateMany({
                    where: {
                        userId,
                        id: { not: addressId },
                        label: "Default",
                    },
                    data: { label: "Others" },
                });
            }

            // Case B: Removing Default from this address
            if (
                currentAddress.label === "Default" &&
                newLabel !== "Default"
            ) {
                // Count other Default addresses
                const defaultCount = await tx.address.count({
                    where: {
                        userId,
                        label: "Default",
                        id: { not: addressId },
                    },
                });

                if (defaultCount === 0) {
                    throw new Error("At least one Default address is required");
                }
            }

            // Update the address
            return tx.address.update({
                where: { id: addressId },
                data: {
                    label: newLabel,
                    street: data.street,
                    city: data.city,
                    state: data.state,
                    postcode: data.postcode ?? null,
                    country: data.country ?? null,
                },
            });
        });

        return NextResponse.json(updatedAddress, { status: 200 });
    } catch (error: any) {
        console.error("Error updating address:", error);

        // Friendly validation error
        if (error.message?.includes("Default")) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Failed to update address" },
            { status: 500 }
        );
    }
}
