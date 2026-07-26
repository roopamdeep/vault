"use client";

import { useState } from "react";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";

const CATEGORIES = [
  "FOOD_AND_DRINK",
  "TRANSPORTATION",
  "RENT_AND_UTILITIES",
  "GENERAL_MERCHANDISE",
  "ENTERTAINMENT",
  "PERSONAL_CARE",
  "LOAN_PAYMENTS",
  "TRAVEL",
  "OTHER",
];

interface Budget {
  id: string;
  category: string;
  limit: number;
}

interface Props {
  budgets: Budget[];
  onBudgetSaved: () => void;
}

export default function BudgetManager({ budgets, onBudgetSaved }: Props) {
  const { accessToken } = useAuthStore();
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [limit, setLimit] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!limit || isNaN(Number(limit))) return;
    setSaving(true);
    try {
      await api.post(
        "/api/budgets",
        { category, limit: Number(limit) },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      setLimit("");
      onBudgetSaved();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Set Budget Form */}
      <div className="flex gap-3 mb-6">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 flex-1"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          placeholder="Budget limit $"
          className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 w-40"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold rounded-xl px-5 py-2.5 text-sm transition-colors"
        >
          {saving ? "Saving..." : "Set Budget"}
        </button>
      </div>

      {/* Budget List */}
      {budgets.length === 0 ? (
        <p className="text-zinc-500 text-sm text-center py-6">
          No budgets set yet
        </p>
      ) : (
        <div className="space-y-3">
          {budgets.map((budget) => (
            <div
              key={budget.id}
              className="flex items-center justify-between py-2"
            >
              <p className="text-white text-sm">
                {budget.category.replace(/_/g, " ")}
              </p>
              <p className="text-emerald-400 text-sm font-semibold">
                ${budget.limit.toFixed(2)} limit
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
