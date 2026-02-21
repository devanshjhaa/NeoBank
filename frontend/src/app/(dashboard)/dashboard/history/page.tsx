"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

export default function HistoryPage() {
  const [filter, setFilter] = useState<FilterType>("ALL");

  const filtered = filter === "ALL"
    ? mockTransactions
    : mockTransactions.filter((tx) => tx.type === filter);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "TOPUP":
        return (
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <polyline points="19 12 12 19 5 12"/>
            </svg>
          </div>
        );
      case "TRANSFER":
        return (
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </div>
        );
      case "PAYOUT":
        return (
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5"/>
              <polyline points="5 12 12 5 19 12"/>
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      COMPLETED: "bg-emerald-50 text-emerald-700",
      PENDING: "bg-amber-50 text-amber-700",
      FAILED: "bg-red-50 text-red-700",
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || ""}`}>
        {status}
      </span>
    );
  };

  const getAmountColor = (type: string) => {
    return type === "TOPUP" ? "text-emerald-600" : "text-slate-900";
  };

  const filters: { label: string; value: FilterType }[] = [
    { label: "All", value: "ALL" },
    { label: "Top Up", value: "TOPUP" },
    { label: "Transfer", value: "TRANSFER" },
    { label: "Payout", value: "PAYOUT" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-[family-name:var(--font-gabarito)]">
          Transaction History
        </h1>
        <p className="text-slate-500 mt-1">
          View all your past transactions
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f.value
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
        <p className="text-sm text-amber-800">
          Transaction history API is under development. Showing sample data for preview.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {filter === "ALL" ? "All Transactions" : `${filter.charAt(0) + filter.slice(1).toLowerCase()} Transactions`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No transactions found</h3>
              <p className="text-slate-400">
                {filter === "ALL"
                  ? "You haven\u2019t made any transactions yet"
                  : `No ${filter.toLowerCase()} transactions found`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {getTransactionIcon(tx.type)}
                    <div>
                      <p className="font-medium text-slate-900">
                        {tx.type.charAt(0) + tx.type.slice(1).toLowerCase()}
                      </p>
                      <p className="text-sm text-slate-400">
                        {tx.description} &bull; {formatDate(tx.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${getAmountColor(tx.type)}`}>
                      {tx.type === "TOPUP" ? "+" : "-"}{formatCurrency(tx.amount)}
                    </p>
                    <div className="mt-1">{getStatusBadge(tx.status)}</div>
                  </div>
                </div>
              ))}

              <div className="pt-4 text-center">
                <Button variant="outline" disabled>
                  Load More (Coming Soon)
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
