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
import { topupApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

const topupSchema = z.object({
  amount: z.string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Amount must be greater than 0")
    .refine((val) => Number(val) >= 10, "Minimum top-up amount is ₹10")
    .refine((val) => Number(val) <= 100000, "Maximum top-up amount is ₹1,00,000"),
});

type TopupFormData = z.infer<typeof topupSchema>;

const quickAmounts = [500, 1000, 2500, 5000, 10000];

export default function TopupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

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

  const onSubmit = async (data: TopupFormData) => {
    setIsLoading(true);
    try {
      const idempotencyKey = crypto.randomUUID();
      const gatewayRef = `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      await topupApi.confirm({
        amount: Number(data.amount),
        idempotencyKey,
        gatewayRef,
      });

      toast.success("Top-up successful!", {
        description: `${formatCurrency(Number(data.amount))} has been added to your wallet.`,
      });

      router.push("/dashboard");
    } catch (error: unknown) {
      const apiError = error as { message?: string };
      toast.error("Top-up failed", {
        description: apiError.message || "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-[family-name:var(--font-gabarito)]">
          Top Up Wallet
        </h1>
        <p className="text-slate-500 mt-1">
          Add funds to your NeoBank wallet
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enter Amount</CardTitle>
          <CardDescription>Choose a preset amount or enter a custom value</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-5 gap-3">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickAmount(amt)}
                  className={`py-3 px-2 rounded-lg border text-sm font-medium transition-all ${
                    selectedAmount === amt || amount === amt.toString()
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  ₹{amt.toLocaleString("en-IN")}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Custom Amount</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                  ₹
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="1"
                  min="10"
                  max="100000"
                  placeholder="0"
                  className="pl-8 text-2xl h-14 font-semibold"
                  disabled={isLoading}
                  {...register("amount")}
                  onChange={(e) => {
                    setSelectedAmount(null);
                    register("amount").onChange(e);
                  }}
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-red-600">{errors.amount.message}</p>
              )}
              <p className="text-xs text-slate-400">
                Min: ₹10 &bull; Max: ₹1,00,000
              </p>
            </div>

            {amount && Number(amount) > 0 && (
              <div className="p-4 rounded-lg bg-slate-50 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Amount</span>
                  <span className="text-slate-900">{formatCurrency(Number(amount))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Fee</span>
                  <span className="text-emerald-600">Free</span>
                </div>
                <div className="border-t border-slate-200 pt-3 flex justify-between">
                  <span className="font-medium text-slate-900">Total</span>
                  <span className="font-bold text-slate-900 text-lg">
                    {formatCurrency(Number(amount))}
                  </span>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12"
              disabled={isLoading || !amount || Number(amount) <= 0}
              loading={isLoading}
            >
              {`Top Up ${amount && Number(amount) > 0 ? formatCurrency(Number(amount)) : ""}`}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-slate-900 mb-1">Instant Top Up</h3>
              <p className="text-sm text-slate-500">
                Funds are added to your wallet instantly. There are no fees for top-ups on NeoBank.
                Premium members enjoy higher limits and priority processing.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
