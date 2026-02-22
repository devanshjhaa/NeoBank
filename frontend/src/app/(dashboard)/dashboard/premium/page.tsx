"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { premiumApi, userApi } from "@/lib/api";
import { toast } from "sonner";

const benefits = [
  {
    icon: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
    title: "Zero Transfer Fees",
    description: "Send money to anyone without paying fees on any transfer",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: "M23 6L13.5 15.5 8.5 10.5 1 18M17 6h6v6",
    title: "Higher Limits",
    description: "Enjoy increased transaction and payout limits",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
    title: "Priority Support",
    description: "Get faster responses from our dedicated support team",
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    icon: "M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27l6.91-1.01L12 2z",
    title: "Exclusive Rewards",
    description: "Earn more cashback and access special promotions",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
];

const features = [
  "Zero fees on all transfers",
  "Higher transaction limits (up to \u20B95,00,000)",
  "Priority customer support",
  "Early access to new features",
  "Premium badge on your profile",
  "Exclusive cashback rewards",
];

export default function PremiumPage() {
  const router = useRouter();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [alreadyPremium, setAlreadyPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userApi.getMe()
      .then((profile) => {
        if (profile.tier === "PREMIUM" || profile.tier === "ADMIN") {
          setAlreadyPremium(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      await premiumApi.upgrade();

      toast.success("Welcome to Premium!", {
        description: "Your account has been upgraded to premium.",
      });

      router.push("/dashboard");
    } catch (error: unknown) {
      const apiError = error as { message?: string };
      toast.error("Upgrade failed", {
        description: apiError.message || "Please try again later.",
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin h-6 w-6 text-blue-600" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (alreadyPremium) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto shadow-lg shadow-amber-200/50 dark:shadow-amber-900/50">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>
        <h1 className="text-[22px] font-bold text-slate-900 dark:text-white tracking-tight">You&apos;re Already Premium</h1>
        <p className="text-[14px] text-slate-500 dark:text-slate-400">
          You have lifetime premium access with all exclusive features unlocked.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-4 h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-semibold transition-all shadow-sm shadow-blue-600/20"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 ring-1 ring-amber-200/50 dark:ring-amber-700/50 text-amber-700 dark:text-amber-400 text-[12px] font-semibold mb-4">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          Premium
        </div>
        <h1 className="text-[26px] font-bold text-slate-900 dark:text-white tracking-tight">Upgrade to Premium</h1>
        <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-1.5 max-w-md mx-auto">
          Unlock exclusive features and enjoy zero fees on all transactions
        </p>
      </div>

      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-700/50 overflow-hidden shadow-sm shadow-slate-200/40 dark:shadow-black/20 max-w-md mx-auto">
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-8 text-center">
          <div className="flex items-baseline justify-center gap-1.5">
            <span className="text-5xl font-bold text-white tracking-tight">{"\u20B9"}299</span>
            <span className="text-blue-200 text-[14px] font-medium">/one-time</span>
          </div>
          <p className="text-blue-100 text-[13px] mt-2">Lifetime premium access {"\u2014"} pay once, enjoy forever</p>
        </div>

        <div className="p-6 space-y-6">
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="text-[13px] text-slate-600 dark:text-slate-300">{feature}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={handleUpgrade}
            disabled={isUpgrading}
            className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-semibold transition-all shadow-sm shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isUpgrading && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            Upgrade to Premium
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white mb-4 text-center tracking-tight">
          What You&apos;ll Get
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="group bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-5 flex items-start gap-4 hover:shadow-md hover:shadow-slate-200/60 dark:hover:shadow-black/20 transition-all"
            >
              <div className={`w-11 h-11 rounded-xl ${benefit.bg} flex items-center justify-center shrink-0 ${benefit.color} group-hover:scale-110 transition-transform`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={benefit.icon} />
                </svg>
              </div>
              <div>
                <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">{benefit.title}</h3>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
