import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function DELETE(req: Request) {
    try {
        // ✅ 1. Get current logged-in user from cookies
        const cookieStore = await cookies();
        const cookieString = cookieStore.toString();

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

        // ✅ 2. Extract cart item ID from query parameters
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Missing cart item ID" }, { status: 400 });
        }

        // ✅ 3. Ensure the item belongs to the current user (security check)
        const cartItem = await prisma.cartItem.findUnique({
            where: { id },
        });

        if (!cartItem || cartItem.userId !== user.id) {
            return NextResponse.json({ error: "Item not found or unauthorized" }, { status: 404 });
        }

        // ✅ 4. Delete the item
        await prisma.cartItem.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Item deleted successfully" });
    } catch (error) {
        console.error("❌ Delete cart error:", error);
        return NextResponse.json(
            { error: "Failed to delete cart item" },
            { status: 500 }
        );
    }
}
