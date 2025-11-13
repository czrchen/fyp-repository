import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ✅ GET profile
export async function GET(req: Request, { params }: { params: { id: string } }) {
    const user = await prisma.user.findUnique({
        where: { id: params.id },
        include: { addresses: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json(user);
}

// ✅ PATCH update profile
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const data = await req.json();

        // 🧠 Step 1: Update the user profile info only
        const updatedUser = await prisma.user.update({
            where: { id: params.id },
            data: {
                gender: data.gender,
                dob: data.dob,
                location: data.location,
                phone: data.phone,
                income_level: data.income_level,
                interests: data.interests,
                profile_completed: true, // mark as completed
            },
        });

        // 🏗️ Step 2: Create a single address (user input)
        if (data.address) {
            const addr = data.address;

            await prisma.address.create({
                data: {
                    userId: params.id,          // connect to user
                    street: addr.street,
                    city: addr.city,
                    state: addr.state,
                    postcode: addr.postcode,
                    country: addr.country,
                    label: addr.label ?? "Default",
                },
            });
        }

        return new Response(JSON.stringify(updatedUser), { status: 200 });
    } catch (error) {
        console.error("Error updating profile:", error);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
}
