// app/api/search-history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // adjust to your NextAuth options file

// ✅ Fetch last 5 searches for the logged-in user
export async function GET() {
    try {
        const cookieStore = await cookies();
        const cookieString = cookieStore.toString();

        // ✅ Fetch current user session
        const res = await fetch(`${process.env.NEXTAUTH_URL}/api/user/current`, {
            headers: { Cookie: cookieString },
            cache: "no-store",
        });

        if (!res.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await res.json();
        if (!user?.id) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const items = await prisma.searchHistory.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            take: 5,
        });

        return NextResponse.json(items);
    } catch (error) {
        console.error("❌ Fetch search history error:", error);
        return NextResponse.json({ error: "Failed to load search history" }, { status: 500 });
    }
}

// ✅ Save a new search term for the logged-in user
export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const cookieString = cookieStore.toString();

        // ✅ Fetch current user session
        const res = await fetch(`${process.env.NEXTAUTH_URL}/api/user/current`, {
            headers: { Cookie: cookieString },
            cache: "no-store",
        });

        if (!res.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await res.json();
        if (!user?.id) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { keyword } = await req.json();
        const clean = String(keyword ?? "").trim();
        if (!clean) return NextResponse.json({ ok: false }, { status: 400 });

        const userId = user.id;

        // Remove duplicates
        await prisma.searchHistory.deleteMany({ where: { userId, keyword: clean } });

        // Add new record
        await prisma.searchHistory.create({ data: { userId, keyword: clean } });

        // Keep only latest 5
        const old = await prisma.searchHistory.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            skip: 5,
            take: 9999,
            select: { id: true },
        });
        if (old.length) {
            await prisma.searchHistory.deleteMany({ where: { id: { in: old.map(o => o.id) } } });
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("❌ Push History error:", error);
        return NextResponse.json({ error: "Failed to push search history" }, { status: 500 });
    }


}
