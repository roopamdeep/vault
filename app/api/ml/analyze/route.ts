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

    // Get user's transactions
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 50,
    });

    const txnPayload = transactions.map((t) => ({
      id: t.id,
      amount: t.amount,
      merchant: t.merchant ?? "Unknown",
      category: t.category ?? "OTHER",
      date: t.date.toISOString(),
    }));

    // Call Python microservice
    const [categorizeRes, anomalyRes] = await Promise.all([
      fetch("http://localhost:8001/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions: txnPayload }),
      }),
      fetch("http://localhost:8001/detect-anomalies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions: txnPayload }),
      }),
    ]);

    const categorizeData = await categorizeRes.json();
    const anomalyData = await anomalyRes.json();

    // Update categories in database
    for (const result of categorizeData.results) {
      await prisma.transaction.update({
        where: { id: result.id },
        data: { category: result.category },
      });
    }

    // Update anomalies in database
    for (const anomaly of anomalyData.anomalies) {
      await prisma.transaction.update({
        where: { id: anomaly.id },
        data: { isAnomaly: true },
      });
    }

    return NextResponse.json({
      categorized: categorizeData.results.length,
      anomalies: anomalyData.anomalies,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
