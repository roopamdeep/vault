import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { userId } = verifyAccessToken(token);
    const { question } = await req.json();

    // Get user's recent transactions
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 50,
    });

    // Get budgets
    const budgets = await prisma.budget.findMany({
      where: { userId },
    });

    // Build summary for OpenAI
    const totalSpending = transactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const categoryBreakdown = transactions
      .filter((t) => t.amount > 0)
      .reduce((acc: Record<string, number>, t) => {
        const cat = t.category ?? "Other";
        acc[cat] = (acc[cat] ?? 0) + t.amount;
        return acc;
      }, {});

    const topTransactions = transactions
      .slice(0, 10)
      .map((t) => `${t.merchant}: $${t.amount.toFixed(2)} (${t.category})`)
      .join("\n");

    const budgetSummary = budgets
      .map((b) => `${b.category}: $${b.limit} limit`)
      .join("\n");

    const prompt = `You are a helpful personal finance advisor. Here is the user's financial data:

Total spending (last 50 transactions): $${totalSpending.toFixed(2)}

Spending by category:
${Object.entries(categoryBreakdown)
  .map(([cat, amount]) => `${cat}: $${amount.toFixed(2)}`)
  .join("\n")}

Recent transactions:
${topTransactions}

Monthly budgets:
${budgetSummary || "No budgets set"}

User question: ${question}

Please provide a clear, friendly, and actionable response in 2-3 sentences.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
    });

    const answer = completion.choices[0].message.content;

    return NextResponse.json({ answer });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "AI insights failed" }, { status: 500 });
  }
}
