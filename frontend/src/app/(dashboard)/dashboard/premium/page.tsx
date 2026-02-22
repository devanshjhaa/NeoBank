"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { premiumApi, userApi, transactionApi } from "@/lib/api";
import type { LedgerEntryResponse, UserProfileResponse } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  Area,
  AreaChart,
} from "recharts";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

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

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const features = [
  "Zero fees on all transfers",
  "Daily limit up to \u20B975,000",
  "Monthly limit up to \u20B910,00,000",
  "Priority customer support",
  "Early access to new features",
  "Premium badge on your profile",
];

const benefits = [
  {
    icon: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
    title: "Zero Transfer Fees",
    description: "Send money to anyone without paying fees on any transfer",
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
  },
  {
    icon: "M23 6L13.5 15.5 8.5 10.5 1 18M17 6h6v6",
    title: "Higher Limits",
    description: "Enjoy increased transaction and payout limits",
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/40",
  },
  {
    icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
    title: "Priority Support",
    description: "Get faster responses from our dedicated support team",
    color: "text-violet-600",
    bg: "bg-violet-50 dark:bg-violet-950/40",
  },
  {
    icon: "M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27l6.91-1.01L12 2z",
    title: "Exclusive Rewards",
    description: "Earn more cashback and access special promotions",
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/40",
  },
];

