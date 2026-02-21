"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { premiumApi } from "@/lib/api";
import { toast } from "sonner";

const benefits = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    title: "Zero Transfer Fees",
    description: "Send money to anyone without paying fees on any transfer",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
        <polyline points="17 6 23 6 23 12"/>
      </svg>
    ),
    title: "Higher Limits",
    description: "Enjoy increased transaction and payout limits",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    title: "Priority Support",
    description: "Get faster responses from our dedicated support team",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    title: "Exclusive Rewards",
    description: "Earn more cashback and access special promotions",
  },
];

const features = [
  "Zero fees on all transfers",
  "Higher transaction limits (up to ₹5,00,000)",
  "Priority customer support",
  "Early access to new features",
  "Premium badge on your profile",
  "Exclusive cashback rewards",
];

export default function PremiumPage() {
  const router = useRouter();
  const [isUpgrading, setIsUpgrading] = useState(false);

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

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          Premium
        </div>
        <h1 className="text-3xl font-bold text-slate-900 font-[family-name:var(--font-gabarito)]">
          Upgrade to Premium
        </h1>
        <p className="text-slate-500 mt-2">
          Unlock exclusive features and enjoy zero fees on all transactions
        </p>
      </div>

      <Card className="max-w-lg mx-auto border-blue-200">
        <CardContent className="p-8 space-y-6">
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-bold text-slate-900">₹299</span>
              <span className="text-slate-400">/one-time</span>
            </div>
            <p className="text-slate-500 mt-2">Lifetime premium access</p>
          </div>

          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-3 text-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span className="text-slate-600">{feature}</span>
              </li>
            ))}
          </ul>

          <Button
            className="w-full h-12"
            onClick={handleUpgrade}
            disabled={isUpgrading}
            loading={isUpgrading}
          >
            Upgrade Now
          </Button>
        </CardContent>
      </Card>

      <div className="max-w-3xl mx-auto">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 text-center">
          What You&apos;ll Get
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {benefits.map((benefit, index) => (
            <Card key={index}>
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600">
                  {benefit.icon}
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">{benefit.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{benefit.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
