import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    const { token, newPassword } = await req.json();

    const record = await prisma.passwordResetToken.findFirst({
        where: { token },
    });

    if (!record) {
        return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    if (record.expiresAt < new Date()) {
        return NextResponse.json({ error: "Token expired" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { email: record.email },
        data: { password: hashed },
    });

    await prisma.passwordResetToken.delete({
        where: { id: record.id },
    });

    return NextResponse.json({ message: "Password updated successfully." });
}
