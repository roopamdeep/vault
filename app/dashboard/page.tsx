"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect, useCallback, useState } from "react";
import { usePlaidLink, PlaidLinkOnSuccess } from "react-plaid-link";
import axios from "axios";

export default function DashboardPage() {
  const { user, accessToken } = useAuthStore();
  const router = useRouter();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    getLinkToken();
    fetchTransactions();
  }, [user]);

  const getLinkToken = async () => {
    try {
      const res = await axios.post(
        "/api/plaid/create-link-token",
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      setLinkToken(res.data.link_token);
    } catch (err) {
      console.error("Failed to get link token", err);
    }
  };
  const fetchTransactions = async () => {
    try {
      const res = await axios.get("/api/transactions", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setTransactions(res.data.transactions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const onSuccess = useCallback<PlaidLinkOnSuccess>(
    async (public_token, metadata) => {
      try {
        setSyncing(true);
        await axios.post(
          "/api/plaid/exchange-token",
          { public_token },
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        const res = await axios.post(
          "/api/plaid/sync-transactions",
          {},
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        alert(`Synced ${res.data.count} transactions!`);
        fetchTransactions();
      } catch (err) {
        console.error(err);
      } finally {
        setSyncing(false);
      }
    },
    [accessToken],
  );
  const { open, ready } = usePlaidLink({
    token: linkToken ?? "",
    onSuccess,
  });
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">🔐 Vault</h1>
        <div className="flex items-center gap-4">
          <span className="text-zinc-400 text-sm">Welcome, {user.name}</span>
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
            <p className="text-3xl font-bold text-white">$0.00</p>
            <p className="text-zinc-600 text-xs mt-1">
              Connect a bank to get started
            </p>
          </div>
          <div className="bg-[#111111] border border-zinc-800 rounded-2xl p-6">
            <p className="text-zinc-500 text-sm mb-1">Monthly Spending</p>
            <p className="text-3xl font-bold text-white">$0.00</p>
            <p className="text-zinc-600 text-xs mt-1">No transactions yet</p>
          </div>
          <div className="bg-[#111111] border border-zinc-800 rounded-2xl p-6">
            <p className="text-zinc-500 text-sm mb-1">Monthly Budget</p>
            <p className="text-3xl font-bold text-emerald-400">$0.00</p>
            <p className="text-zinc-600 text-xs mt-1">Set a budget to track</p>
          </div>
        </div>
        <div className="bg-[#111111] border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Recent Transactions
          </h2>
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
