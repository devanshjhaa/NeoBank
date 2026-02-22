"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api";
import { toast } from "sonner";
import { LogoIcon } from "@/components/logo";

const OTP_LENGTH = 6;

export default function VerifyOtpPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("pendingEmail");
    if (!stored) {
      router.replace("/signup");
      return;
    }
    setEmail(stored);
  }, [router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const handleRequestOtp = async () => {
    if (!phone || phone.length < 10) {
      toast.error("Enter a valid 10-digit phone number");
      return;
    }
    setIsLoading(true);
    try {
      await authApi.requestOtp({ email, phone });
      toast.success("Verification code sent!", {
        description: `Check ${email} for the 6-digit code`,
      });
      setStep("otp");
      setCooldown(30);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      toast.error("Failed to send code", {
        description: apiErr.message || "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length !== OTP_LENGTH) {
      toast.error("Enter the complete 6-digit code");
      return;
    }
    setIsLoading(true);
    try {
      const res = await authApi.verifyOtp({ email, phone, otp: code });
      localStorage.setItem("accessToken", res.accessToken);
      localStorage.removeItem("pendingEmail");
      toast.success("Account verified!");
      router.push("/dashboard");
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      toast.error("Verification failed", {
        description: apiErr.message || "Invalid or expired code.",
      });
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!text) return;
    const next = Array(OTP_LENGTH).fill("");
    text.split("").forEach((ch, i) => (next[i] = ch));
    setOtp(next);
    const focusIdx = Math.min(text.length, OTP_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setIsLoading(true);
    try {
      await authApi.requestOtp({ email, phone });
      setCooldown(30);
      toast.success("Code resent!");
    } catch {
      toast.error("Failed to resend code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[60%] relative overflow-hidden">
        <img
          src="/images/verify-hero.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.88) 100%)",
          }}
        />

        <div className="relative z-10 flex flex-col justify-between w-full p-10 xl:p-14 h-full">
          <Link href="/" className="flex items-center gap-2.5 w-fit">
            <LogoIcon size={36} />
            <span className="text-white font-bold text-xl tracking-tight drop-shadow-md">NeoBank</span>
          </Link>

          <div className="flex-1" />

          <div>
            <h2 className="text-[28px] xl:text-[34px] font-bold text-white leading-[1.2] max-w-[500px] drop-shadow-lg">
              Almost There. Complete Your{" "}
              <span className="text-emerald-400">Verification</span> to Unlock
              Your Wallet
            </h2>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
              {["Link Phone", "Verify Email", "Start Banking"].map((pill) => (
                <span
                  key={pill}
                  className="inline-flex items-center gap-2 text-[13px] font-medium text-white/90"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" className="text-emerald-400" />
                    <polyline points="8 12 11 15 16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400" />
                  </svg>
                  {pill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[40%] flex items-center justify-center bg-white px-6 py-12 sm:px-12 lg:px-14">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden mb-8">
            <Link href="/" className="flex items-center gap-2">
              <LogoIcon size={36} />
              <span className="font-bold text-xl text-slate-900">NeoBank</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 mb-8">
            <div className="flex items-center gap-1.5">
              <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 grid place-items-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className="text-xs font-medium text-emerald-600">Account</span>
            </div>
            <div className="h-px w-6 bg-slate-200" />
            <div className="flex items-center gap-1.5">
              {step === "otp" ? (
                <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 grid place-items-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              ) : (
                <div className="h-6 w-6 rounded-full bg-blue-600 text-white grid place-items-center text-xs font-bold">2</div>
              )}
              <span className={`text-xs font-medium ${step === "otp" ? "text-emerald-600" : "text-blue-600"}`}>Phone</span>
            </div>
            <div className="h-px w-6 bg-slate-200" />
            <div className="flex items-center gap-1.5">
              <div className={`h-6 w-6 rounded-full grid place-items-center text-xs font-bold ${step === "otp" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                3
              </div>
              <span className={`text-xs font-medium ${step === "otp" ? "text-blue-600" : "text-slate-400"}`}>Verify</span>
            </div>
          </div>

          {step === "phone" ? (
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Link your phone number</h1>
              <p className="mt-2 text-sm text-slate-500">
                This number will be linked to your wallet for transactions and payouts.
              </p>

              <div className="mt-6 space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-sm font-medium text-slate-700">Phone number</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center justify-center h-10 px-3 rounded-lg border border-slate-300 bg-slate-50 text-sm text-slate-600 select-none">
                      +91
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="9876543210"
                      autoComplete="tel"
                      disabled={isLoading}
                      className="flex-1"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleRequestOtp}
                  disabled={isLoading || phone.length < 10}
                  className="w-full h-11"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647Z" />
                      </svg>
                      Sending code...
                    </span>
                  ) : (
                    "Continue"
                  )}
                </Button>

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-3">
                  <svg className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <div>
                    <p className="text-xs font-medium text-blue-800">Verification via email</p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      A 6-digit code will be sent to <span className="font-semibold">{email}</span> to verify your identity.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Verify your identity</h1>
              <p className="mt-2 text-sm text-slate-500">
                Enter the 6-digit code sent to <span className="font-medium text-slate-700">{email}</span>
              </p>

              <div className="mt-6 space-y-6">
                <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { inputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      disabled={isLoading}
                      className="w-12 h-14 text-center text-xl font-semibold rounded-lg border-2 border-slate-200 text-slate-900 bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all disabled:opacity-50"
                    />
                  ))}
                </div>

                <Button
                  onClick={handleVerifyOtp}
                  disabled={isLoading || otp.join("").length !== OTP_LENGTH}
                  className="w-full h-11"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647Z" />
                      </svg>
                      Verifying...
                    </span>
                  ) : (
                    "Verify & activate wallet"
                  )}
                </Button>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => { setStep("phone"); setOtp(Array(OTP_LENGTH).fill("")); }}
                    className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={cooldown > 0 || isLoading}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Already verified?{" "}
              <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
