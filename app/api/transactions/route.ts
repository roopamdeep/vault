import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { userId } = verifyAccessToken(token);
    const search = req.nextUrl.searchParams.get("search") ?? "";

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        ...(search
          ? {
              merchant: { contains: search, mode: "insensitive" },
            }
          : {}),
      },
      orderBy: { date: "desc" },
      take: 20,
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 },
    );
  }
}