function UpgradeCTA({ onUpgrade, isUpgrading }: { onUpgrade: () => void; isUpgrading: boolean }) {
  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 ring-1 ring-amber-200/50 dark:ring-amber-700/50 text-amber-700 dark:text-amber-400 text-[12px] font-semibold mb-4">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          Premium
        </div>
        <h1 className="text-[26px] font-bold text-slate-900 dark:text-white tracking-tight">Upgrade to Premium</h1>
        <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-1.5 max-w-md mx-auto">
          Unlock powerful analytics, higher limits, and zero fees on all transactions
        </p>
      </motion.div>

      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="bg-white dark:bg-[#0f1629] rounded-2xl border border-slate-200/60 dark:border-slate-800/80 overflow-hidden shadow-sm max-w-md mx-auto">
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-8 text-center">
          <div className="flex items-baseline justify-center gap-1.5">
            <span className="text-5xl font-bold text-white tracking-tight">{"\u20B9"}299</span>
            <span className="text-blue-200 text-[14px] font-medium">/one-time</span>
          </div>
          <p className="text-blue-100 text-[13px] mt-2">Lifetime premium access {"\u2014"} pay once, enjoy forever</p>
        </div>

        <div className="p-6 space-y-6">
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="text-[13px] text-slate-600 dark:text-slate-300">{feature}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={onUpgrade}
            disabled={isUpgrading}
            className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-semibold transition-all shadow-sm shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isUpgrading && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            Upgrade to Premium
          </button>
        </div>
      </motion.div>

      <div>
        <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white mb-4 text-center tracking-tight">What You&apos;ll Get</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              custom={index + 2}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="group bg-white dark:bg-[#0f1629] rounded-xl border border-slate-200/60 dark:border-slate-800/80 p-5 flex items-start gap-4 hover:shadow-md transition-all"
            >
              <div className={`w-11 h-11 rounded-xl ${benefit.bg} flex items-center justify-center shrink-0 ${benefit.color} group-hover:scale-110 transition-transform`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={benefit.icon} />
                </svg>
              </div>
              <div>
                <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">{benefit.title}</h3>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{benefit.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PremiumAnalytics({ profile, ledger }: { profile: UserProfileResponse; ledger: LedgerEntryResponse[] }) {
  const monthlySpending = useMemo(() => {
    const map = new Map<string, { month: string; spending: number; income: number }>();
    for (const e of ledger) {
      const d = new Date(e.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-IN", { month: "short" });
      if (!map.has(key)) map.set(key, { month: label, spending: 0, income: 0 });
      const entry = map.get(key)!;
      if (e.direction === "DEBIT") entry.spending += e.amount;
      else entry.income += e.amount;
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v)
      .slice(-8);
  }, [ledger]);

  const netFlowData = useMemo(() => {
    const map = new Map<string, { month: string; net: number }>();
    for (const e of ledger) {
      const d = new Date(e.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-IN", { month: "short" });
      if (!map.has(key)) map.set(key, { month: label, net: 0 });
      const entry = map.get(key)!;
      entry.net += e.direction === "CREDIT" ? e.amount : -e.amount;
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v)
      .slice(-8);
  }, [ledger]);

  const typeBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of ledger) {
      if (e.direction === "DEBIT") map[e.txnType] = (map[e.txnType] || 0) + e.amount;
    }
    return Object.entries(map)
      .map(([name, value]) => ({ name: TYPE_LABELS[name] || name, value, fill: TYPE_COLORS[name] || "#64748b" }))
      .sort((a, b) => b.value - a.value);
  }, [ledger]);

  const summaryStats = useMemo(() => {
    let totalIn = 0, totalOut = 0, avgTxn = 0, largest = 0;
    for (const e of ledger) {
      if (e.direction === "CREDIT") totalIn += e.amount;
      else totalOut += e.amount;
      if (e.amount > largest) largest = e.amount;
    }
    avgTxn = ledger.length > 0 ? (totalIn + totalOut) / ledger.length : 0;
    return { totalIn, totalOut, net: totalIn - totalOut, avgTxn, largest, count: ledger.length };
  }, [ledger]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Premium Analytics</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Financial Insights</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Detailed breakdown of your wallet activity</p>
        </div>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Inflow", value: formatCurrency(summaryStats.totalIn, "INR"), color: "emerald" },
          { label: "Total Outflow", value: formatCurrency(summaryStats.totalOut, "INR"), color: "amber" },
          { label: "Net Flow", value: formatCurrency(summaryStats.net, "INR"), color: summaryStats.net >= 0 ? "blue" : "red" },
          { label: "Avg Transaction", value: formatCurrency(summaryStats.avgTxn, "INR"), color: "violet" },
          { label: "Largest Txn", value: formatCurrency(summaryStats.largest, "INR"), color: "orange" },
          { label: "Total Count", value: summaryStats.count.toString(), color: "slate" },
        ].map((stat, i) => {
          const colorMap: Record<string, string> = {
            emerald: "border-emerald-200/60 dark:border-emerald-900/40",
            amber: "border-amber-200/60 dark:border-amber-900/40",
            blue: "border-blue-200/60 dark:border-blue-900/40",
            red: "border-red-200/60 dark:border-red-900/40",
            violet: "border-violet-200/60 dark:border-violet-900/40",
            orange: "border-orange-200/60 dark:border-orange-900/40",
            slate: "border-slate-200/60 dark:border-slate-800/80",
          };
          return (
            <motion.div
              key={stat.label}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className={`bg-white dark:bg-[#0f1629] rounded-xl border ${colorMap[stat.color] || colorMap.slate} p-4`}
            >
              <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-1">{stat.label}</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white tabular-nums truncate">{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Monthly spending vs income */}
        <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible" className="lg:col-span-3 bg-white dark:bg-[#0f1629] rounded-2xl border border-slate-200/60 dark:border-slate-800/80 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Monthly Spending vs Income</h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Last 8 months breakdown</p>
          </div>
          <div className="p-5">
            {monthlySpending.length > 0 ? (
              <>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlySpending} margin={{ top: 4, right: 4, bottom: 0, left: -12 }} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} dy={8} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => v === 0 ? "\u20B90" : Math.abs(v) >= 100000 ? `\u20B9${(v / 100000).toFixed(v % 100000 === 0 ? 0 : 1)}L` : Math.abs(v) >= 1000 ? `\u20B9${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : `\u20B9${v}`} dx={-4} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0f172a", border: "none", borderRadius: "12px", color: "#fff", fontSize: "12px", padding: "10px 14px", boxShadow: "0 10px 40px rgba(0,0,0,0.25)" }}
                        formatter={(value: number | undefined, name?: string) => [`${"\u20B9"}${(value ?? 0).toLocaleString("en-IN")}`, name === "income" ? "Income" : "Spending"]}
                        labelStyle={{ color: "#94a3b8", fontSize: "11px", marginBottom: "4px" }}
                      />
                      <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={20} />
                      <Bar dataKey="spending" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-5 mt-2">
                  <span className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />Income</span>
                  <span className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400"><span className="w-2.5 h-2.5 rounded-sm bg-red-500" />Spending</span>
                </div>
              </>
            ) : (
              <div className="h-[260px] flex items-center justify-center">
                <p className="text-xs text-slate-400 dark:text-slate-500">No data available</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Spending breakdown donut */}
        <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible" className="lg:col-span-2 bg-white dark:bg-[#0f1629] rounded-2xl border border-slate-200/60 dark:border-slate-800/80 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Spending Breakdown</h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Where your money goes</p>
          </div>
          <div className="p-5">
            {typeBreakdown.length > 0 ? (
              <>
                <div className="flex items-center justify-center">
                  <div className="w-[180px] h-[180px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={typeBreakdown} innerRadius={54} outerRadius={80} dataKey="value" paddingAngle={3} strokeWidth={0}>
                          {typeBreakdown.map((entry, idx) => (
                            <Cell key={idx} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: "#0f172a", border: "none", borderRadius: "12px", color: "#fff", fontSize: "12px", padding: "8px 12px", boxShadow: "0 10px 40px rgba(0,0,0,0.25)" }}
                          formatter={(value: number | undefined) => [`${"\u20B9"}${(value ?? 0).toLocaleString("en-IN")}`, ""]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(summaryStats.totalOut, "INR")}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">total spent</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  {typeBreakdown.map((entry) => {
                    const pct = summaryStats.totalOut > 0 ? ((entry.value / summaryStats.totalOut) * 100).toFixed(1) : "0";
                    return (
                      <div key={entry.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.fill }} />
                          <span className="text-xs text-slate-600 dark:text-slate-300">{entry.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-900 dark:text-white tabular-nums">{formatCurrency(entry.value, "INR")}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 w-10 text-right">{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="h-[260px] flex items-center justify-center">
                <p className="text-xs text-slate-400 dark:text-slate-500">No spending data yet</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Net Cash Flow */}
      <motion.div custom={8} variants={fadeUp} initial="hidden" animate="visible" className="bg-white dark:bg-[#0f1629] rounded-2xl border border-slate-200/60 dark:border-slate-800/80 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Net Cash Flow</h2>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Monthly income minus spending</p>
        </div>
        <div className="p-5">
          {netFlowData.length > 0 ? (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={netFlowData} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
                  <defs>
                    <linearGradient id="netPosGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => v === 0 ? "\u20B90" : Math.abs(v) >= 100000 ? `\u20B9${(v / 100000).toFixed(v % 100000 === 0 ? 0 : 1)}L` : Math.abs(v) >= 1000 ? `\u20B9${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : `\u20B9${v}`} dx={-4} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", border: "none", borderRadius: "12px", color: "#fff", fontSize: "12px", padding: "10px 14px", boxShadow: "0 10px 40px rgba(0,0,0,0.25)" }}
                    formatter={(value: number | undefined) => [`${"\u20B9"}${(value ?? 0).toLocaleString("en-IN")}`, "Net Flow"]}
                    labelStyle={{ color: "#94a3b8", fontSize: "11px", marginBottom: "4px" }}
                  />
                  <Area type="monotone" dataKey="net" stroke="#10b981" strokeWidth={2} fill="url(#netPosGrad)" dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: "#10b981", fill: "#fff" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center">
              <p className="text-xs text-slate-400 dark:text-slate-500">No flow data available</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Premium perks reminder */}
      <motion.div custom={9} variants={fadeUp} initial="hidden" animate="visible" className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span className="text-white text-sm font-semibold">Premium Member</span>
          </div>
          <p className="text-blue-100 text-xs">You have lifetime access to all premium features including zero fees and higher limits.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-white text-xs font-medium">Member since</p>
            <p className="text-blue-200 text-[11px]">
              {new Date(profile.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function PremiumPage() {
  const router = useRouter();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [ledger, setLedger] = useState<LedgerEntryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [razorpayReady, setRazorpayReady] = useState(false);

  useEffect(() => {
    if (document.querySelector('script[src*="razorpay"]')) {
      setRazorpayReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayReady(true);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    Promise.all([userApi.getMe(), transactionApi.getHistory()])
      .then(([p, h]) => {
        setProfile(p);
        setLedger(h);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = useCallback(() => {
    if (!razorpayReady || !window.Razorpay) {
      toast.error("Payment gateway is still loading. Please wait.");
      return;
    }
    setIsUpgrading(true);

    const options: Record<string, unknown> = {
      key: "rzp_test_SIu1PYqOQfxM0K",
      amount: 29900,
      currency: "INR",
      name: "NeoBank",
      description: "Premium Upgrade \u2014 Lifetime Access",
      handler: async (response: { razorpay_payment_id: string }) => {
        try {
          await premiumApi.upgrade();
          toast.success("Welcome to Premium!", {
            description: `Payment ${response.razorpay_payment_id} confirmed. Your account has been upgraded.`,
          });
          router.push("/dashboard");
        } catch (error: unknown) {
          const apiError = error as { message?: string };
          toast.error("Upgrade failed", {
            description: apiError.message || "Payment was captured but upgrade failed. Contact support.",
          });
        } finally {
          setIsUpgrading(false);
        }
      },
      modal: {
        ondismiss: () => setIsUpgrading(false),
      },
      theme: { color: "#2563eb" },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  }, [razorpayReady, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin h-6 w-6 text-blue-600" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (profile && (profile.tier === "PREMIUM" || profile.tier === "ADMIN")) {
    return <PremiumAnalytics profile={profile} ledger={ledger} />;
  }

  return <UpgradeCTA onUpgrade={handleUpgrade} isUpgrading={isUpgrading} />;
}
