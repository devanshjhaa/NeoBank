"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { payoutApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

const payoutSchema = z.object({
  bankAccountId: z.string()
    .min(1, "Bank account ID is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Enter a valid bank account ID"),
  amount: z.string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Amount must be greater than 0")
    .refine((val) => Number(val) >= 100, "Minimum payout amount is \u20B9100"),
});

type PayoutFormData = z.infer<typeof payoutSchema>;

export default function PayoutPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [formData, setFormData] = useState<PayoutFormData | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PayoutFormData>({
    resolver: zodResolver(payoutSchema),
  });

  const amount = watch("amount");

  const handleFormSubmit = (data: PayoutFormData) => {
    setFormData(data);
    setStep("confirm");
  };

  const handleConfirm = async () => {
    if (!formData) return;

    setIsLoading(true);
    try {
      await payoutApi.request({
        bankAccountId: Number(formData.bankAccountId),
        amount: Number(formData.amount),
        idempotencyKey: crypto.randomUUID(),
      });

      toast.success("Payout initiated!", {
        description: `${formatCurrency(Number(formData.amount))} is being sent to your bank account.`,
      });

      router.push("/dashboard");
    } catch (error: unknown) {
      const apiError = error as { message?: string };
      toast.error("Payout failed", {
        description: apiError.message || "Please check your balance and try again.",
      });
      setStep("form");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "confirm" && formData) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Confirm Payout</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">Please review the details before confirming</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-center py-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                </div>
                <p className="text-[28px] font-bold text-slate-900 tracking-tight">
                  {formatCurrency(Number(formData.amount))}
                </p>
                <p className="text-[12px] text-slate-400 mt-1">
                  Withdrawing to bank account #{formData.bankAccountId}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 ring-1 ring-slate-100 space-y-3">
              <div className="flex justify-between text-[13px]">
                <span className="text-slate-500">Bank Account ID</span>
                <span className="font-mono font-semibold text-slate-900">#{formData.bankAccountId}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-slate-500">Amount</span>
                <span className="font-semibold text-slate-900">{formatCurrency(Number(formData.amount))}</span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between">
                <span className="text-[13px] font-semibold text-slate-900">Total Deducted</span>
                <span className="font-bold text-slate-900 text-lg tracking-tight">
                  {formatCurrency(Number(formData.amount))}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 ring-1 ring-amber-200/50">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div>
                <p className="text-[12px] font-semibold text-amber-700">Processing Time</p>
                <p className="text-[12px] text-amber-600 mt-0.5">
                  Payouts typically take 1-3 business days to arrive in your bank account.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("form")}
                disabled={isLoading}
                className="flex-1 h-12 rounded-xl border border-slate-200 bg-white text-[14px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
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
                Confirm Payout
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Payout</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">Withdraw funds to your bank account</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-[13px] font-semibold text-slate-900">Payout Details</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Enter your bank account ID and amount to withdraw</p>
        </div>

        <div className="p-5">
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="bankAccountId" className="text-[13px] font-medium text-slate-700">Bank Account ID</Label>
              <Input
                id="bankAccountId"
                type="text"
                inputMode="numeric"
                placeholder="e.g. 1"
                className="rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                disabled={isLoading}
                {...register("bankAccountId")}
              />
              {errors.bankAccountId && (
                <p className="text-[12px] text-red-600 font-medium">{errors.bankAccountId.message}</p>
              )}
              <p className="text-[11px] text-slate-400">Your linked bank account identifier</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-[13px] font-medium text-slate-700">Amount</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-lg">
                  \u20B9
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="1"
                  min="100"
                  placeholder="0"
                  className="pl-9 text-2xl h-14 font-bold rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                  disabled={isLoading}
                  {...register("amount")}
                />
              </div>
              {errors.amount && (
                <p className="text-[12px] text-red-600 font-medium">{errors.amount.message}</p>
              )}
              <p className="text-[11px] text-slate-400">Min: \u20B9100</p>
            </div>

            {amount && Number(amount) > 0 && (
              <div className="p-4 rounded-xl bg-slate-50 ring-1 ring-slate-100 space-y-3">
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-500">Payout Amount</span>
                  <span className="font-medium text-slate-900">{formatCurrency(Number(amount))}</span>
                </div>
                <div className="border-t border-slate-200 pt-3 flex justify-between">
                  <span className="text-[13px] font-semibold text-slate-900">Total Deducted</span>
                  <span className="font-bold text-slate-900 text-lg tracking-tight">
                    {formatCurrency(Number(amount))}
                  </span>
                </div>
              </div>
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
      </div>
    </div>
  );
}
