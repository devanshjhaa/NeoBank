"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { payoutApi, bankAccountApi, walletApi } from "@/lib/api";
import type { BankAccountResponse, WalletResponse } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const linkSchema = z.object({
  accountNumber: z
    .string()
    .min(1, "Account number is required")
    .regex(/^[0-9]{9,18}$/, "Must be 9-18 digits"),
  ifscCode: z
    .string()
    .min(1, "IFSC code is required")
    .regex(/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/, "Invalid IFSC format (e.g. SBIN0001234)"),
  holderName: z.string().min(1, "Account holder name is required"),
});

type LinkFormData = z.infer<typeof linkSchema>;

const payoutSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Amount must be greater than 0")
    .refine((val) => Number(val) >= 100, "Minimum payout amount is \u20B9100"),
});

type PayoutFormData = z.infer<typeof payoutSchema>;

function BankIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
    </svg>
  );
}

function LinkBankAccountForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: (account: BankAccountResponse) => void;
  onCancel: () => void;
}) {
  const [isLinking, setIsLinking] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LinkFormData>({ resolver: zodResolver(linkSchema) });

  const onSubmit = async (data: LinkFormData) => {
    setIsLinking(true);
    try {
      const account = await bankAccountApi.link({
        accountNumber: data.accountNumber,
        ifscCode: data.ifscCode.toUpperCase(),
        holderName: data.holderName,
      });
      toast.success("Bank account linked!", {
        description: `Account ending ${account.maskedAccountNumber} is now verified.`,
      });
      onSuccess(account);
    } catch (error: unknown) {
      const apiError = error as { message?: string };
      toast.error("Failed to link account", {
        description: apiError.message || "Please check your details and try again.",
      });
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-slate-700/50 overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
        <div>
          <h2 className="text-[13px] font-semibold text-slate-900 dark:text-white">Link Bank Account</h2>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            Sandbox mode {"\u2014"} accounts are auto-verified instantly
          </p>
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 ring-1 ring-emerald-200/50 dark:ring-emerald-700/50 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Test Mode
        </span>
      </div>

      <div className="p-5">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="accountNumber" className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
              Account Number
            </Label>
            <Input
              id="accountNumber"
              type="text"
              inputMode="numeric"
              placeholder="e.g. 50100012345678"
              className="rounded-xl border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:border-blue-500 focus:ring-blue-500/20"
              disabled={isLinking}
              {...register("accountNumber")}
            />
            {errors.accountNumber && (
              <p className="text-[12px] text-red-600 font-medium">{errors.accountNumber.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ifscCode" className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
              IFSC Code
            </Label>
            <Input
              id="ifscCode"
              type="text"
              placeholder="e.g. SBIN0001234"
              className="rounded-xl border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:border-blue-500 focus:ring-blue-500/20 uppercase"
              disabled={isLinking}
              {...register("ifscCode")}
            />
            {errors.ifscCode && (
              <p className="text-[12px] text-red-600 font-medium">{errors.ifscCode.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="holderName" className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
              Account Holder Name
            </Label>
            <Input
              id="holderName"
              type="text"
              placeholder="e.g. John Doe"
              className="rounded-xl border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:border-blue-500 focus:ring-blue-500/20"
              disabled={isLinking}
              {...register("holderName")}
            />
            {errors.holderName && (
              <p className="text-[12px] text-red-600 font-medium">{errors.holderName.message}</p>
            )}
          </div>

          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-200/50 dark:ring-blue-700/50">
            <div className="flex items-start gap-2.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <p className="text-[11px] text-blue-600 dark:text-blue-400 leading-relaxed">
                In sandbox mode, any valid IFSC and account number will be accepted and auto-verified.
                Use test values like IFSC: <span className="font-mono font-semibold">SBIN0001234</span>
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLinking}
              className="flex-1 h-11 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-[13px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLinking}
              className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold transition-all shadow-sm shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLinking && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              Link & Verify
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

export default function PayoutPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [accounts, setAccounts] = useState<BankAccountResponse[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<BankAccountResponse | null>(null);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [step, setStep] = useState<"select" | "amount" | "confirm">("select");
  const [payoutAmount, setPayoutAmount] = useState<string>("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [wallet, setWallet] = useState<WalletResponse | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PayoutFormData>({
    resolver: zodResolver(payoutSchema),
  });

  const amount = watch("amount");

  useEffect(() => {
    Promise.all([
      bankAccountApi.list(),
      walletApi.getMyWallet(),
    ]).then(([data, w]) => {
        setAccounts(data);
        if (data.length === 1) setSelectedAccount(data[0]);
        setWallet(w);
      })
      .catch(() => {})
      .finally(() => setLoadingAccounts(false));
  }, []);

  const handleDeleteAccount = async (id: number) => {
    setDeletingId(id);
    try {
      await bankAccountApi.remove(id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      if (selectedAccount?.id === id) setSelectedAccount(null);
      toast.success("Bank account removed");
    } catch (error: unknown) {
      const apiError = error as { message?: string };
      toast.error("Failed to remove", { description: apiError.message || "Please try again." });
    } finally {
      setDeletingId(null);
    }
  };

  const handleAccountLinked = (account: BankAccountResponse) => {
    setAccounts((prev) => [...prev, account]);
    setSelectedAccount(account);
    setShowLinkForm(false);
  };

  const handleAmountSubmit = (data: PayoutFormData) => {
    setPayoutAmount(data.amount);
    setStep("confirm");
  };

  const handleConfirm = async () => {
    if (!selectedAccount || !payoutAmount) return;
    setIsLoading(true);
    try {
      await payoutApi.request({
        bankAccountId: selectedAccount.id,
        amount: Number(payoutAmount),
        idempotencyKey: crypto.randomUUID(),
      });
      toast.success("Payout initiated!", {
        description: `${formatCurrency(Number(payoutAmount))} is being sent to ${selectedAccount.maskedAccountNumber}.`,
      });
      router.push("/dashboard");
    } catch (error: unknown) {
      const apiError = error as { message?: string };
      toast.error("Payout failed", {
        description: apiError.message || "Please check your balance and try again.",
      });
      setStep("amount");
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingAccounts) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin h-6 w-6 text-blue-600" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (step === "confirm" && selectedAccount) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 dark:text-white tracking-tight">Confirm Payout</h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">Review the details before confirming</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-slate-700/50 overflow-hidden">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-center py-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center mb-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                </div>
                <p className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight">
                  {formatCurrency(Number(payoutAmount))}
                </p>
                <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-1">
                  Withdrawing to {selectedAccount.holderName}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-100 dark:ring-slate-700/50 space-y-3">
              <div className="flex justify-between text-[13px]">
                <span className="text-slate-500 dark:text-slate-400">Account Holder</span>
                <span className="font-semibold text-slate-900 dark:text-white">{selectedAccount.holderName}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-slate-500 dark:text-slate-400">Account Number</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">{selectedAccount.maskedAccountNumber}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-slate-500 dark:text-slate-400">IFSC Code</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">{selectedAccount.ifscCode}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-slate-500 dark:text-slate-400">Payout Amount</span>
                <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(Number(payoutAmount))}</span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex justify-between">
                <span className="text-[13px] font-semibold text-slate-900 dark:text-white">Total Deducted</span>
                <span className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">
                  {formatCurrency(Number(payoutAmount))}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-200/50 dark:ring-amber-700/50">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div>
                <p className="text-[12px] font-semibold text-amber-700 dark:text-amber-400">Processing Time</p>
                <p className="text-[12px] text-amber-600 dark:text-amber-300 mt-0.5">
                  Payouts typically take 1-3 business days to arrive in your bank account.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("amount")}
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
                Confirm Payout
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (step === "amount" && selectedAccount) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 dark:text-white tracking-tight">Payout</h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">Withdraw funds to your bank account</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-slate-700/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50">
            <h2 className="text-[13px] font-semibold text-slate-900 dark:text-white">Payout Details</h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Enter the amount to withdraw</p>
          </div>

          <div className="p-5 space-y-5">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-100 dark:ring-slate-700/50">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <BankIcon />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-slate-900 dark:text-white truncate">{selectedAccount.holderName}</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {selectedAccount.maskedAccountNumber} {"\u00B7"} {selectedAccount.ifscCode}
                </p>
              </div>
              <button
                onClick={() => { setStep("select"); setSelectedAccount(null); }}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
              >
                Change
              </button>
            </div>

            <form onSubmit={handleSubmit(handleAmountSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Amount</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-semibold text-lg">{"\u20B9"}</span>
                  <Input
                    id="amount"
                    type="number"
                    step="1"
                    min="100"
                    placeholder="0"
                    className="pl-9 text-2xl h-14 font-bold rounded-xl border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:border-blue-500 focus:ring-blue-500/20"
                    {...register("amount")}
                  />
                </div>
                {errors.amount && (
                  <p className="text-[12px] text-red-600 font-medium">{errors.amount.message}</p>
                )}
                <p className="text-[11px] text-slate-400 dark:text-slate-500">Min: {"\u20B9"}100</p>
              </div>

              {amount && Number(amount) > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-100 dark:ring-slate-700/50 space-y-3">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-slate-500 dark:text-slate-400">Payout Amount</span>
                    <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(Number(amount))}</span>
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex justify-between">
                    <span className="text-[13px] font-semibold text-slate-900 dark:text-white">Total Deducted</span>
                    <span className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">{formatCurrency(Number(amount))}</span>
                  </div>
                </motion.div>
              )}

              <button
                type="submit"
                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-semibold transition-all shadow-sm shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 dark:text-white tracking-tight">Payout</h1>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">Withdraw funds to your bank account</p>
      </div>

      {wallet && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-violet-600 via-violet-700 to-purple-700 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-[12px] text-violet-200 font-medium">Available for Withdrawal</p>
            <p className="text-[26px] font-bold text-white tracking-tight mt-0.5">{formatCurrency(wallet.balance)}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {showLinkForm ? (
          <LinkBankAccountForm
            key="link-form"
            onSuccess={handleAccountLinked}
            onCancel={() => setShowLinkForm(false)}
          />
        ) : (
          <motion.div
            key="accounts-list"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-4"
          >
            <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-slate-700/50 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                <div>
                  <h2 className="text-[13px] font-semibold text-slate-900 dark:text-white">Linked Bank Accounts</h2>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    {accounts.length > 0
                      ? "Select an account to withdraw to"
                      : "Link a bank account to start withdrawing"}
                  </p>
                </div>
                <button
                  onClick={() => setShowLinkForm(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[12px] font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add Account
                </button>
              </div>

              <div className="p-5">
                {accounts.length === 0 ? (
                  <div className="py-10 text-center">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-400 dark:text-slate-500">
                      <BankIcon />
                    </div>
                    <p className="text-[14px] font-semibold text-slate-900 dark:text-white">No Bank Accounts Linked</p>
                    <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">
                      Link your bank account to withdraw funds from your wallet. Accounts are auto-verified in sandbox mode.
                    </p>
                    <button
                      onClick={() => setShowLinkForm(true)}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold transition-all shadow-sm shadow-blue-600/20"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Link Bank Account
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {accounts.map((account) => (
                      <div
                        key={account.id}
                        className={`group relative flex items-center gap-3.5 p-4 rounded-xl border transition-all cursor-pointer ${
                          selectedAccount?.id === account.id
                            ? "border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-blue-200/50 dark:ring-blue-800/50"
                            : "border-slate-200/80 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                        }`}
                        onClick={() => setSelectedAccount(account)}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          selectedAccount?.id === account.id
                            ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                        }`}>
                          <BankIcon />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-slate-900 dark:text-white truncate">{account.holderName}</p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">
                            {account.maskedAccountNumber} {"\u00B7"} {account.ifscCode}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {account.verified && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold ring-1 ring-emerald-200/50 dark:ring-emerald-700/50">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              Verified
                            </span>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteAccount(account.id); }}
                            disabled={deletingId === account.id}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all disabled:opacity-50"
                            title="Remove account"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                          {selectedAccount?.id === account.id && (
                            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {selectedAccount && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <button
                  onClick={() => setStep("amount")}
                  className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-semibold transition-all shadow-sm shadow-blue-600/20"
                >
                  Continue with {selectedAccount.maskedAccountNumber}
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-5">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white mb-1">Processing Time</h3>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Payouts typically take 1-3 business days to arrive at your bank.
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
              <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white mb-1">Verified Accounts Only</h3>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Withdrawals are only allowed to verified bank accounts for your security.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-5">
        <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white mb-3">Payout Limits</h3>
        <div className="space-y-2.5">
          {[
            { label: "Minimum payout", value: "\u20B9100" },
            { label: "Per transaction", value: "\u20B925,000", sub: "Free tier" },
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
                {item.sub && !item.badge && <span className="text-[11px] text-slate-400 dark:text-slate-500">({item.sub})</span>}
              </div>
              <span className="text-[13px] font-semibold text-slate-900 dark:text-white">{item.value}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
