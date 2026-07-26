"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();
  const router = useRouter();

  const handleRegister = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post("/api/auth/register", {
        name,
        email,
        password,
      });
      setUser(res.data.user, res.data.accessToken, res.data.refreshToken);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            🔐 Vault
          </h1>
          <p className="text-zinc-500 mt-2 text-sm">
            Your personal finance command center
          </p>
        </div>
        <div className="bg-[#111111] border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">
            Create your account
          </h2>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3 mb-6">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="text-zinc-400 text-sm mb-1.5 block">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Smith"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
              />
            </div>
            <div>
              <label className="text-zinc-400 text-sm mb-1.5 block">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
              />
            </div>
            <div>
              <label className="text-zinc-400 text-sm mb-1.5 block">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
              />
            </div>
            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold rounded-xl py-3 transition-colors text-sm mt-2"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </div>
          <p className="text-zinc-500 text-sm text-center mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-emerald-400 hover:text-emerald-300"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
