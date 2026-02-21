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
    .refine((val) => Number(val) >= 1, "Minimum transfer amount is ₹1"),
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
      <div className="space-y-8 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-[family-name:var(--font-gabarito)]">
            Confirm Transfer
          </h1>
          <p className="text-slate-500 mt-1">
            Please review the details before confirming
          </p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div className="flex items-center gap-2">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatCurrency(Number(formData.amount))}
                  </span>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </div>
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-4 rounded-lg bg-slate-50">
              <div className="flex justify-between">
                <span className="text-slate-500">To (User ID)</span>
                <span className="font-medium text-slate-900">#{formData.receiverId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount</span>
                <span className="font-medium text-slate-900">{formatCurrency(Number(formData.amount))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fee</span>
                <span className="text-emerald-600">Free</span>
              </div>
              <div className="border-t border-slate-200 pt-4 flex justify-between">
                <span className="font-medium text-slate-900">Total</span>
                <span className="font-bold text-slate-900 text-lg">
                  {formatCurrency(Number(formData.amount))}
                </span>
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
                Confirm Transfer
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
          Transfer Money
        </h1>
        <p className="text-slate-500 mt-1">
          Send money to another NeoBank user instantly
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transfer Details</CardTitle>
          <CardDescription>Enter the recipient&apos;s user ID and amount to send</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="receiverId">Receiver User ID</Label>
              <Input
                id="receiverId"
                type="text"
                inputMode="numeric"
                placeholder="e.g. 12"
                disabled={isLoading}
                {...register("receiverId")}
              />
              {errors.receiverId && (
                <p className="text-sm text-red-600">{errors.receiverId.message}</p>
              )}
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
                  step="0.01"
                  min="1"
                  placeholder="0.00"
                  className="pl-8 text-2xl h-14 font-semibold"
                  disabled={isLoading}
                  {...register("amount")}
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-red-600">{errors.amount.message}</p>
              )}
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
