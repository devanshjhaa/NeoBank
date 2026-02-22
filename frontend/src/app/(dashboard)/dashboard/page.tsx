"use client";

import { useState, useEffect, useMemo } from "react";
import { walletApi, transactionApi } from "@/lib/api";
import type { LedgerEntryResponse } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

interface WalletData {
  balance: number;
  currency: string;
}

const quickActions = [
  {
    href: "/dashboard/topup",
    label: "Add Money",
    desc: "Top up your wallet",
    bg: "bg-emerald-50 group-hover:bg-emerald-100",
    stroke: "#059669",
    icon: (
      <>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </>
    ),
  },
  {
    href: "/dashboard/transfer",
    label: "Send Money",
    desc: "Transfer to another user",
    bg: "bg-blue-50 group-hover:bg-blue-100",
    stroke: "#2563eb",
    icon: (
      <>
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
      </>
    ),
  },
  {
    href: "/dashboard/payout",
    label: "Payout",
    desc: "Withdraw to bank",
    bg: "bg-violet-50 group-hover:bg-violet-100",
    stroke: "#7c3aed",
    icon: (
      <>
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
      </>
    ),
  },
  {
    href: "/dashboard/history",
    label: "History",
    desc: "View all transactions",
    bg: "bg-slate-100 group-hover:bg-slate-200",
    stroke: "#475569",
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </>
    ),
  },
];

const typeIconMap: Record<string, { bg: string; stroke: string; d: React.ReactNode }> = {
  TOPUP: {
    bg: "bg-emerald-50",
    stroke: "#059669",
    d: (
      <>
        <line x1="12" y1="5" x2="12" y2="19" />
        <polyline points="19 12 12 19 5 12" />
      </>
    ),
  },
  P2P: {
    bg: "bg-blue-50",
    stroke: "#2563eb",
    d: (
      <>
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
      </>
    ),
  },
  WITHDRAW: {
    bg: "bg-violet-50",
    stroke: "#7c3aed",
    d: (
      <>
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
      </>
    ),
  },
  REVERSAL: {
    bg: "bg-amber-50",
    stroke: "#d97706",
    d: (
      <>
        <polyline points="1 4 1 10 7 10" />
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
      </>
    ),
  },
};

function txnLabel(txnType: string, direction: string): string {
  if (txnType === "TOPUP") return "Wallet top-up";
  if (txnType === "P2P" && direction === "DEBIT") return "Transfer out";
  if (txnType === "P2P" && direction === "CREDIT") return "Transfer in";
  if (txnType === "WITHDRAW") return "Bank payout";
  if (txnType === "REVERSAL") return "Payout reversal";
  return txnType;
}

