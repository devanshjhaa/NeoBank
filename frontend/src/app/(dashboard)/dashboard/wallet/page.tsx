"use client";

import { useState, useEffect } from "react";
import { walletApi, type WalletResponse } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const data = await walletApi.getMyWallet();
        setWallet(data);
      } catch (error) {
        console.error("Failed to fetch wallet:", error);
        toast.error("Failed to load wallet data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchWallet();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-7 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-100 dark:border-slate-700/50 h-[220px]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#111827] rounded-xl border border-slate-100 dark:border-slate-700/50 h-[90px]" />
          ))}
        </div>
      </div>
    );
  }

  const actions = [
    {
      href: "/dashboard/topup",
      label: "Top Up",
      desc: "Add funds to wallet",
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
      desc: "Transfer to a user",
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
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 dark:text-white tracking-tight">My Wallet</h1>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">Manage your digital wallet and funds</p>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-6 lg:p-8 text-white">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-white/5 rounded-full blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                  <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                  <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                </svg>
              </div>
              <div>
                <p className="text-[15px] font-semibold">NeoBank Wallet</p>
                <p className="text-[12px] text-white/60">Digital Wallet</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
              wallet?.status === "ACTIVE"
                ? "bg-emerald-400/20 text-emerald-200 ring-1 ring-emerald-400/30"
                : "bg-red-400/20 text-red-200 ring-1 ring-red-400/30"
            }`}>
              {wallet?.status || "UNKNOWN"}
            </span>
          </div>

          <div className="mb-8">
            <p className="text-[12px] text-white/50 font-medium mb-1">Available Balance</p>
            <h2 className="text-[40px] font-bold tracking-tight leading-none">
              {formatCurrency(wallet?.balance || 0, wallet?.currency || "INR")}
            </h2>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {actions.map((a) => (
              <Link key={a.href} href={a.href}>
                <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm text-[13px] font-medium transition-all">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {a.icon}
                  </svg>
                  {a.label}
                </button>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions.map((action) => (
          <Link key={action.href} href={action.href}>
            <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-5 group hover:shadow-md hover:shadow-slate-200/60 dark:hover:shadow-black/20 transition-all duration-200 cursor-pointer">
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl ${action.bg} flex items-center justify-center transition-colors`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={action.stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {action.icon}
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-slate-900 dark:text-white">{action.label}</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">{action.desc}</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all shrink-0">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-slate-700/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50">
          <h2 className="text-[13px] font-semibold text-slate-900 dark:text-white">Wallet Details</h2>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Information about your digital wallet</p>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
          {[
            { label: "Wallet ID", value: wallet?.walletId ?? "N/A", mono: true },
            { label: "Currency", value: wallet?.currency || "INR" },
            {
              label: "Status",
              value: wallet?.status || "Unknown",
              color: wallet?.status === "ACTIVE" ? "text-emerald-600" : "text-red-600",
            },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between px-5 py-4">
              <span className="text-[13px] text-slate-500 dark:text-slate-400">{row.label}</span>
              <span className={`text-[13px] font-semibold ${row.color || "text-slate-900 dark:text-white"} ${row.mono ? "font-mono" : ""}`}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
