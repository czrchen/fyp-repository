import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ✅ GET profile
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const user = await prisma.user.findUnique({
        where: { id },
        include: { addresses: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json(user);
}

// ✅ PATCH update profile
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const data = await req.json();

        // 🧠 Step 1: Update the user profile info only
        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                location: data.location,
                phone: data.phone,
            },
        });

        return new Response(JSON.stringify(updatedUser), { status: 200 });
    } catch (error) {
        console.error("Error updating profile:", error);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
}