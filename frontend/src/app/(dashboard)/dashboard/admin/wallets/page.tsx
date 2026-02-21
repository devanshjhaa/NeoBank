"use client";

import { useState, useEffect, useCallback } from "react";
import { adminApi, type WalletSummary } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminWalletsPage() {
  const [wallets, setWallets] = useState<WalletSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const fetchWallets = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getWallets();
      setWallets(data);
    } catch (error: unknown) {
      const apiError = error as { message?: string };
      toast.error("Failed to load wallets", {
        description: apiError.message || "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const handleFreeze = async (walletId: number) => {
    setActionLoading(walletId);
    try {
      await adminApi.freezeWallet(walletId);
      toast.success("Wallet frozen", {
        description: `Wallet #${walletId} has been frozen.`,
      });
      await fetchWallets();
    } catch (error: unknown) {
      const apiError = error as { message?: string };
      toast.error("Failed to freeze wallet", {
        description: apiError.message || "Please try again.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnfreeze = async (walletId: number) => {
    setActionLoading(walletId);
    try {
      await adminApi.unfreezeWallet(walletId);
      toast.success("Wallet unfrozen", {
        description: `Wallet #${walletId} has been unfrozen.`,
      });
      await fetchWallets();
    } catch (error: unknown) {
      const apiError = error as { message?: string };
      toast.error("Failed to unfreeze wallet", {
        description: apiError.message || "Please try again.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = wallets.filter(
    (w) =>
      w.id.toString().includes(search) ||
      w.userId.toString().includes(search) ||
      w.status.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200/50",
      FROZEN: "bg-blue-50 text-blue-700 ring-blue-200/50",
      SUSPENDED: "bg-red-50 text-red-700 ring-red-200/50",
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ring-1 ${map[status] || "bg-slate-50 text-slate-600 ring-slate-200/50"}`}>
        {status}
      </span>
    );
  };

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-7 w-48 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-4 w-64 bg-slate-100 rounded-lg animate-pulse mt-2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-xl border border-slate-200/80 animate-pulse" />
          ))}
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="h-10 bg-slate-100 rounded-xl animate-pulse max-w-sm" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-5 py-4 border-b border-slate-50 flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
                <div className="h-3 w-24 bg-slate-50 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Wallets</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">Manage all user wallets</p>
        </div>
        <button
          onClick={fetchWallets}
          className="h-9 px-4 rounded-xl border border-slate-200 bg-white text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Wallets</p>
          <p className="text-[20px] font-bold text-slate-900 mt-1 tabular-nums">{wallets.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-4">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Balance</p>
          <p className="text-[20px] font-bold text-slate-900 mt-1 tabular-nums">{formatCurrency(totalBalance)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-4">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Frozen</p>
          <p className="text-[20px] font-bold text-blue-600 mt-1 tabular-nums">
            {wallets.filter((w) => w.status === "FROZEN").length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="relative max-w-sm">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Search by wallet ID, user ID, or status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-transparent text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-200 focus:ring-2 focus:ring-blue-600/10 transition-all"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
              </svg>
            </div>
            <h3 className="text-[15px] font-semibold text-slate-900 mb-1">No wallets found</h3>
            <p className="text-[13px] text-slate-400">Try adjusting your search query</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Wallet</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">User ID</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Balance</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Created</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((wallet) => {
                  const isFrozen = wallet.status === "FROZEN";
                  const isActioning = actionLoading === wallet.id;

                  return (
                    <tr key={wallet.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[12px] font-bold text-white shrink-0 ${
                            isFrozen
                              ? "bg-gradient-to-br from-blue-400 to-blue-600"
                              : "bg-gradient-to-br from-emerald-500 to-emerald-600"
                          }`}>
                            W
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-slate-900">Wallet #{wallet.id}</p>
                            <p className="text-[11px] text-slate-400">{wallet.currency}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-[13px] text-slate-600 font-mono">#{wallet.userId}</p>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <p className="text-[14px] font-bold text-slate-900 tabular-nums">
                          {formatCurrency(wallet.balance)}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">{getStatusBadge(wallet.status)}</td>
                      <td className="px-5 py-3.5">
                        <p className="text-[12px] text-slate-500">{formatDate(wallet.createdAt)}</p>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {isFrozen ? (
                          <button
                            onClick={() => handleUnfreeze(wallet.id)}
                            disabled={isActioning}
                            className="h-8 px-3.5 rounded-lg bg-emerald-50 text-emerald-700 text-[12px] font-semibold hover:bg-emerald-100 transition-colors ring-1 ring-emerald-200/50 disabled:opacity-50 inline-flex items-center gap-1.5"
                          >
                            {isActioning ? (
                              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            ) : (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                              </svg>
                            )}
                            Unfreeze
                          </button>
                        ) : (
                          <button
                            onClick={() => handleFreeze(wallet.id)}
                            disabled={isActioning}
                            className="h-8 px-3.5 rounded-lg bg-blue-50 text-blue-700 text-[12px] font-semibold hover:bg-blue-100 transition-colors ring-1 ring-blue-200/50 disabled:opacity-50 inline-flex items-center gap-1.5"
                          >
                            {isActioning ? (
                              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            ) : (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                              </svg>
                            )}
                            Freeze
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
