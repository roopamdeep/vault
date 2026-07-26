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

    // Total balance across all accounts
    const accounts = await prisma.account.findMany({
      where: { userId },
    });
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    // Monthly spending
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: startOfMonth },
        amount: { gt: 0 },
      },
    });

    const monthlySpending = monthlyTransactions.reduce(
      (sum, txn) => sum + txn.amount,
      0,
    );

    return NextResponse.json({ totalBalance, monthlySpending });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch summary" },
      { status: 500 },
    );
  }
}
