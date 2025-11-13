import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        console.log("🔍 Fetching current user...");

        // 1️⃣ Get logged-in session
        const session = await getServerSession(authOptions);
        console.log("📧 Session email:", session?.user?.email);

        const email = session?.user?.email;

        if (!email) {
            console.log("❌ No email in session");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2️⃣ Look up user by email
        console.log("🔎 Looking up user:", email);
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                full_name: true,
                email: true,
                profile_completed: true,
                addresses: {
                    select: {
                        id: true,
                        label: true,
                        street: true,
                        city: true,
                        state: true,
                        postcode: true,
                        country: true,
                    },
                },
            },
        });

        if (!user) {
            console.log("❌ User not found in database");
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        console.log("✅ User found:", user.id);
        return NextResponse.json(user);
    } catch (error) {
        console.error("💥 Error fetching current user:", error);
        // Return detailed error in development
        return NextResponse.json({
            error: "Internal server error",
            details: process.env.NODE_ENV === 'development' ? String(error) : undefined
        }, { status: 500 });
    }
}