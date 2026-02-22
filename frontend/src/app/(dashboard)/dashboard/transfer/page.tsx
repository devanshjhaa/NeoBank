"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { transferApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

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

export default function TransferPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [formData, setFormData] = useState<TransferFormData | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
  });

  const amount = watch("amount");

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
      toast.error("Transfer failed", {
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
          <h1 className="text-[22px] font-bold text-slate-900 dark:text-white tracking-tight">Confirm Transfer</h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">Please review the details before confirming</p>
        </div>

        <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-slate-700/50 overflow-hidden">
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
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 dark:text-white tracking-tight">Send Money</h1>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">Transfer money to another NeoBank user instantly</p>
      </div>

      <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-slate-700/50 overflow-hidden">
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
                />
              </div>
              {errors.amount && (
                <p className="text-[12px] text-red-600 font-medium">{errors.amount.message}</p>
              )}
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
