"use client";

import { useState, useEffect, useMemo } from "react";
import { walletApi, transactionApi, userApi } from "@/lib/api";
import type { LedgerEntryResponse, UserProfileResponse } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
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
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
} from "recharts";

const TIER_LIMITS = {
  FREE: { daily: 25000, monthly: 200000 },
  PREMIUM: { daily: 75000, monthly: 1000000 },
};

const TYPE_COLORS: Record<string, string> = {
  TOPUP: "#10b981",
  P2P: "#3b82f6",
  WITHDRAW: "#8b5cf6",
  REVERSAL: "#f59e0b",
  FEE: "#ef4444",
};

const TYPE_LABELS: Record<string, string> = {
  TOPUP: "Top-ups",
  P2P: "Transfers",
  WITHDRAW: "Payouts",
  REVERSAL: "Reversals",
  FEE: "Fees",
};

function txnLabel(txnType: string, direction: string): string {
  if (txnType === "TOPUP") return "Wallet Top-up";
  if (txnType === "P2P" && direction === "DEBIT") return "Transfer Sent";
  if (txnType === "P2P" && direction === "CREDIT") return "Transfer Received";
  if (txnType === "WITHDRAW") return "Bank Payout";
  if (txnType === "REVERSAL") return "Payout Reversal";
  if (txnType === "FEE") return "Service Fee";
  return txnType;
}

