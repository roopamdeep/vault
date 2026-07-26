import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = verifyAccessToken(token);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        amount: { gt: 0 },
      },
    });

    // Group by category
    const categoryMap: Record<string, number> = {};
    for (const txn of transactions) {
      const cat = txn.category ?? "Other";
      categoryMap[cat] = (categoryMap[cat] ?? 0) + txn.amount;
    }

    const data = Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
    }));

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch spending data" },
      { status: 500 },
    );
  }
}
