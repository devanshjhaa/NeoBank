"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { topupApi, walletApi } from "@/lib/api";
import type { WalletResponse } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const topupSchema = z.object({
  amount: z.string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Amount must be greater than 0")
    .refine((val) => Number(val) >= 10, "Minimum top-up amount is \u20B910")
    .refine((val) => Number(val) <= 100000, "Maximum top-up amount is \u20B91,00,000"),
});

type TopupFormData = z.infer<typeof topupSchema>;

const quickAmounts = [500, 1000, 2500, 5000, 10000];

export default function TopupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [wallet, setWallet] = useState<WalletResponse | null>(null);

  useEffect(() => {
    walletApi.getMyWallet().then(setWallet).catch(() => {});
  }, []);

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

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TopupFormData>({
    resolver: zodResolver(topupSchema),
  });

  const amount = watch("amount");

  const handleQuickAmount = (amt: number) => {
    setSelectedAmount(amt);
    setValue("amount", amt.toString(), { shouldValidate: true });
  };

  const onSubmit = useCallback(
    async (data: TopupFormData) => {
      if (!razorpayReady || !window.Razorpay) {
        toast.error("Payment gateway is still loading. Please wait.");
        return;
      }
      setIsLoading(true);
      const amountInPaise = Number(data.amount) * 100;
      const idempotencyKey = crypto.randomUUID();

      const options: Record<string, unknown> = {
        key: "rzp_test_SIu1PYqOQfxM0K",
        amount: amountInPaise,
        currency: "INR",
        name: "NeoBank",
        description: "Wallet Top-up",
        handler: async (response: { razorpay_payment_id: string }) => {
          try {
            await topupApi.confirm({
              amount: Number(data.amount),
              idempotencyKey,
              gatewayRef: response.razorpay_payment_id,
            });
            toast.success("Top-up successful!", {
              description: `${formatCurrency(Number(data.amount))} has been added to your wallet.`,
            });
            router.push("/dashboard");
          } catch (error: unknown) {
            const apiError = error as { message?: string };
            toast.error("Top-up confirmation failed", {
              description: apiError.message || "Payment was captured but wallet update failed. Contact support.",
            });
          } finally {
            setIsLoading(false);
          }
        },
        modal: {
          ondismiss: () => setIsLoading(false),
        },
        theme: { color: "#2563eb" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    },
    [razorpayReady, router],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 dark:text-white tracking-tight">Top Up Wallet</h1>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">Add funds to your NeoBank wallet</p>
      </div>

      {wallet && (
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-[12px] text-emerald-200 font-medium">Current Balance</p>
            <p className="text-[26px] font-bold text-white tracking-tight mt-0.5">{formatCurrency(wallet.balance)}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-slate-700/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50">
          <h2 className="text-[13px] font-semibold text-slate-900 dark:text-white">Enter Amount</h2>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Choose a preset amount or enter a custom value</p>
        </div>

        <div className="p-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-5 gap-2.5">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickAmount(amt)}
                  className={`py-3 px-2 rounded-xl text-[13px] font-semibold transition-all duration-150 ${
                    selectedAmount === amt || amount === amt.toString()
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20 ring-1 ring-blue-600"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 ring-1 ring-slate-200 dark:ring-slate-600"
                  }`}
                >
                  {"\u20B9"}{amt.toLocaleString("en-IN")}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Custom Amount</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-semibold text-lg">
                  {"\u20B9"}
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="1"
                  min="10"
                  max="100000"
                  placeholder="0"
                  className="pl-9 text-2xl h-14 font-bold rounded-xl border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:border-blue-500 focus:ring-blue-500/20"
                  disabled={isLoading}
                  {...register("amount")}
                  onChange={(e) => {
                    setSelectedAmount(null);
                    register("amount").onChange(e);
                  }}
                />
              </div>
              {errors.amount && (
                <p className="text-[12px] text-red-600 font-medium">{errors.amount.message}</p>
              )}
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Min: {"\u20B9"}10 &bull; Max: {"\u20B9"}1,00,000
              </p>
            </div>

            {amount && Number(amount) > 0 && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-100 dark:ring-slate-700/50 space-y-3">
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-500 dark:text-slate-400">Amount</span>
                  <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(Number(amount))}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-500 dark:text-slate-400">Fee</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">Free</span>
                </div>
                {wallet && (
                  <div className="flex justify-between text-[13px]">
                    <span className="text-slate-500 dark:text-slate-400">Balance after</span>
                    <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(wallet.balance + Number(amount))}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex justify-between">
                  <span className="text-[13px] font-semibold text-slate-900 dark:text-white">Total</span>
                  <span className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">
                    {formatCurrency(Number(amount))}
                  </span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !amount || Number(amount) <= 0}
              className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-semibold transition-all shadow-sm shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {`Top Up ${amount && Number(amount) > 0 ? formatCurrency(Number(amount)) : ""}`}
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white mb-1">Instant Top Up</h3>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Funds are added to your wallet instantly. There are no fees for top-ups on NeoBank.
              Premium members enjoy higher limits and priority processing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
