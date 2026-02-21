"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { walletApi } from "@/lib/api";
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

interface Transaction {
  id: string;
  type: "TOPUP" | "TRANSFER" | "PAYOUT";
  amount: number;
  status: "PENDING" | "COMPLETED" | "FAILED";
  description: string;
  createdAt: string;
}

const chartData = [
  { date: "Jan 1", value: 24000 },
  { date: "Jan 5", value: 32000 },
  { date: "Jan 10", value: 28000 },
  { date: "Jan 15", value: 45000 },
  { date: "Jan 20", value: 38000 },
  { date: "Jan 25", value: 52000 },
  { date: "Jan 30", value: 48000 },
  { date: "Feb 4", value: 62000 },
  { date: "Feb 9", value: 58000 },
  { date: "Feb 14", value: 71000 },
  { date: "Feb 19", value: 68000 },
  { date: "Feb 24", value: 85000 },
];

const tabs = [
  { id: "revenue", label: "Revenue" },
  { id: "success", label: "Success Rate" },
  { id: "transactions", label: "Transactions" },
  { id: "customers", label: "Customers" },
];

export default function DashboardPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("revenue");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const walletData = await walletApi.getMyWallet();
        setWallet({ balance: walletData.balance, currency: walletData.currency });
      } catch {
        setWallet({ balance: 107843.82, currency: "INR" });
      }

      setTransactions([
        { id: "1", type: "TOPUP", amount: 50000, status: "COMPLETED", description: "Card top up", createdAt: new Date().toISOString() },
        { id: "2", type: "TRANSFER", amount: 15000, status: "COMPLETED", description: "To John Doe", createdAt: new Date(Date.now() - 86400000).toISOString() },
        { id: "3", type: "PAYOUT", amount: 100000, status: "PENDING", description: "Bank withdrawal", createdAt: new Date(Date.now() - 172800000).toISOString() },
        { id: "4", type: "TOPUP", amount: 25000, status: "COMPLETED", description: "UPI top up", createdAt: new Date(Date.now() - 259200000).toISOString() },
        { id: "5", type: "TRANSFER", amount: 8500, status: "COMPLETED", description: "To Jane Smith", createdAt: new Date(Date.now() - 345600000).toISOString() },
      ]);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const typeIcons: Record<string, { bg: string; stroke: string; d: React.ReactNode }> = {
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
    TRANSFER: {
      bg: "bg-blue-50",
      stroke: "#2563eb",
      d: (
        <>
          <polyline points="17 1 21 5 17 9" />
          <path d="M3 11V9a4 4 0 0 1 4-4h14" />
          <polyline points="7 23 3 19 7 15" />
          <path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </>
      ),
    },
    PAYOUT: {
      bg: "bg-violet-50",
      stroke: "#7c3aed",
      d: (
        <>
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </>
      ),
    },
  };

  const statusStyles: Record<string, string> = {
    COMPLETED: "bg-emerald-50 text-emerald-700",
    PENDING: "bg-amber-50 text-amber-700",
    FAILED: "bg-red-50 text-red-700",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <svg className="animate-spin h-6 w-6 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm text-slate-500">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Overview of your account activity</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-9 text-sm border-slate-200 text-slate-600 hover:bg-slate-50 gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            This month
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </Button>
          <Button className="h-9 text-sm bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Balance */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-500">Total Balance</p>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(wallet?.balance || 0, wallet?.currency || "INR")}
          </p>
          <div className="flex items-center gap-1 mt-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            </svg>
            <span className="text-xs font-medium text-emerald-600">+56%</span>
            <span className="text-xs text-slate-400">vs last week</span>
          </div>
        </div>

        {/* Total Payments */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-500">Payments</p>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">754,291</p>
          <div className="flex items-center gap-1 mt-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            </svg>
            <span className="text-xs font-medium text-emerald-600">+58%</span>
            <span className="text-xs text-slate-400">vs last week</span>
          </div>
        </div>

        {/* Total Refunds */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-500">Refunds</p>
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">₹45,019</p>
          <div className="flex items-center gap-1 mt-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
              <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
            </svg>
            <span className="text-xs font-medium text-red-600">-12%</span>
            <span className="text-xs text-slate-400">vs last week</span>
          </div>
        </div>

        {/* Payouts */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-500">Payouts</p>
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">₹30,124</p>
          <div className="flex items-center gap-1 mt-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            </svg>
            <span className="text-xs font-medium text-emerald-600">+88%</span>
            <span className="text-xs text-slate-400">vs last week</span>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-xl border border-slate-200">
        {/* Tabs */}
        <div className="border-b border-slate-100 px-5">
          <div className="flex gap-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="p-5">
          <div className="flex items-baseline gap-3 mb-1">
            <p className="text-3xl font-bold text-slate-900">
              {formatCurrency(wallet?.balance || 85432, wallet?.currency || "INR")}
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              </svg>
              +12.5%
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-6">vs previous period</p>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
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
                  tickFormatter={(v) => `₹${v / 1000}k`}
                  dx={-4}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                    padding: "8px 12px",
                  }}
                  formatter={(value?: number) => [`₹${(value ?? 0).toLocaleString()}`, ""]}
                  labelStyle={{ color: "#94a3b8", fontSize: "11px", marginBottom: "2px" }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fill="url(#blueGrad)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "#2563eb", fill: "#fff" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Actions + Recent Transactions */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { href: "/dashboard/topup", label: "Add Money", desc: "Top up your wallet", color: "emerald", icon: (<><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>) },
              { href: "/dashboard/transfer", label: "Transfer", desc: "Send to another user", color: "blue", icon: (<><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></>) },
              { href: "/dashboard/payout", label: "Payout", desc: "Withdraw to bank", color: "violet", icon: (<><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></>) },
            ].map((action) => (
              <Link key={action.href} href={action.href}>
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group">
                  <div className={`w-9 h-9 rounded-lg bg-${action.color}-50 flex items-center justify-center shrink-0`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={action.color === "emerald" ? "#059669" : action.color === "blue" ? "#2563eb" : "#7c3aed"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {action.icon}
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{action.label}</p>
                    <p className="text-xs text-slate-400">{action.desc}</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300 group-hover:text-slate-400 transition-colors shrink-0">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Recent Transactions</h2>
            <Link href="/dashboard/history" className="text-xs font-medium text-blue-600 hover:text-blue-700">
              View all →
            </Link>
          </div>

          <div className="space-y-1">
            {transactions.map((tx) => {
              const icon = typeIcons[tx.type];
              return (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg ${icon.bg} flex items-center justify-center shrink-0`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={icon.stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {icon.d}
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{tx.description}</p>
                      <p className="text-xs text-slate-400">{formatDate(tx.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className={`text-sm font-semibold ${tx.type === "TOPUP" ? "text-emerald-600" : "text-slate-900"}`}>
                      {tx.type === "TOPUP" ? "+" : "-"}{formatCurrency(tx.amount, "INR")}
                    </p>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${statusStyles[tx.status]}`}>
                      {tx.status.charAt(0) + tx.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
