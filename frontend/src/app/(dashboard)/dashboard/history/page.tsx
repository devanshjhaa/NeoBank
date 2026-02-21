"use client";

import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Transaction {
  id: string;
  type: "TOPUP" | "TRANSFER" | "PAYOUT";
  amount: number;
  status: "COMPLETED" | "PENDING" | "FAILED";
  description: string;
  createdAt: string;
}

type FilterType = "ALL" | "TOPUP" | "TRANSFER" | "PAYOUT";

const mockTransactions: Transaction[] = [
  { id: "1", type: "TOPUP", amount: 5000, status: "COMPLETED", description: "Wallet top-up", createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: "2", type: "TRANSFER", amount: 1200, status: "COMPLETED", description: "Transfer to user #4", createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: "3", type: "PAYOUT", amount: 3000, status: "PENDING", description: "Bank withdrawal", createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: "4", type: "TOPUP", amount: 10000, status: "COMPLETED", description: "Wallet top-up", createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: "5", type: "TRANSFER", amount: 750, status: "FAILED", description: "Transfer to user #8", createdAt: new Date(Date.now() - 86400000 * 6).toISOString() },
];

const filters: { label: string; value: FilterType; icon: string }[] = [
  { label: "All", value: "ALL", icon: "M4 6h16M4 12h16M4 18h16" },
  { label: "Top Up", value: "TOPUP", icon: "M12 5v14M19 12l-7 7-7-7" },
  { label: "Transfer", value: "TRANSFER", icon: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7" },
  { label: "Payout", value: "PAYOUT", icon: "M12 19V5M5 12l7-7 7 7" },
];

export default function HistoryPage() {
  const [filter, setFilter] = useState<FilterType>("ALL");

  const filtered = filter === "ALL"
    ? mockTransactions
    : mockTransactions.filter((tx) => tx.type === filter);

  const getTransactionIcon = (type: string) => {
    const iconConfig: Record<string, { bg: string; stroke: string; path: React.ReactNode }> = {
      TOPUP: {
        bg: "bg-emerald-50",
        stroke: "#059669",
        path: (
          <>
            <line x1="12" y1="5" x2="12" y2="19" />
            <polyline points="19 12 12 19 5 12" />
          </>
        ),
      },
      TRANSFER: {
        bg: "bg-blue-50",
        stroke: "#2563eb",
        path: (
          <>
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </>
        ),
      },
      PAYOUT: {
        bg: "bg-violet-50",
        stroke: "#7c3aed",
        path: (
          <>
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </>
        ),
      },
    };

    const cfg = iconConfig[type];
    if (!cfg) return null;

    return (
      <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cfg.stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {cfg.path}
        </svg>
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-200/50",
      PENDING: "bg-amber-50 text-amber-700 ring-amber-200/50",
      FAILED: "bg-red-50 text-red-700 ring-red-200/50",
    };

    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ring-1 ${styles[status] || ""}`}>
        {status.charAt(0) + status.slice(1).toLowerCase()}
      </span>
    );
  };

  const getAmountDisplay = (type: string) => {
    return type === "TOPUP"
      ? { prefix: "+", color: "text-emerald-600" }
      : { prefix: "-", color: "text-slate-900" };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Transaction History</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">View all your past transactions</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all ${
              filter === f.value
                ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:border-slate-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50/60 ring-1 ring-blue-100">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <p className="text-[12px] text-blue-700">
          Showing sample transactions for preview. Live history will be available soon.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-[13px] font-semibold text-slate-900">
              {filter === "ALL" ? "All Transactions" : `${filter.charAt(0) + filter.slice(1).toLowerCase()} Transactions`}
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">{filtered.length} transaction{filtered.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 className="text-[15px] font-semibold text-slate-900 mb-1">No transactions found</h3>
            <p className="text-[13px] text-slate-400">
              {filter === "ALL"
                ? "You haven\u2019t made any transactions yet"
                : `No ${filter.toLowerCase()} transactions found`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((tx) => {
              const amt = getAmountDisplay(tx.type);
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between px-5 py-4 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    {getTransactionIcon(tx.type)}
                    <div>
                      <p className="text-[13px] font-semibold text-slate-900">
                        {tx.type.charAt(0) + tx.type.slice(1).toLowerCase()}
                      </p>
                      <p className="text-[12px] text-slate-400 mt-0.5">
                        {tx.description} &middot; {formatDate(tx.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5">
                    <p className={`text-[14px] font-bold tabular-nums ${amt.color}`}>
                      {amt.prefix}{formatCurrency(tx.amount)}
                    </p>
                    {getStatusBadge(tx.status)}
                  </div>
                </div>
              );
            })}

            <div className="px-5 py-4">
              <button
                disabled
                className="w-full h-10 rounded-xl border border-slate-200 bg-white text-[13px] font-semibold text-slate-400 cursor-not-allowed"
              >
                Load More (Coming Soon)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
