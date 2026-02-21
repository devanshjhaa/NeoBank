"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-[family-name:var(--font-gabarito)]">
          My Wallet
        </h1>
        <p className="text-slate-500 mt-1">
          Manage your digital wallet and view your balance
        </p>
      </div>

      <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-0 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-[80px]" />

        <CardContent className="relative z-10 p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/>
                </svg>
              </div>
              <div>
                <p className="text-lg font-semibold">NeoBank Wallet</p>
                <p className="text-sm text-white/60">Digital Wallet</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              wallet?.status === "ACTIVE"
                ? "bg-emerald-400/20 text-emerald-200"
                : "bg-red-400/20 text-red-200"
            }`}>
              {wallet?.status || "UNKNOWN"}
            </span>
          </div>

          <div className="mb-8">
            <p className="text-sm text-white/60 mb-2">Available Balance</p>
            <h2 className="text-5xl font-bold font-[family-name:var(--font-gabarito)]">
              {formatCurrency(wallet?.balance || 0, wallet?.currency || "INR")}
            </h2>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/topup">
              <Button className="gap-2 bg-white text-blue-700 hover:bg-white/90">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Top Up
              </Button>
            </Link>
            <Link href="/dashboard/transfer">
              <Button variant="outline" className="gap-2 border-white/20 text-white hover:bg-white/10 hover:text-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                Transfer
              </Button>
            </Link>
            <Link href="/dashboard/payout">
              <Button variant="outline" className="gap-2 border-white/20 text-white hover:bg-white/10 hover:text-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5"/>
                  <polyline points="5 12 12 5 19 12"/>
                </svg>
                Payout
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:border-blue-300 transition-colors cursor-pointer">
          <Link href="/dashboard/topup">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <polyline points="19 12 12 19 5 12"/>
                </svg>
              </div>
              <div>
                <p className="font-medium text-slate-900">Top Up</p>
                <p className="text-sm text-slate-400">Add funds to wallet</p>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:border-blue-300 transition-colors cursor-pointer">
          <Link href="/dashboard/transfer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </div>
              <div>
                <p className="font-medium text-slate-900">Transfer</p>
                <p className="text-sm text-slate-400">Send to another user</p>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:border-blue-300 transition-colors cursor-pointer">
          <Link href="/dashboard/payout">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5"/>
                  <polyline points="5 12 12 5 19 12"/>
                </svg>
              </div>
              <div>
                <p className="font-medium text-slate-900">Payout</p>
                <p className="text-sm text-slate-400">Withdraw to bank</p>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Wallet Details</CardTitle>
          <CardDescription>Information about your digital wallet</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between py-3 border-b border-slate-200">
            <span className="text-slate-500">Wallet ID</span>
            <span className="font-mono text-slate-900">{wallet?.walletId ?? "N/A"}</span>
          </div>
          <div className="flex justify-between py-3 border-b border-slate-200">
            <span className="text-slate-500">Currency</span>
            <span className="text-slate-900">{wallet?.currency || "INR"}</span>
          </div>
          <div className="flex justify-between py-3">
            <span className="text-slate-500">Status</span>
            <span className={`font-medium ${wallet?.status === "ACTIVE" ? "text-emerald-600" : "text-red-600"}`}>
              {wallet?.status || "Unknown"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
