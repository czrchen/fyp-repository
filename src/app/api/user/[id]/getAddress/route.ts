import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    context: { params: Promise<{ id: string }> } // 👈 params must be awaited
) {
    const { id } = await context.params; // ✅ await it properly

    if (!id) {
        return new Response(
            JSON.stringify({ error: "Missing user ID" }),
            { status: 400 }
        );
    }

    try {
        const list = await prisma.address.findMany({
            where: { userId: id },
            orderBy: { id: "asc" },
        });

        return new Response(JSON.stringify(list), { status: 200 });
    } catch (e) {
        console.error("GET /addresses error:", e);
        return new Response(
            JSON.stringify({ error: "Failed to fetch addresses" }),
            { status: 500 }
        );
    }
}
