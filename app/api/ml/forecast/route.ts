import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { userId } = verifyAccessToken(token);
    const { budgetLimit } = await req.json();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const transactions = await prisma.transaction.findMany({
      where: { userId, date: { gte: startOfMonth }, amount: { gt: 0 } },
    });

    const txnPayload = transactions.map((t) => ({
      id: t.id,
      amount: t.amount,
      merchant: t.merchant ?? "Unknown",
      category: t.category ?? "OTHER",
      date: t.date.toISOString(),
    }));

    const res = await fetch("http://localhost:8001/forecast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transactions: txnPayload,
        budget_limit: budgetLimit,
        days_in_month: 30,
      }),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Forecast failed" }, { status: 500 });
  }
}