export default function DashboardPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [ledger, setLedger] = useState<LedgerEntryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [walletData, history] = await Promise.all([
          walletApi.getMyWallet(),
          transactionApi.getHistory(),
        ]);
        setWallet({ balance: walletData.balance, currency: walletData.currency });
        setLedger(history);
      } catch {
        setWallet({ balance: 0, currency: "INR" });
        setLedger([]);
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const stats = useMemo(() => {
    let totalInflow = 0;
    let totalOutflow = 0;
    let payouts = 0;
    for (const entry of ledger) {
      if (entry.direction === "CREDIT") totalInflow += entry.amount;
      if (entry.direction === "DEBIT") totalOutflow += entry.amount;
      if (entry.txnType === "WITHDRAW") payouts += entry.amount;
    }
    return { totalInflow, totalOutflow, payouts };
  }, [ledger]);

  const chartData = useMemo(() => {
    if (ledger.length === 0) return [];
    const sorted = [...ledger].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    let runningBalance = 0;
    const points: { date: string; value: number }[] = [];
    for (const entry of sorted) {
      if (entry.direction === "CREDIT") runningBalance += entry.amount;
      else runningBalance -= entry.amount;
      points.push({
        date: new Date(entry.createdAt).toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
        }),
        value: runningBalance,
      });
    }
    return points;
  }, [ledger]);

  const recentTransactions = ledger.slice(0, 5);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 p-5 h-[120px]" />
          ))}
        </div>
        <div className="bg-white rounded-xl border border-slate-100 h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-slate-400 mb-0.5">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"} {"👋"}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Balance",
            value: formatCurrency(wallet?.balance || 0, wallet?.currency || "INR"),
            iconBg: "bg-blue-50",
            iconStroke: "#2563eb",
            icon: (
              <>
                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
              </>
            ),
          },
          {
            label: "Total Inflow",
            value: formatCurrency(stats.totalInflow, "INR"),
            iconBg: "bg-emerald-50",
            iconStroke: "#059669",
            icon: (
              <>
                <line x1="12" y1="5" x2="12" y2="19" />
                <polyline points="19 12 12 19 5 12" />
              </>
            ),
          },
          {
            label: "Total Outflow",
            value: formatCurrency(stats.totalOutflow, "INR"),
            iconBg: "bg-amber-50",
            iconStroke: "#d97706",
            icon: (
              <>
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </>
            ),
          },
          {
            label: "Payouts",
            value: formatCurrency(stats.payouts, "INR"),
            iconBg: "bg-violet-50",
            iconStroke: "#7c3aed",
            icon: (
              <>
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </>
            ),
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-slate-200/80 p-5 hover:shadow-md hover:shadow-slate-200/60 transition-all duration-200 group"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-medium text-slate-500">{stat.label}</p>
              <div className={`w-9 h-9 rounded-lg ${stat.iconBg} flex items-center justify-center transition-transform duration-200 group-hover:scale-110`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stat.iconStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {stat.icon}
                </svg>
              </div>
            </div>
            <p className="text-[22px] font-bold text-slate-900 tracking-tight">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {chartData.length > 1 && (
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-[13px] font-semibold text-slate-900">Balance Over Time</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Based on your transaction history</p>
          </div>
          <div className="p-5 lg:p-6">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
                  <defs>
                    <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.12} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
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
                    tickFormatter={(v) => `\u20B9${(v / 1000).toFixed(0)}k`}
                    dx={-4}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "none",
                      borderRadius: "10px",
                      color: "#fff",
                      fontSize: "12px",
                      padding: "10px 14px",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
                    }}
                    formatter={(value?: number) => [
                      `\u20B9${(value ?? 0).toLocaleString("en-IN")}`,
                      "",
                    ]}
                    labelStyle={{ color: "#94a3b8", fontSize: "11px", marginBottom: "4px" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fill="url(#blueGrad)"
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: "#2563eb", fill: "#fff" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-slate-200/80 p-5">
          <h2 className="text-[13px] font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="space-y-1.5">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href}>
                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all duration-150 cursor-pointer group">
                  <div className={`w-10 h-10 rounded-xl ${action.bg} flex items-center justify-center shrink-0 transition-colors`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={action.stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {action.icon}
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-900">{action.label}</p>
                    <p className="text-[11px] text-slate-400">{action.desc}</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all shrink-0">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-semibold text-slate-900">Recent Transactions</h2>
            <Link
              href="/dashboard/history"
              className="text-[12px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              {"View all \u2192"}
            </Link>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <p className="text-[13px] font-semibold text-slate-900 mb-1">No transactions yet</p>
              <p className="text-[12px] text-slate-400">Top up your wallet to get started</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {recentTransactions.map((entry) => {
                const icon = typeIconMap[entry.txnType] || typeIconMap["P2P"];
                const isCredit = entry.direction === "CREDIT";
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${icon.bg} flex items-center justify-center shrink-0`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={icon.stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          {icon.d}
                        </svg>
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-slate-900">
                          {entry.description || txnLabel(entry.txnType, entry.direction)}
                        </p>
                        <p className="text-[11px] text-slate-400">{formatDate(entry.createdAt)}</p>
                      </div>
                    </div>
                    <p className={`text-[13px] font-bold tabular-nums ${isCredit ? "text-emerald-600" : "text-slate-900"}`}>
                      {isCredit ? "+" : "-"}{formatCurrency(entry.amount, "INR")}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
