"use client";

import { useState, useEffect } from "react";
import { transactionApi } from "@/lib/api";
import type { LedgerEntryResponse } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

type FilterType = "ALL" | "TOPUP" | "P2P" | "WITHDRAW";

const filters: { label: string; value: FilterType }[] = [
  { label: "All", value: "ALL" },
  { label: "Top Up", value: "TOPUP" },
  { label: "Transfer", value: "P2P" },
  { label: "Payout", value: "WITHDRAW" },
];

const iconConfig: Record<string, { bg: string; stroke: string; path: React.ReactNode }> = {
  TOPUP: {
    bg: "bg-emerald-50 dark:bg-emerald-900/30",
    stroke: "#059669",
    path: (
      <>
        <line x1="12" y1="5" x2="12" y2="19" />
        <polyline points="19 12 12 19 5 12" />
      </>
    ),
  },
  P2P: {
    bg: "bg-blue-50 dark:bg-blue-900/30",
    stroke: "#2563eb",
    path: (
      <>
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
      </>
    ),
  },
  WITHDRAW: {
    bg: "bg-violet-50 dark:bg-violet-900/30",
    stroke: "#7c3aed",
    path: (
      <>
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
      </>
    ),
  },
  REVERSAL: {
    bg: "bg-amber-50 dark:bg-amber-900/30",
    stroke: "#d97706",
    path: (
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

export default function HistoryPage() {
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [ledger, setLedger] = useState<LedgerEntryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await transactionApi.getHistory();
        setLedger(data);
      } catch {
        setLedger([]);
      }
      setIsLoading(false);
    };
    fetchHistory();
  }, []);

  const filtered = filter === "ALL"
    ? ledger
    : ledger.filter((entry) => entry.txnType === filter);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          ))}
        </div>
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-100 dark:border-slate-700/50 h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 dark:text-white tracking-tight">Transaction History</h1>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">View all your past transactions</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all ${
              filter === f.value
                ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                : "bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-slate-700/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
          <div>
            <h2 className="text-[13px] font-semibold text-slate-900 dark:text-white">
              {filter === "ALL" ? "All Transactions" : `${filters.find(f => f.value === filter)?.label} Transactions`}
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{filtered.length} transaction{filtered.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white mb-1">No transactions found</h3>
            <p className="text-[13px] text-slate-400 dark:text-slate-500">
              {filter === "ALL"
                ? "You haven\u2019t made any transactions yet"
                : `No ${filters.find(f => f.value === filter)?.label?.toLowerCase()} transactions found`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {filtered.map((entry) => {
              const cfg = iconConfig[entry.txnType] || iconConfig["P2P"];
              const isCredit = entry.direction === "CREDIT";
              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between px-5 py-4 hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center`}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cfg.stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {cfg.path}
                      </svg>
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-slate-900 dark:text-white">
                        {entry.description || txnLabel(entry.txnType, entry.direction)}
                      </p>
                      <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {entry.txnType} &middot; {formatDate(entry.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-[14px] font-bold tabular-nums ${isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"}`}>
                      {isCredit ? "+" : "-"}{formatCurrency(entry.amount, "INR")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
