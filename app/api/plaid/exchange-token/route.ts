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
    const { public_token } = await req.json();

    // Swap public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    // Get account details from Plaid
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    const accounts = accountsResponse.data.accounts;

    // Save each account to database
    for (const account of accounts) {
      await prisma.account.upsert({
        where: { plaidAccountId: account.account_id },
        update: {
          balance: account.balances.current ?? 0,
        },
        create: {
          userId,
          plaidAccountId: account.account_id,
          name: account.name,
          type: account.type,
          balance: account.balances.current ?? 0,
        },
      });
    }

    // Save access token to user (we need to add this field)
    await prisma.user.update({
      where: { id: userId },
      data: { plaidAccessToken: accessToken },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to exchange token" },
      { status: 500 },
    );
  }
}