function trendBadge(current: number, previous: number) {
  if (previous === 0 && current === 0) return { pct: 0, dir: "flat" as const };
  if (previous === 0) return { pct: 100, dir: "up" as const };
  const pct = ((current - previous) / previous) * 100;
  return { pct: Math.abs(pct), dir: pct >= 0 ? ("up" as const) : ("down" as const) };
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

export default function DashboardPage() {
  const [wallet, setWallet] = useState<{ balance: number; currency: string } | null>(null);
  const [ledger, setLedger] = useState<LedgerEntryResponse[]>([]);
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState<"7d" | "30d" | "all">("30d");

  useEffect(() => {
    Promise.all([
      walletApi.getMyWallet(),
      transactionApi.getHistory(),
      userApi.getMe(),
    ])
      .then(([w, h, p]) => {
        setWallet({ balance: w.balance, currency: w.currency });
        setLedger(h);
        setProfile(p);
      })
      .catch(() => {
        setWallet({ balance: 0, currency: "INR" });
        setLedger([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last7d = new Date(todayStart.getTime() - 7 * 86400000);
    const prev7d = new Date(todayStart.getTime() - 14 * 86400000);

    let totalInflow = 0,
      totalOutflow = 0,
      todayInflow = 0,
      todayOutflow = 0,
      recent7dInflow = 0,
      recent7dOutflow = 0,
      prev7dInflow = 0,
      prev7dOutflow = 0;

    for (const e of ledger) {
      const d = new Date(e.createdAt);
      const amt = e.amount;
      if (e.direction === "CREDIT") {
        totalInflow += amt;
        if (d >= todayStart) todayInflow += amt;
        if (d >= last7d) recent7dInflow += amt;
        else if (d >= prev7d) prev7dInflow += amt;
      } else {
        totalOutflow += amt;
        if (d >= todayStart) todayOutflow += amt;
        if (d >= last7d) recent7dOutflow += amt;
        else if (d >= prev7d) prev7dOutflow += amt;
      }
    }

    return {
      totalInflow,
      totalOutflow,
      todayInflow,
      todayOutflow,
      inflowTrend: trendBadge(recent7dInflow, prev7dInflow),
      outflowTrend: trendBadge(recent7dOutflow, prev7dOutflow),
      txnCount: ledger.length,
    };
  }, [ledger]);

  const monthlyData = useMemo(() => {
    const map = new Map<string, { month: string; inflow: number; outflow: number }>();
    for (const e of ledger) {
      const d = new Date(e.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      if (!map.has(key)) map.set(key, { month: label, inflow: 0, outflow: 0 });
      const entry = map.get(key)!;
      if (e.direction === "CREDIT") entry.inflow += e.amount;
      else entry.outflow += e.amount;
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v)
      .slice(-6);
  }, [ledger]);

  const typeBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of ledger) {
      map[e.txnType] = (map[e.txnType] || 0) + e.amount;
    }
    return Object.entries(map)
      .map(([name, value]) => ({ name: TYPE_LABELS[name] || name, value, fill: TYPE_COLORS[name] || "#64748b" }))
      .sort((a, b) => b.value - a.value);
  }, [ledger]);

  const filteredChart = useMemo(() => {
    if (ledger.length === 0) return [];
    const now = Date.now();
    const cutoff =
      chartPeriod === "7d" ? now - 7 * 86400000 : chartPeriod === "30d" ? now - 30 * 86400000 : 0;

    const sorted = [...ledger]
      .filter((e) => new Date(e.createdAt).getTime() >= cutoff)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    let running = 0;
    return sorted.map((e) => {
      running += e.direction === "CREDIT" ? e.amount : -e.amount;
      return {
        date: new Date(e.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        balance: Math.max(0, running),
      };
    });
  }, [ledger, chartPeriod]);

  const limitUsage = useMemo(() => {
    if (!profile) return null;
    const tier = profile.tier === "PREMIUM" ? "PREMIUM" : "FREE";
    const limits = TIER_LIMITS[tier];
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let dailyUsed = 0,
      monthlyUsed = 0;
    for (const e of ledger) {
      if (e.direction !== "DEBIT") continue;
      const d = new Date(e.createdAt);
      if (d >= monthStart) monthlyUsed += e.amount;
      if (d >= todayStart) dailyUsed += e.amount;
    }

    return {
      tier,
      daily: { used: dailyUsed, limit: limits.daily, pct: Math.min(100, (dailyUsed / limits.daily) * 100) },
      monthly: { used: monthlyUsed, limit: limits.monthly, pct: Math.min(100, (monthlyUsed / limits.monthly) * 100) },
    };
  }, [ledger, profile]);

  const recentTxns = ledger.slice(0, 6);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-7 w-52 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[140px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800" />
          ))}
        </div>
        <div className="grid lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 h-[360px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800" />
          <div className="lg:col-span-2 h-[360px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800" />
        </div>
        <div className="grid lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 h-[320px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800" />
          <div className="lg:col-span-2 h-[320px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800" />
        </div>
      </div>
    );
  }

  const greeting =
    new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
      >
        <div>
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500 tracking-wide uppercase">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
            {greeting}, {profile?.email?.split("@")[0] || "there"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/history"
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            History
          </Link>
          {profile?.tier === "PREMIUM" && (
            <Link
              href="/dashboard/premium"
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-xs font-semibold text-white hover:opacity-90 transition-opacity shadow-sm shadow-orange-200/50 dark:shadow-orange-900/30"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Analytics
            </Link>
          )}
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Balance",
            value: formatCurrency(wallet?.balance || 0, wallet?.currency || "INR"),
            today: null as string | null,
            trend: null as ReturnType<typeof trendBadge> | null,
            accent: "blue",
            icon: (
              <>
                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
              </>
            ),
            href: "/dashboard/wallet",
          },
          {
            label: "Total Inflow",
            value: formatCurrency(stats.totalInflow, "INR"),
            today: stats.todayInflow > 0 ? `+${formatCurrency(stats.todayInflow, "INR")} today` : null,
            trend: stats.inflowTrend,
            accent: "emerald",
            icon: (
              <>
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
              </>
            ),
            href: "/dashboard/history",
          },
          {
            label: "Total Outflow",
            value: formatCurrency(stats.totalOutflow, "INR"),
            today: stats.todayOutflow > 0 ? `-${formatCurrency(stats.todayOutflow, "INR")} today` : null,
            trend: stats.outflowTrend,
            accent: "amber",
            icon: (
              <>
                <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
                <polyline points="16 17 22 17 22 11" />
              </>
            ),
            href: "/dashboard/history",
          },
          {
            label: "Transactions",
            value: stats.txnCount.toString(),
            today:
              recentTxns.filter(
                (t) => new Date(t.createdAt) >= new Date(new Date().setHours(0, 0, 0, 0))
              ).length > 0
                ? `${recentTxns.filter((t) => new Date(t.createdAt) >= new Date(new Date().setHours(0, 0, 0, 0))).length} today`
                : null,
            trend: null,
            accent: "violet",
            icon: (
              <>
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              </>
            ),
            href: "/dashboard/history",
          },
        ].map((card, i) => {
          const accentMap: Record<string, { bg: string; icon: string; ring: string }> = {
            blue: {
              bg: "bg-blue-50 dark:bg-blue-950/40",
              icon: "#2563eb",
              ring: "ring-blue-100 dark:ring-blue-900/40",
            },
            emerald: {
              bg: "bg-emerald-50 dark:bg-emerald-950/40",
              icon: "#059669",
              ring: "ring-emerald-100 dark:ring-emerald-900/40",
            },
            amber: {
              bg: "bg-amber-50 dark:bg-amber-950/40",
              icon: "#d97706",
              ring: "ring-amber-100 dark:ring-amber-900/40",
            },
            violet: {
              bg: "bg-violet-50 dark:bg-violet-950/40",
              icon: "#7c3aed",
              ring: "ring-violet-100 dark:ring-violet-900/40",
            },
          };
          const colors = accentMap[card.accent];
          return (
            <motion.div key={card.label} custom={i} variants={fadeUp} initial="hidden" animate="visible">
              <Link href={card.href}>
                <div className="relative bg-white dark:bg-[#0f1629] rounded-2xl border border-slate-200/60 dark:border-slate-800/80 p-5 hover:shadow-lg hover:shadow-slate-200/40 dark:hover:shadow-black/30 transition-all duration-300 group overflow-hidden">
                  <div
                    className={`absolute top-0 right-0 w-24 h-24 ${colors.bg} rounded-full blur-2xl opacity-60 -translate-y-8 translate-x-8 group-hover:opacity-80 transition-opacity`}
                  />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {card.label}
                      </span>
                      <div
                        className={`w-9 h-9 rounded-xl ${colors.bg} ring-1 ${colors.ring} flex items-center justify-center transition-transform group-hover:scale-110`}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke={colors.icon}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          {card.icon}
                        </svg>
                      </div>
                    </div>
                    <p className="text-[22px] font-bold text-slate-900 dark:text-white tracking-tight tabular-nums">
                      {card.value}
                    </p>
                    <div className="flex items-center gap-2 mt-2 min-h-[20px]">
                      {card.trend && card.trend.pct > 0 && (
                        <span
                          className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${card.trend.dir === "up" ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={card.trend.dir === "down" ? "rotate-180" : ""}
                          >
                            <polyline points="18 15 12 9 6 15" />
                          </svg>
                          {card.trend.pct.toFixed(1)}%
                        </span>
                      )}
                      {card.today && (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">{card.today}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Balance Trend */}
        <motion.div
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="lg:col-span-3 bg-white dark:bg-[#0f1629] rounded-2xl border border-slate-200/60 dark:border-slate-800/80 overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/80">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Balance Trend</h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Running balance over time
              </p>
            </div>
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
              {(["7d", "30d", "all"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setChartPeriod(p)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
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
          <div className="p-5">
            {filteredChart.length > 1 ? (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredChart} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
                    <defs>
                      <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e2e8f0"
                      strokeOpacity={0.5}
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
                      tickFormatter={(v) => v === 0 ? "\u20B90" : Math.abs(v) >= 100000 ? `\u20B9${(v / 100000).toFixed(v % 100000 === 0 ? 0 : 1)}L` : Math.abs(v) >= 1000 ? `\u20B9${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : `\u20B9${v}`}
                      dx={-4}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "none",
                        borderRadius: "12px",
                        color: "#fff",
                        fontSize: "12px",
                        padding: "10px 14px",
                        boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
                      }}
                      formatter={(value: number | undefined) => [
                        `${"\u20B9"}${(value ?? 0).toLocaleString("en-IN")}`,
                        "Balance",
                      ]}
                      labelStyle={{ color: "#94a3b8", fontSize: "11px", marginBottom: "4px" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="balance"
                      stroke="#2563eb"
                      strokeWidth={2}
                      fill="url(#balGrad)"
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 2, stroke: "#2563eb", fill: "#fff" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[260px] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                    <svg
                      width="20"
                      height="20"
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
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Not enough data to show chart
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Make some transactions to see your balance trend
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Monthly Inflow vs Outflow */}
        <motion.div
          custom={5}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="lg:col-span-2 bg-white dark:bg-[#0f1629] rounded-2xl border border-slate-200/60 dark:border-slate-800/80 overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Monthly Flow</h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Inflow vs outflow comparison
            </p>
          </div>
          <div className="p-5">
            {monthlyData.length > 0 ? (
              <>
                <div className="h-[230px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: -12 }} barGap={4}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e2e8f0"
                        strokeOpacity={0.5}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                        dy={8}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                        tickFormatter={(v) => v === 0 ? "\u20B90" : Math.abs(v) >= 100000 ? `\u20B9${(v / 100000).toFixed(v % 100000 === 0 ? 0 : 1)}L` : Math.abs(v) >= 1000 ? `\u20B9${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : `\u20B9${v}`}
                        dx={-4}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          border: "none",
                          borderRadius: "12px",
                          color: "#fff",
                          fontSize: "12px",
                          padding: "10px 14px",
                          boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
                        }}
                        formatter={(value: number | undefined, name?: string) => [
                          `${"\u20B9"}${(value ?? 0).toLocaleString("en-IN")}`,
                          name === "inflow" ? "Inflow" : "Outflow",
                        ]}
                        labelStyle={{ color: "#94a3b8", fontSize: "11px", marginBottom: "4px" }}
                      />
                      <Bar dataKey="inflow" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={24} />
                      <Bar dataKey="outflow" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-5 mt-2">
                  <span className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                    Inflow
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                    Outflow
                  </span>
                </div>
              </>
            ) : (
              <div className="h-[260px] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <line x1="9" y1="9" x2="9" y2="15" />
                      <line x1="15" y1="11" x2="15" y2="15" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    No monthly data yet
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Recent Transactions */}
        <motion.div
          custom={6}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="lg:col-span-3 bg-white dark:bg-[#0f1629] rounded-2xl border border-slate-200/60 dark:border-slate-800/80 overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/80">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Activity</h2>
            <Link
              href="/dashboard/history"
              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              View all {"\u2192"}
            </Link>
          </div>
          {recentTxns.length === 0 ? (
            <div className="text-center py-16 px-5">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <svg
                  width="24"
                  height="24"
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
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                No transactions yet
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
                Start by adding money to your wallet
              </p>
              <Link
                href="/dashboard/topup"
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
              >
                Add Money
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {recentTxns.map((entry) => {
                const isCredit = entry.direction === "CREDIT";
                const iconColor = TYPE_COLORS[entry.txnType] || "#64748b";
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${iconColor}12` }}
                      >
                        <svg
                          width="15"
                          height="15"
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
                          {entry.description || txnLabel(entry.txnType, entry.direction)}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {formatDate(entry.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[13px] font-bold tabular-nums shrink-0 ml-4 ${
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
          )}
        </motion.div>

        {/* Right column: Type breakdown + Limits + Quick Actions */}
        <motion.div
          custom={7}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="lg:col-span-2 space-y-4"
        >
          {/* Transaction Breakdown */}
          {typeBreakdown.length > 0 && (
            <div className="bg-white dark:bg-[#0f1629] rounded-2xl border border-slate-200/60 dark:border-slate-800/80 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Transaction Mix
                </h2>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">By type</p>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-center">
                  <div className="w-[160px] h-[160px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={typeBreakdown}
                          innerRadius={48}
                          outerRadius={72}
                          dataKey="value"
                          paddingAngle={3}
                          strokeWidth={0}
                        >
                          {typeBreakdown.map((entry, idx) => (
                            <Cell key={idx} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            border: "none",
                            borderRadius: "12px",
                            color: "#fff",
                            fontSize: "12px",
                            padding: "8px 12px",
                            boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
                          }}
                          formatter={(value: number | undefined) => [
                            `${"\u20B9"}${(value ?? 0).toLocaleString("en-IN")}`,
                            "",
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {stats.txnCount}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3 px-1">
                  {typeBreakdown.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: entry.fill }}
                      />
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {entry.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Spending Limits */}
          {limitUsage && (
            <div className="bg-white dark:bg-[#0f1629] rounded-2xl border border-slate-200/60 dark:border-slate-800/80 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/80">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Spending Limits
                  </h2>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    {limitUsage.tier === "PREMIUM" ? "Premium" : "Free"} tier
                  </p>
                </div>
                {limitUsage.tier === "FREE" && (
                  <Link
                    href="/dashboard/premium"
                    className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
                  >
                    Upgrade {"\u2192"}
                  </Link>
                )}
              </div>
              <div className="p-5 space-y-4">
                {[
                  { label: "Daily", ...limitUsage.daily },
                  { label: "Monthly", ...limitUsage.monthly },
                ].map((bar) => (
                  <div key={bar.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        {bar.label}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        {formatCurrency(bar.used, "INR")} / {formatCurrency(bar.limit, "INR")}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
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
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white dark:bg-[#0f1629] rounded-2xl border border-slate-200/60 dark:border-slate-800/80 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Quick Actions</h2>
            </div>
            <div className="p-3 grid grid-cols-2 gap-2">
              {[
                {
                  href: "/dashboard/topup",
                  label: "Add Money",
                  color: "#059669",
                  bg: "bg-emerald-50 dark:bg-emerald-950/40",
                  icon: (
                    <>
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </>
                  ),
                },
                {
                  href: "/dashboard/transfer",
                  label: "Send",
                  color: "#2563eb",
                  bg: "bg-blue-50 dark:bg-blue-950/40",
                  icon: (
                    <>
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </>
                  ),
                },
                {
                  href: "/dashboard/payout",
                  label: "Withdraw",
                  color: "#7c3aed",
                  bg: "bg-violet-50 dark:bg-violet-950/40",
                  icon: (
                    <>
                      <line x1="12" y1="19" x2="12" y2="5" />
                      <polyline points="5 12 12 5 19 12" />
                    </>
                  ),
                },
                {
                  href: "/dashboard/premium",
                  label: "Premium",
                  color: "#d97706",
                  bg: "bg-amber-50 dark:bg-amber-950/40",
                  icon: (
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  ),
                },
              ].map((action) => (
                <Link key={action.href} href={action.href}>
                  <div className="flex flex-col items-center gap-2 p-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group cursor-pointer">
                    <div
                      className={`w-10 h-10 rounded-xl ${action.bg} flex items-center justify-center transition-transform group-hover:scale-110`}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={action.color}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        {action.icon}
                      </svg>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      {action.label}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
