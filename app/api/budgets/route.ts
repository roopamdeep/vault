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

    const now = new Date();
    const budgets = await prisma.budget.findMany({
      where: { userId, month: now.getMonth() + 1, year: now.getFullYear() },
    });

    return NextResponse.json({ budgets });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch budgets" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { userId } = verifyAccessToken(token);
    const { category, limit } = await req.json();

    const now = new Date();
    const budget = await prisma.budget.upsert({
      where: {
        userId_category_month_year: {
          userId,
          category,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        },
      },
      update: { limit },
      create: {
        userId,
        category,
        limit,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      },
    });

    return NextResponse.json({ budget });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to save budget" },
      { status: 500 },
    );
  }
}
