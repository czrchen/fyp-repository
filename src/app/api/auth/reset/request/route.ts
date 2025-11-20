export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
    const { email } = await req.json();

    const user = await prisma.user.findUnique({ where: { email } });

    // Always same response for security
    if (!user) {
        return NextResponse.json({
            message: "If the email exists, we sent a reset link."
        });
    }

    const token = crypto.randomBytes(32).toString("hex");

    await prisma.passwordResetToken.create({
        data: {
            email,
            token,
            expiresAt: new Date(Date.now() + 1000 * 60 * 30), // 30 min
        },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    await transporter.sendMail({
        to: email,
        from: process.env.SMTP_EMAIL,
        subject: "Reset Password",
        html: `
      <p>You requested to reset your password.</p>
      <p>Click below to reset:</p>
      <a href="${resetUrl}">${resetUrl}</a>
    `,
    });

    return NextResponse.json({
        message: "Reset link sent to your email.",
    });
}
