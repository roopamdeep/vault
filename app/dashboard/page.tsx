"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { usePlaidLink, PlaidLinkOnSuccess } from "react-plaid-link";
import api from "@/lib/axios";
import SpendingChart from "@/components/SpendingChart";
import BudgetManager from "@/components/BudgetManager";

export default function DashboardPage() {
  const { user, accessToken } = useAuthStore();
  const router = useRouter();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalBalance: 0,
    monthlySpending: 0,
  });
  const [spendingData, setSpendingData] = useState<
    { name: string; value: number }[]
  >([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [forecast, setForecast] = useState<any>(null);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.push("/login");
      return;
    }
    getLinkToken();
    fetchTransactions("");
    fetchSummary();
    fetchSpendingData();
    fetchBudgets();
  }, [hydrated, user]);

  const getLinkToken = async () => {
    try {
      const res = await api.post(
        "/api/plaid/create-link-token",
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      setLinkToken(res.data.link_token);
    } catch (err) {
      console.error("Failed to get link token", err);
    }
  };

  const fetchTransactions = async (searchTerm = "") => {
    try {
      const res = await api.get(`/api/transactions?search=${searchTerm}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setTransactions(res.data.transactions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await api.get("/api/dashboard/summary", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setSummary(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSpendingData = async () => {
    try {
      const res = await api.get("/api/dashboard/spending-by-category", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setSpendingData(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBudgets = async () => {
    try {
      const res = await api.get("/api/budgets", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setBudgets(res.data.budgets);
      const totalBudget = res.data.budgets.reduce(
        (sum: number, b: any) => sum + b.limit,
        0,
      );
      if (totalBudget > 0) fetchForecast(totalBudget);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchForecast = async (totalBudget: number) => {
    try {
      const res = await api.post(
        "/api/ml/forecast",
        { budgetLimit: totalBudget },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      setForecast(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await api.post(
        "/api/ml/analyze",
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      setAnomalies(res.data.anomalies);
      fetchTransactions("");
      fetchSpendingData();
      alert(`Analysis complete! Found ${res.data.anomalies.length} anomalies.`);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const askAI = async () => {
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    setAiAnswer("");
    try {
      const res = await api.post(
        "/api/ai/insights",
        { question: aiQuestion },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      setAiAnswer(res.data.answer);
    } catch (err) {
      console.error(err);
      setAiAnswer("Sorry, AI insights are unavailable right now.");
    } finally {
      setAiLoading(false);
    }
  };

  const onSuccess = useCallback<PlaidLinkOnSuccess>(
    async (public_token) => {
      try {
        setSyncing(true);
        await api.post(
          "/api/plaid/exchange-token",
          { public_token },
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        const res = await api.post(
          "/api/plaid/sync-transactions",
          {},
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        alert(`Synced ${res.data.count} transactions!`);
        fetchTransactions("");
      } catch (err) {
        console.error(err);
      } finally {
        setSyncing(false);
      }
    },
    [accessToken],
  );

  const { open, ready } = usePlaidLink({ token: linkToken ?? "", onSuccess });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">🔐 Vault</h1>
        <div className="flex items-center gap-4">
          <span className="text-zinc-400 text-sm">Welcome, {user.name}</span>
          <button
            onClick={async () => {
              const res = await api.post(
                "/api/stripe/create-checkout",
                {},
                { headers: { Authorization: `Bearer ${accessToken}` } },
              );
              window.location.href = res.data.url;
            }}
            className="text-sm bg-violet-500 hover:bg-violet-400 text-white font-semibold rounded-xl px-4 py-1.5 transition-colors"
          >
            ⭐ Upgrade
          </button>
          <button
            onClick={runAnalysis}
            disabled={analyzing}
            className="text-sm bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold rounded-xl px-4 py-1.5 transition-colors"
          >
            {analyzing ? "Analyzing..." : "Run Analysis"}
          </button>
          <button
            onClick={() => {
              useAuthStore.getState().logout();
              router.push("/login");
            }}
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#111111] border border-zinc-800 rounded-2xl p-6">
            <p className="text-zinc-500 text-sm mb-1">Total Balance</p>
            <p className="text-3xl font-bold text-white">
              ${summary.totalBalance.toFixed(2)}
            </p>
            <p className="text-zinc-600 text-xs mt-1">Across all accounts</p>
          </div>
          <div className="bg-[#111111] border border-zinc-800 rounded-2xl p-6">
            <p className="text-zinc-500 text-sm mb-1">Monthly Spending</p>
            <p className="text-3xl font-bold text-white">
              ${summary.monthlySpending.toFixed(2)}
            </p>
            <p className="text-zinc-600 text-xs mt-1">Spent this month</p>
          </div>
          <div className="bg-[#111111] border border-zinc-800 rounded-2xl p-6">
            <p className="text-zinc-500 text-sm mb-1">Monthly Budget</p>
            <p className="text-3xl font-bold text-emerald-400">
              ${budgets.reduce((sum, b) => sum + b.limit, 0).toFixed(2)}
            </p>
            <p className="text-zinc-600 text-xs mt-1">Total budget set</p>
          </div>
        </div>

        {forecast && (
          <div
            className={`border rounded-2xl p-6 mb-8 ${forecast.on_track ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"}`}
          >
            <h2
              className={`text-lg font-semibold mb-2 ${forecast.on_track ? "text-emerald-400" : "text-red-400"}`}
            >
              {forecast.on_track ? "✅ Budget Forecast" : "⚠️ Budget Forecast"}
            </h2>
            <p
              className={`text-sm ${forecast.on_track ? "text-emerald-300" : "text-red-300"}`}
            >
              {forecast.message}
            </p>
          </div>
        )}

        <div className="bg-[#111111] border border-zinc-800 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">
            Spending by Category
          </h2>
          <SpendingChart data={spendingData} />
        </div>

        <div className="bg-[#111111] border border-zinc-800 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">
            Monthly Budgets
          </h2>
          <BudgetManager budgets={budgets} onBudgetSaved={fetchBudgets} />
        </div>

        {anomalies.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-red-400 mb-4">
              ⚠️ Anomalies Detected
            </h2>
            <div className="space-y-2">
              {anomalies.map((anomaly, i) => (
                <div key={i} className="text-red-300 text-sm">
                  • {anomaly.reason}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-[#111111] border border-zinc-800 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">
            🧠 AI Financial Insights
          </h2>
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && askAI()}
              placeholder="Ask anything... e.g. Why did I overspend this month?"
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 text-sm"
            />
            <button
              onClick={askAI}
              disabled={aiLoading}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold rounded-xl px-5 py-3 text-sm transition-colors"
            >
              {aiLoading ? "Thinking..." : "Ask"}
            </button>
          </div>
          {aiAnswer && (
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4">
              <p className="text-zinc-300 text-sm leading-relaxed">
                {aiAnswer}
              </p>
            </div>
          )}
        </div>

        <div className="bg-[#111111] border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Recent Transactions
          </h2>
          <div className="mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                fetchTransactions(e.target.value);
              }}
              placeholder="Search transactions..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <p className="text-zinc-500 text-sm">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-zinc-500 text-sm">No transactions yet</p>
              <p className="text-zinc-600 text-xs mt-1">
                Connect your bank account to see transactions
              </p>
              <button
                onClick={() => open()}
                disabled={!ready || syncing}
                className="mt-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold rounded-xl px-6 py-2.5 text-sm transition-colors"
              >
                {syncing ? "Syncing..." : "Connect Bank"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-0"
                >
                  <div>
                    <p className="text-white text-sm font-medium">
                      {txn.merchant}
                    </p>
                    <p className="text-zinc-500 text-xs mt-0.5">
                      {txn.category} • {new Date(txn.date).toLocaleDateString()}
                    </p>
                  </div>
                  <p
                    className={`text-sm font-semibold ${txn.amount > 0 ? "text-red-400" : "text-emerald-400"}`}
                  >
                    {txn.amount > 0 ? "-" : "+"}$
                    {Math.abs(txn.amount).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
