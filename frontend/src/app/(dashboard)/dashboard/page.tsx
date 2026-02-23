"use client";

import { useState, useEffect, useMemo } from "react";
import { walletApi, transactionApi, userApi, bankAccountApi } from "@/lib/api";
import type { LedgerEntryResponse, UserProfileResponse, BankAccountResponse } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

const TIER_LIMITS = {
  FREE: { daily: 25000, monthly: 200000 },
  PREMIUM: { daily: 75000, monthly: 1000000 },
};

const TYPE_COLORS: Record<string, string> = {
  TOPUP: "#10b981",
  P2P: "#3b82f6",
  WITHDRAW: "#f59e0b",
  REVERSAL: "#8b5cf6",
  FEE: "#ef4444",
};

const TYPE_LABELS: Record<string, string> = {
  TOPUP: "Top Up",
  P2P: "Transfer",
  WITHDRAW: "Payout",
  REVERSAL: "Reversal",
  FEE: "Fee",
};

function txnLabel(type: string, dir: string) {
  return TYPE_LABELS[type] || (dir === "CREDIT" ? "Received" : "Sent");
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

const fadeUp = {
  hidden: (i: number) => ({ opacity: 0, y: 16, transition: { delay: i * 0.06 } }),
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

export default function DashboardPage() {
  const [wallet, setWallet] = useState<{ walletId: number; balance: number; currency: string; status: string } | null>(null);
  const [ledger, setLedger] = useState<LedgerEntryResponse[]>([]);
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccountResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState<"7d" | "30d" | "all">("30d");
  const [now] = useState(() => new Date());

  useEffect(() => {
    Promise.all([
      walletApi.getMyWallet().catch(() => null),
      transactionApi.getHistory().catch(() => []),
      userApi.getMe().catch(() => null),
      bankAccountApi.list().catch(() => []),
    ]).then(([w, l, p, b]) => {
      setWallet(w);
      setLedger((l as LedgerEntryResponse[]) || []);
      setProfile(p);
      setBankAccounts(b as BankAccountResponse[]);
      setIsLoading(false);
    });
  }, []);

  const recentTxns = useMemo(() => ledger.slice(0, 8), [ledger]);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    let totalInflow = 0;
    let totalOutflow = 0;
    let todayInflow = 0;
    let todayOutflow = 0;
    let thisWeekInflow = 0;
    let lastWeekInflow = 0;
    let thisWeekOutflow = 0;
    let lastWeekOutflow = 0;

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    let thisMonthInflow = 0;
    let thisMonthOutflow = 0;
    let lastMonthInflow = 0;
    let lastMonthOutflow = 0;

    for (const e of ledger) {
      const d = new Date(e.createdAt);
      if (e.direction === "CREDIT") {
        totalInflow += e.amount;
        if (d >= today) todayInflow += e.amount;
        if (d >= weekAgo) thisWeekInflow += e.amount;
        else if (d >= twoWeeksAgo) lastWeekInflow += e.amount;
        if (d >= monthStart) thisMonthInflow += e.amount;
        else if (d >= lastMonthStart && d <= lastMonthEnd) lastMonthInflow += e.amount;
      } else {
        totalOutflow += e.amount;
        if (d >= today) todayOutflow += e.amount;
        if (d >= weekAgo) thisWeekOutflow += e.amount;
        else if (d >= twoWeeksAgo) lastWeekOutflow += e.amount;
        if (d >= monthStart) thisMonthOutflow += e.amount;
        else if (d >= lastMonthStart && d <= lastMonthEnd) lastMonthOutflow += e.amount;
      }
    }

    const pct = (curr: number, prev: number) =>
      prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100;

    return {
      totalInflow,
      totalOutflow,
      todayInflow,
      todayOutflow,
      txnCount: ledger.length,
      thisMonthInflow,
      thisMonthOutflow,
      monthlyInflowChange: pct(thisMonthInflow, lastMonthInflow),
      monthlyOutflowChange: pct(thisMonthOutflow, lastMonthOutflow),
      inflowTrend: {
        pct: Math.abs(pct(thisWeekInflow, lastWeekInflow)),
        dir: thisWeekInflow >= lastWeekInflow ? ("up" as const) : ("down" as const),
      },
      outflowTrend: {
        pct: Math.abs(pct(thisWeekOutflow, lastWeekOutflow)),
        dir: thisWeekOutflow >= lastWeekOutflow ? ("up" as const) : ("down" as const),
      },
    };
  }, [ledger]);

  const cashflowData = useMemo(() => {
    const dayMap = new Map<string, { income: number; expense: number }>();
    const cutoff = new Date(now);
    if (chartPeriod === "7d") cutoff.setDate(cutoff.getDate() - 7);
    else if (chartPeriod === "30d") cutoff.setDate(cutoff.getDate() - 30);
    else cutoff.setTime(0);

    for (const e of ledger) {
      const d = new Date(e.createdAt);
      if (d < cutoff) continue;
      const key = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      const existing = dayMap.get(key) || { income: 0, expense: 0 };
      if (e.direction === "CREDIT") existing.income += e.amount;
      else existing.expense += e.amount;
      dayMap.set(key, existing);
    }

    return Array.from(dayMap.entries())
      .map(([date, v]) => ({ date, income: v.income, expense: v.expense }))
      .reverse();
  }, [ledger, chartPeriod, now]);

  const limitUsage = useMemo(() => {
    if (!profile) return null;
    const tier = profile.tier === "PREMIUM" || profile.tier === "ADMIN" ? "PREMIUM" : "FREE";
    const limits = TIER_LIMITS[tier];
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);

    let dailyUsed = 0;
    let monthlyUsed = 0;
    for (const e of ledger) {
      if (e.direction !== "DEBIT") continue;
      const d = new Date(e.createdAt);
      if (d >= todayStart) dailyUsed += e.amount;
      if (d >= monthStart) monthlyUsed += e.amount;
    }

    return {
      tier,
      daily: { used: dailyUsed, limit: limits.daily, pct: Math.min((dailyUsed / limits.daily) * 100, 100) },
      monthly: { used: monthlyUsed, limit: limits.monthly, pct: Math.min((monthlyUsed / limits.monthly) * 100, 100) },
    };
  }, [ledger, profile]);

  const onboardingSteps = useMemo(() => {
    if (!profile) return null;
    const steps = [
      { label: "Create account", done: true },
      { label: "Verify phone", done: !!profile.phoneVerified },
      { label: "Add money", done: ledger.some((e) => e.txnType === "TOPUP") },
      { label: "Link bank account", done: bankAccounts.length > 0 },
      { label: "Send your first transfer", done: ledger.some((e) => e.txnType === "P2P" && e.direction === "DEBIT") },
    ];
    const completed = steps.filter((s) => s.done).length;
    if (completed === steps.length) return null;
    return { steps, completed, total: steps.length };
  }, [profile, ledger, bankAccounts]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="h-56 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-56 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-56 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
        <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  const displayName = profile?.email?.split("@")[0] || "there";
  const cardBalance = formatCurrency(wallet?.balance || 0, wallet?.currency || "INR");

  return (
    <div className="space-y-6 pb-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-[28px] lg:text-[32px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Welcome, {displayName}{" "}
            <span className="inline-block animate-bounce" role="img" aria-label="fire">
              &#128293;
            </span>
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 font-medium">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {profile?.id && (
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(String(profile.id));
                toast.success("User ID copied!", {
                  description: `Share #${profile.id} with others to receive transfers.`,
                });
              }}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              ID: #{profile.id}
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-lg shadow-blue-600/20"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </button>
        </div>
      </motion.div>

      {onboardingSteps && (
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
          <div className="bg-white dark:bg-[#0f1629] rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm shadow-slate-200/50 dark:shadow-none overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80">
              <div>
                <h2 className="text-[15px] font-bold text-slate-900 dark:text-white">Get Started</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {onboardingSteps.completed} of {onboardingSteps.total} completed
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-28 h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-blue-500"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(onboardingSteps.completed / onboardingSteps.total) * 100}%`,
                    }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-500 tabular-nums">
                  {Math.round((onboardingSteps.completed / onboardingSteps.total) * 100)}%
                </span>
              </div>
            </div>
            <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {onboardingSteps.steps.map((step, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                    step.done
                      ? "border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/20"
                      : "border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      step.done
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {step.done ? (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <span className="text-[10px] font-bold">{i + 1}</span>
                    )}
                  </div>
                  <span
                    className={`text-[12px] font-medium ${
                      step.done
                        ? "text-emerald-700 dark:text-emerald-400 line-through"
                        : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
          <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 lg:p-7 overflow-hidden shadow-xl shadow-blue-600/20 h-full flex flex-col justify-between min-h-[220px]">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-12 translate-x-12" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-10 -translate-x-8" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <p className="text-blue-200 text-sm font-medium">My Balance</p>
                <div className="flex items-center gap-1">
                  <span className="w-8 h-5 rounded-sm bg-amber-400/80" />
                  <span className="w-5 h-5 rounded-full bg-red-400/60 -ml-2" />
                </div>
              </div>
              <p className="text-[36px] lg:text-[42px] font-extrabold text-white mt-2 tracking-tight leading-none tabular-nums">
                {cardBalance}
              </p>
              <p className="text-blue-200/70 text-sm font-mono mt-2 tracking-widest">
                **** **** ****{" "}
                {wallet?.walletId
                  ? String(wallet.walletId).slice(-4).padStart(4, "0")
                  : "0000"}
              </p>
            </div>
            <div className="relative flex items-center gap-3 mt-auto pt-4">
              <Link
                href="/dashboard/transfer"
                className="flex items-center gap-2 h-10 px-5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white text-sm font-semibold transition-all border border-white/10"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                Transfer
              </Link>
              <Link
                href="/dashboard/topup"
                className="flex items-center gap-2 h-10 px-5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white text-sm font-semibold transition-all border border-white/10"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                  <polyline points="16 7 22 7 22 13" />
                </svg>
                Received
              </Link>
              <Link
                href="/dashboard/topup"
                className="ml-auto w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center text-white transition-all border border-white/10"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </Link>
            </div>
          </div>
        </motion.div>

        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
          <div className="bg-white dark:bg-[#0f1629] rounded-2xl border border-slate-200/60 dark:border-slate-800/80 p-6 lg:p-7 shadow-sm shadow-slate-200/50 dark:shadow-none h-full flex flex-col justify-between min-h-[220px]">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">
                  Monthly Spent
                </p>
                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
                    <polyline points="16 17 22 17 22 11" />
                  </svg>
                </div>
              </div>
              <p className="text-[32px] lg:text-[36px] font-extrabold text-slate-900 dark:text-white mt-3 tracking-tight leading-none tabular-nums">
                {formatCurrency(stats.thisMonthOutflow, "INR")}
              </p>
            </div>
            <div className="mt-auto pt-4">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 text-sm font-bold ${
                    stats.monthlyOutflowChange <= 0
                      ? "text-emerald-500"
                      : "text-red-500"
                  }`}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={
                      stats.monthlyOutflowChange > 0 ? "" : "rotate-180"
                    }
                  >
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                  {Math.abs(stats.monthlyOutflowChange).toFixed(1)}%
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  Compared to last month
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
          <div className="bg-white dark:bg-[#0f1629] rounded-2xl border border-slate-200/60 dark:border-slate-800/80 p-6 lg:p-7 shadow-sm shadow-slate-200/50 dark:shadow-none h-full flex flex-col justify-between min-h-[220px]">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">
                  Monthly Income
                </p>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                    <polyline points="16 7 22 7 22 13" />
                  </svg>
                </div>
              </div>
              <p className="text-[32px] lg:text-[36px] font-extrabold text-slate-900 dark:text-white mt-3 tracking-tight leading-none tabular-nums">
                {formatCurrency(stats.thisMonthInflow, "INR")}
              </p>
            </div>
            <div className="mt-auto pt-4">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 text-sm font-bold ${
                    stats.monthlyInflowChange >= 0
                      ? "text-emerald-500"
                      : "text-red-500"
                  }`}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={
                      stats.monthlyInflowChange >= 0 ? "" : "rotate-180"
                    }
                  >
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                  {Math.abs(stats.monthlyInflowChange).toFixed(1)}%
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  Compared to last month
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <motion.div
          custom={5}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="lg:col-span-2"
        >
          <div className="bg-white dark:bg-[#0f1629] rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm shadow-slate-200/50 dark:shadow-none overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/80">
              <div>
                <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">
                  Cashflow
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  Income vs Expense over time
                </p>
              </div>
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                {(["7d", "30d", "all"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setChartPeriod(p)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      chartPeriod === p
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    {p === "7d" ? "7D" : p === "30d" ? "30D" : "All"}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-6">
              {cashflowData.length > 1 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={cashflowData}
                      margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
                    >
                      <defs>
                        <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0.01} />
                        </linearGradient>
                        <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ef4444" stopOpacity={0.12} />
                          <stop offset="100%" stopColor="#ef4444" stopOpacity={0.01} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e2e8f0"
                        strokeOpacity={0.4}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                        dy={8}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                        tickFormatter={(v) =>
                          v === 0
                            ? "\u20B90"
                            : Math.abs(v) >= 100000
                              ? `\u20B9${(v / 100000).toFixed(v % 100000 === 0 ? 0 : 1)}L`
                              : Math.abs(v) >= 1000
                                ? `\u20B9${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`
                                : `\u20B9${v}`
                        }
                        dx={-4}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          border: "none",
                          borderRadius: "14px",
                          color: "#fff",
                          fontSize: "12px",
                          padding: "12px 16px",
                          boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
                        }}
                        formatter={(value: number | undefined, name?: string) => [
                          `\u20B9${(value ?? 0).toLocaleString("en-IN")}`,
                          name === "income" ? "Income" : "Expense",
                        ]}
                        labelStyle={{
                          color: "#94a3b8",
                          fontSize: "11px",
                          marginBottom: "4px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="income"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fill="url(#incGrad)"
                        dot={false}
                        activeDot={{
                          r: 5,
                          strokeWidth: 2,
                          stroke: "#10b981",
                          fill: "#fff",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="expense"
                        stroke="#ef4444"
                        strokeWidth={2.5}
                        fill="url(#expGrad)"
                        dot={false}
                        activeDot={{
                          r: 5,
                          strokeWidth: 2,
                          stroke: "#ef4444",
                          fill: "#fff",
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      Not enough data
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      Make some transactions to see your cashflow
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-center gap-6 mt-4">
                <span className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" /> Income
                </span>
                <span className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span className="w-3 h-3 rounded-full bg-red-500" /> Expense
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible">
          <div className="bg-white dark:bg-[#0f1629] rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm shadow-slate-200/50 dark:shadow-none overflow-hidden h-full flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/80">
              <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">
                Quick Transfer
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Recent contacts
              </p>
            </div>
            <div className="p-5 flex-1">
              {bankAccounts.length === 0 &&
              recentTxns.filter((t) => t.txnType === "P2P").length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-8">
                  <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    No contacts yet
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Send your first transfer to add contacts
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    <Link
                      href="/dashboard/transfer"
                      className="flex flex-col items-center gap-2 shrink-0"
                    >
                      <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/30 border-2 border-dashed border-blue-300 dark:border-blue-700 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </div>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        Add
                      </span>
                    </Link>
                    {(() => {
                      const transferContacts: {
                        name: string;
                        initial: string;
                        color: string;
                      }[] = [];
                      const colors = [
                        "from-emerald-500 to-teal-600",
                        "from-violet-500 to-purple-600",
                        "from-amber-500 to-orange-600",
                        "from-pink-500 to-rose-600",
                        "from-cyan-500 to-blue-600",
                      ];
                      const seen = new Set<string>();
                      for (const txn of recentTxns) {
                        if (txn.txnType === "P2P" && txn.description) {
                          const name = txn.description
                            .replace(/^(Sent to|Received from)\s*/i, "")
                            .trim();
                          if (name && !seen.has(name)) {
                            seen.add(name);
                            transferContacts.push({
                              name,
                              initial: name[0]?.toUpperCase() || "?",
                              color: colors[transferContacts.length % colors.length],
                            });
                          }
                        }
                      }
                      for (const acc of bankAccounts) {
                        const name = acc.holderName || "Account";
                        if (!seen.has(name)) {
                          seen.add(name);
                          transferContacts.push({
                            name,
                            initial: name[0]?.toUpperCase() || "B",
                            color: colors[transferContacts.length % colors.length],
                          });
                        }
                      }
                      return transferContacts.slice(0, 5).map((c, i) => (
                        <Link
                          href="/dashboard/transfer"
                          key={i}
                          className="flex flex-col items-center gap-2 shrink-0 group"
                        >
                          <div
                            className={`w-14 h-14 rounded-full bg-gradient-to-br ${c.color} flex items-center justify-center text-white text-lg font-bold shadow-md ring-2 ring-transparent group-hover:ring-blue-400 transition-all`}
                          >
                            {c.initial}
                          </div>
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 max-w-[60px] truncate text-center">
                            {c.name}
                          </span>
                        </Link>
                      ));
                    })()}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                    {bankAccounts.slice(0, 2).map((acc) => (
                      <div key={acc.id} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect
                              x="1"
                              y="4"
                              width="22"
                              height="16"
                              rx="2"
                              ry="2"
                            />
                            <line x1="1" y1="10" x2="23" y2="10" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-slate-900 dark:text-white truncate">
                            {acc.holderName}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">
                            {acc.maskedAccountNumber}
                          </p>
                        </div>
                        {acc.verified && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md">
                            Verified
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <motion.div
          custom={7}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="lg:col-span-2"
        >
          <div className="bg-white dark:bg-[#0f1629] rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm shadow-slate-200/50 dark:shadow-none overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/80">
              <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">
                Recent Activity
              </h2>
              <Link
                href="/dashboard/history"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                View all &#8594;
              </Link>
            </div>
            {recentTxns.length === 0 ? (
              <div className="text-center py-16 px-5">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <p className="text-base font-bold text-slate-900 dark:text-white mb-1">
                  No transactions yet
                </p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mb-5">
                  Start by adding money to your wallet
                </p>
                <Link
                  href="/dashboard/topup"
                  className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-lg shadow-blue-600/20"
                >
                  Add Money
                </Link>
              </div>
            ) : (
              <div>
                <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr] px-6 py-3 border-b border-slate-50 dark:border-slate-800/60">
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Name
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Date
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">
                    Amount
                  </span>
                </div>
                <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
                  {recentTxns.map((entry) => {
                    const isCredit = entry.direction === "CREDIT";
                    const iconColor = TYPE_COLORS[entry.txnType] || "#64748b";
                    return (
                      <div
                        key={entry.id}
                        className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr] items-center px-6 py-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${iconColor}14` }}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke={iconColor}
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              {entry.txnType === "TOPUP" && (
                                <>
                                  <line x1="12" y1="5" x2="12" y2="19" />
                                  <polyline points="19 12 12 19 5 12" />
                                </>
                              )}
                              {entry.txnType === "P2P" && (
                                <>
                                  <line x1="22" y1="2" x2="11" y2="13" />
                                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                </>
                              )}
                              {entry.txnType === "WITHDRAW" && (
                                <>
                                  <line x1="12" y1="19" x2="12" y2="5" />
                                  <polyline points="5 12 12 5 19 12" />
                                </>
                              )}
                              {entry.txnType === "REVERSAL" && (
                                <>
                                  <polyline points="1 4 1 10 7 10" />
                                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                                </>
                              )}
                              {entry.txnType === "FEE" && (
                                <>
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="12" y1="8" x2="12" y2="12" />
                                  <line x1="12" y1="16" x2="12.01" y2="16" />
                                </>
                              )}
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-slate-900 dark:text-white truncate">
                              {entry.description ||
                                txnLabel(entry.txnType, entry.direction)}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 sm:hidden mt-0.5">
                              {relativeTime(entry.createdAt)}
                            </p>
                          </div>
                        </div>
                        <span className="hidden sm:block text-[13px] text-slate-500 dark:text-slate-400">
                          {relativeTime(entry.createdAt)}
                        </span>
                        <span
                          className={`text-[14px] font-bold tabular-nums text-right ${
                            isCredit
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-slate-900 dark:text-slate-200"
                          }`}
                        >
                          {isCredit ? "+" : "-"}
                          {formatCurrency(entry.amount, "INR")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          custom={8}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="space-y-5"
        >
          {profile && (
            <div className="bg-white dark:bg-[#0f1629] rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm shadow-slate-200/50 dark:shadow-none overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/80">
                <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">
                  Account
                </h2>
              </div>
              <div className="p-5 space-y-3.5">
                {[
                  {
                    label: "Status",
                    value: (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    ),
                  },
                  {
                    label: "Tier",
                    value: (
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                          profile.tier === "PREMIUM" || profile.tier === "ADMIN"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {profile.tier}
                      </span>
                    ),
                  },
                  {
                    label: "Phone",
                    value: (
                      <span
                        className={`text-xs font-bold ${
                          profile.phoneVerified
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {profile.phoneVerified ? "Verified" : "Not verified"}
                      </span>
                    ),
                  },
                  {
                    label: "Auth",
                    value: (
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400 capitalize">
                        {profile.authProvider?.toLowerCase() || "email"}
                      </span>
                    ),
                  },
                  {
                    label: "Member since",
                    value: (
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        {new Date(profile.createdAt).toLocaleDateString(
                          "en-IN",
                          { month: "short", year: "numeric" }
                        )}
                      </span>
                    ),
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between"
                  >
                    <span className="text-[13px] text-slate-500 dark:text-slate-400">
                      {row.label}
                    </span>
                    {row.value}
                  </div>
                ))}
              </div>
            </div>
          )}

          {limitUsage && (
            <div className="bg-white dark:bg-[#0f1629] rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm shadow-slate-200/50 dark:shadow-none overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/80">
                <div>
                  <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">
                    Spending Limits
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {limitUsage.tier === "PREMIUM" ? "Premium" : "Free"} tier
                  </p>
                </div>
                {limitUsage.tier === "FREE" && (
                  <Link
                    href="/dashboard/premium"
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
                  >
                    Upgrade &#8594;
                  </Link>
                )}
              </div>
              <div className="p-5 space-y-5">
                {[
                  { label: "Daily", ...limitUsage.daily },
                  { label: "Monthly", ...limitUsage.monthly },
                ].map((bar) => (
                  <div key={bar.label}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                        {bar.label}
                      </span>
                      <span className="text-xs font-medium text-slate-400 dark:text-slate-500 tabular-nums">
                        {formatCurrency(bar.used, "INR")} /{" "}
                        {formatCurrency(bar.limit, "INR")}
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          bar.pct > 80
                            ? "bg-red-500"
                            : bar.pct > 50
                              ? "bg-amber-500"
                              : "bg-blue-500"
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${bar.pct}%` }}
                        transition={{
                          duration: 0.8,
                          ease: "easeOut",
                          delay: 0.4,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
