"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    .refine((val) => Number(val) >= 100, "Minimum payout amount is ₹100"),
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
      <div className="space-y-8 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-[family-name:var(--font-gabarito)]">
            Confirm Payout
          </h1>
          <p className="text-slate-500 mt-1">
            Please review the details before confirming
          </p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-red-50 flex items-center justify-center mb-4">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5"/>
                    <polyline points="5 12 12 5 19 12"/>
                  </svg>
                </div>
                <p className="text-3xl font-bold text-slate-900">
                  {formatCurrency(Number(formData.amount))}
                </p>
                <p className="text-slate-500 mt-1">
                  Withdrawing to bank account #{formData.bankAccountId}
                </p>
              </div>
            </div>

            <div className="space-y-4 p-4 rounded-lg bg-slate-50">
              <div className="flex justify-between">
                <span className="text-slate-500">Bank Account ID</span>
                <span className="font-mono font-medium text-slate-900">#{formData.bankAccountId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount</span>
                <span className="font-medium text-slate-900">{formatCurrency(Number(formData.amount))}</span>
              </div>
              <div className="border-t border-slate-200 pt-4 flex justify-between">
                <span className="font-medium text-slate-900">Total Deducted</span>
                <span className="font-bold text-slate-900 text-lg">
                  {formatCurrency(Number(formData.amount))}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div className="text-sm">
                <p className="font-medium text-amber-700">Processing Time</p>
                <p className="text-slate-600">
                  Payouts typically take 1-3 business days to arrive in your bank account.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep("form")}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={handleConfirm}
                disabled={isLoading}
                loading={isLoading}
              >
                Confirm Payout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-[family-name:var(--font-gabarito)]">
          Payout
        </h1>
        <p className="text-slate-500 mt-1">
          Withdraw funds to your bank account
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payout Details</CardTitle>
          <CardDescription>Enter your bank account ID and amount to withdraw</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="bankAccountId">Bank Account ID</Label>
              <Input
                id="bankAccountId"
                type="text"
                inputMode="numeric"
                placeholder="e.g. 1"
                disabled={isLoading}
                {...register("bankAccountId")}
              />
              {errors.bankAccountId && (
                <p className="text-sm text-red-600">{errors.bankAccountId.message}</p>
              )}
              <p className="text-xs text-slate-400">
                Your linked bank account identifier
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                  ₹
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="1"
                  min="100"
                  placeholder="0"
                  className="pl-8 text-2xl h-14 font-semibold"
                  disabled={isLoading}
                  {...register("amount")}
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-red-600">{errors.amount.message}</p>
              )}
              <p className="text-xs text-slate-400">
                Min: ₹100
              </p>
            </div>

            {amount && Number(amount) > 0 && (
              <div className="p-4 rounded-lg bg-slate-50 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Payout Amount</span>
                  <span className="text-slate-900">{formatCurrency(Number(amount))}</span>
                </div>
                <div className="border-t border-slate-200 pt-3 flex justify-between">
                  <span className="font-medium text-slate-900">Total Deducted</span>
                  <span className="font-bold text-slate-900 text-lg">
                    {formatCurrency(Number(amount))}
                  </span>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12"
              disabled={isLoading}
            >
              Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
