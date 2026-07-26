import { NextRequest, NextResponse } from "next/server";
import { plaidClient } from "@/lib/plaid";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = verifyAccessToken(token);

    // Get user's Plaid access token
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.plaidAccessToken) {
      return NextResponse.json({ error: "No bank connected" }, { status: 400 });
    }

    // Get transactions from Plaid (last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const response = await plaidClient.transactionsGet({
      access_token: user.plaidAccessToken,
      start_date: thirtyDaysAgo.toISOString().split("T")[0],
      end_date: now.toISOString().split("T")[0],
    });

    const transactions = response.data.transactions;

    // Get user's accounts
    const accounts = await prisma.account.findMany({
      where: { userId },
    });

    const accountMap = new Map(accounts.map((a) => [a.plaidAccountId, a.id]));

    // Save transactions to database
    for (const txn of transactions) {
      const accountId = accountMap.get(txn.account_id);
      if (!accountId) continue;

      await prisma.transaction.upsert({
        where: { plaidTransactionId: txn.transaction_id },
        update: {},
        create: {
          userId,
          accountId,
          plaidTransactionId: txn.transaction_id,
          amount: txn.amount,
          category: txn.personal_finance_category?.primary ?? "Other",
          merchant: txn.merchant_name ?? txn.name,
          date: new Date(txn.date),
        },
      });
    }

    return NextResponse.json({
      success: true,
      count: transactions.length,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to sync transactions" },
      { status: 500 },
    );
  }
}
