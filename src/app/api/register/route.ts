import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { full_name, email, password } = body;

        if (!full_name || !email || !password) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // Check if user already exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: "Email already registered" }, { status: 400 });
        }

        // Hash password
        const hashed = await bcrypt.hash(password, 10);

        // Create user
        const newUser = await prisma.user.create({
            data: {
                full_name,
                email,
                password: hashed,
                interests: [],
                isGoogleSignIn: false,
            },
        });

        return NextResponse.json({ user: newUser }, { status: 201 });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
