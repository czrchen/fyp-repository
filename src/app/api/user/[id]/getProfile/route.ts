import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> } // 👈 params must be awaited
) {
  const { id } = await context.params; // ✅ await it properly

  try {
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }

    return new Response(JSON.stringify(user), { status: 200 });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch profile" }),
      { status: 500 }
    );
  }
}