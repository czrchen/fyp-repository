// app/api/search-history/[keyword]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";


//  DELETE: remove a specific keyword for this user
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ keyword: string }> }
) {
    try {
        const params = await context.params; //  await params
        const cookieStore = await cookies();
        const cookieString = cookieStore.toString();

        //  Fetch current user session
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

        const decoded = decodeURIComponent(params.keyword);
        await prisma.searchHistory.deleteMany({
            where: {
                userId: user.id,
                keyword: decoded,
            },
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error(" Fetch search history error:", error);
        return NextResponse.json({ error: "Failed to load search history" }, { status: 500 });
    }
}
