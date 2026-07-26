"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Navbar */}
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

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Summary Cards */}
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

        {/* Recent Transactions */}
        <div className="bg-[#111111] border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Recent Transactions
          </h2>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-zinc-500 text-sm">No transactions yet</p>
            <p className="text-zinc-600 text-xs mt-1">
              Connect your bank account to see transactions
            </p>
            <button className="mt-4 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl px-6 py-2.5 text-sm transition-colors">
              Connect Bank
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
