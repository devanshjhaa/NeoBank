"use client";

import { useState, useEffect } from "react";
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

const statsConfig = [
  {
    label: "Total Balance",
    key: "balance",
    iconBg: "bg-blue-50",
    iconStroke: "#2563eb",
    icon: (
      <>
        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
        <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
        <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
      </>
    ),
    change: "+56%",
    positive: true,
  },
  {
    label: "Total Inflow",
    key: "payments",
    iconBg: "bg-emerald-50",
    iconStroke: "#059669",
    icon: (
      <>
        <line x1="12" y1="5" x2="12" y2="19" />
        <polyline points="19 12 12 19 5 12" />
      </>
    ),
    value: "â‚¹7,54,291",
    change: "+58%",
    positive: true,
  },
  {
    label: "Total Outflow",
    key: "outflow",
    iconBg: "bg-amber-50",
    iconStroke: "#d97706",
    icon: (
      <>
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
      </>
    ),
    value: "â‚¹45,019",
    change: "-12%",
    positive: false,
  },
  {
    label: "Payouts",
    key: "payouts",
    iconBg: "bg-violet-50",
    iconStroke: "#7c3aed",
    icon: (
      <>
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </>
    ),
    value: "â‚¹30,124",
    change: "+88%",
    positive: true,
  },
];

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
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
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
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10",
  PENDING: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/10",
  FAILED: "bg-red-50 text-red-700 ring-1 ring-red-600/10",
};

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
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"} ðŸ‘‹
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-slate-200 bg-white text-[13px] font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            This month
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <button className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-blue-600 text-[13px] font-medium text-white hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/20">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsConfig.map((stat) => (
          <div
            key={stat.key}
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
              {stat.key === "balance"
                ? formatCurrency(wallet?.balance || 0, wallet?.currency || "INR")
                : stat.value}
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${stat.positive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  {stat.positive ? (
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  ) : (
                    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                  )}
                </svg>
                {stat.change}
              </span>
              <span className="text-[11px] text-slate-400">vs last week</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
        <div className="border-b border-slate-100 px-5">
          <div className="flex gap-0 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3.5 text-[13px] font-medium border-b-2 transition-all ${
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

        <div className="p-5 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-3 mb-1">
            <p className="text-[28px] font-bold text-slate-900 tracking-tight">
              {formatCurrency(wallet?.balance || 85432, wallet?.currency || "INR")}
            </p>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 rounded-md px-2 py-0.5 w-fit">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              </svg>
              +12.5%
            </span>
          </div>
          <p className="text-[12px] text-slate-400 mb-6">vs previous period</p>

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
                  tickFormatter={(v) => `â‚¹${v / 1000}k`}
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
                    `â‚¹${(value ?? 0).toLocaleString("en-IN")}`,
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
              View all â†’
            </Link>
          </div>

          <div className="space-y-0.5">
            {transactions.map((tx) => {
              const icon = typeIcons[tx.type];
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${icon.bg} flex items-center justify-center shrink-0`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={icon.stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {icon.d}
                      </svg>
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-slate-900">{tx.description}</p>
                      <p className="text-[11px] text-slate-400">{formatDate(tx.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className={`text-[13px] font-bold tabular-nums ${tx.type === "TOPUP" ? "text-emerald-600" : "text-slate-900"}`}>
                      {tx.type === "TOPUP" ? "+" : "-"}{formatCurrency(tx.amount, "INR")}
                    </p>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${statusStyles[tx.status]}`}>
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
