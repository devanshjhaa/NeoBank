"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { transferApi, walletApi } from "@/lib/api";
import type { WalletResponse } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { motion } from "framer-motion";

const transferSchema = z.object({
  receiverId: z.string()
    .min(1, "Receiver ID is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Enter a valid user ID"),
  amount: z.string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Amount must be greater than 0")
    .refine((val) => Number(val) >= 1, "Minimum transfer amount is \u20B91"),
});

type TransferFormData = z.infer<typeof transferSchema>;

const quickAmounts = [100, 500, 1000, 2500, 5000];

export default function TransferPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [formData, setFormData] = useState<TransferFormData | null>(null);
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
  });

  const amount = watch("amount");

  useEffect(() => {
    walletApi.getMyWallet().then(setWallet).catch(() => {});
  }, []);

  useEffect(() => {
    const rid = searchParams.get("receiverId");
    if (rid) {
      setValue("receiverId", rid, { shouldValidate: true });
    }
  }, [searchParams, setValue]);

  const handleQuickAmount = (amt: number) => {
    setSelectedAmount(amt);
    setValue("amount", amt.toString(), { shouldValidate: true });
  };

  const handleFormSubmit = (data: TransferFormData) => {
    setFormData(data);
    setStep("confirm");
  };

  const handleConfirm = async () => {
    if (!formData) return;

    setIsLoading(true);
    try {
      await transferApi.send({
        receiverId: Number(formData.receiverId),
        amount: Number(formData.amount),
        idempotencyKey: crypto.randomUUID(),
      });

      toast.success("Transfer successful!", {
        description: `${formatCurrency(Number(formData.amount))} sent to user #${formData.receiverId}`,
      });

      router.push("/dashboard");
    } catch (error: unknown) {
      const apiError = error as { message?: string };
      const msg = apiError.message || "";
      const description = msg.toLowerCase().includes("wallet not found")
        ? "This user doesn\u2019t have a NeoBank wallet. Please check the user ID and try again."
        : msg.toLowerCase().includes("insufficient")
        ? "You don\u2019t have enough balance. Top up your wallet and try again."
        : msg || "Please check your balance and try again.";
      toast.error("Transfer failed", { description });
      setStep("form");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "confirm" && formData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 dark:text-white tracking-tight">Confirm Transfer</h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">Please review the details before confirming</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-slate-700/50 overflow-hidden">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-center py-6">
              <div className="flex items-center gap-5">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">You</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-8 h-px bg-slate-300 dark:bg-slate-600" />
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </div>
                    <div className="w-8 h-px bg-slate-300 dark:bg-slate-600" />
                  </div>
                  <span className="text-[15px] font-bold text-blue-600 dark:text-blue-400">{formatCurrency(Number(formData.amount))}</span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">User #{formData.receiverId}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-100 dark:ring-slate-700/50 space-y-3">
              <div className="flex justify-between text-[13px]">
                <span className="text-slate-500 dark:text-slate-400">To (User ID)</span>
                <span className="font-semibold text-slate-900 dark:text-white">#{formData.receiverId}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-slate-500 dark:text-slate-400">Amount</span>
                <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(Number(formData.amount))}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-slate-500 dark:text-slate-400">Fee</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Free</span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex justify-between">
                <span className="text-[13px] font-semibold text-slate-900 dark:text-white">Total</span>
                <span className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">
                  {formatCurrency(Number(formData.amount))}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("form")}
                disabled={isLoading}
                className="flex-1 h-12 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-[14px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-semibold transition-all shadow-sm shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                Confirm Transfer
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 dark:text-white tracking-tight">Send Money</h1>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">Transfer money to another NeoBank user instantly</p>
      </div>

      {wallet && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-[12px] text-blue-200 font-medium">Available Balance</p>
            <p className="text-[26px] font-bold text-white tracking-tight mt-0.5">{formatCurrency(wallet.balance)}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-slate-700/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50">
          <h2 className="text-[13px] font-semibold text-slate-900 dark:text-white">Transfer Details</h2>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Enter the recipient&apos;s user ID and amount to send</p>
        </div>

        <div className="p-5">
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="receiverId" className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Receiver User ID</Label>
              <Input
                id="receiverId"
                type="text"
                inputMode="numeric"
                placeholder="e.g. 12"
                className="rounded-xl border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:border-blue-500 focus:ring-blue-500/20"
                disabled={isLoading}
                {...register("receiverId")}
              />
              {errors.receiverId && (
                <p className="text-[12px] text-red-600 font-medium">{errors.receiverId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Amount</Label>
              <div className="grid grid-cols-5 gap-2 mb-3">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickAmount(amt)}
                    className={`py-2.5 rounded-xl text-[12px] font-semibold transition-all ${
                      selectedAmount === amt || amount === amt.toString()
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20 ring-1 ring-blue-600"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 ring-1 ring-slate-200 dark:ring-slate-600"
                    }`}
                  >
                    {"\u20B9"}{amt.toLocaleString("en-IN")}
                  </button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-semibold text-lg">
                  {"\u20B9"}
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="0.00"
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
            </div>

            {amount && Number(amount) > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-100 dark:ring-slate-700/50 space-y-3">
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
                    <span className={`font-medium ${(wallet.balance - Number(amount)) >= 0 ? "text-slate-900 dark:text-white" : "text-red-600 dark:text-red-400"}`}>
                      {formatCurrency(wallet.balance - Number(amount))}
                    </span>
                  </div>
                )}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex justify-between">
                  <span className="text-[13px] font-semibold text-slate-900 dark:text-white">Total</span>
                  <span className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">
                    {formatCurrency(Number(amount))}
                  </span>
                </div>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-semibold transition-all shadow-sm shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </form>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-5">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div>
              <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white mb-1">Instant Transfers</h3>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Money is transferred instantly between NeoBank wallets with zero fees.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-5">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div>
              <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white mb-1">Fully Secured</h3>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed">
                All transfers are secured with idempotency keys and protected by bank-grade encryption.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-5">
        <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white mb-3">Transfer Limits</h3>
        <div className="space-y-2.5">
          {[
            { label: "Per transaction", value: "\u20B925,000", sub: "Free tier" },
            { label: "Daily limit", value: "\u20B950,000", sub: "Free tier" },
            { label: "Per transaction", value: "\u20B975,000", sub: "Premium", badge: true },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/80 last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-slate-500 dark:text-slate-400">{item.label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-semibold ring-1 ring-amber-200/50 dark:ring-amber-700/50">
                    {item.sub}
                  </span>
                )}
                {!item.badge && <span className="text-[11px] text-slate-400 dark:text-slate-500">({item.sub})</span>}
              </div>
              <span className="text-[13px] font-semibold text-slate-900 dark:text-white">{item.value}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
