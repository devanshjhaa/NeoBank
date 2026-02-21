"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api";
import { toast } from "sonner";

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
      toast.error("Enter a valid phone number");
      return;
    }
    setIsLoading(true);
    try {
      await authApi.requestOtp({ email, phone });
      toast.success("OTP sent!", {
        description: `We sent a 6-digit code to ${email}`,
      });
      setStep("otp");
      setCooldown(30);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      toast.error("Failed to send OTP", {
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
      toast.success("Phone verified!");
      router.push("/dashboard");
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      toast.error("Verification failed", {
        description: apiErr.message || "Invalid or expired OTP.",
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
      toast.success("OTP resent!");
    } catch {
      toast.error("Failed to resend OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[55%] relative bg-[#0f172a] overflow-hidden">
        <div className="absolute top-20 left-10 w-[400px] h-[400px] bg-blue-600/25 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 right-10 w-[350px] h-[350px] bg-indigo-600/20 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/3 w-[200px] h-[200px] bg-blue-400/10 rounded-full blur-[80px]" />

        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative z-10 flex flex-col justify-between w-full p-10 xl:p-14">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-blue-600 grid place-items-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
              </svg>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">NeoBank</span>
          </Link>

          <div className="max-w-md">
            <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight">
              One last step to
              <br />
              secure your{" "}
              <span className="text-blue-400">wallet</span>
            </h2>
            <p className="mt-5 text-slate-400 text-base leading-relaxed">
              We&apos;ll send a verification code to your email to confirm your phone number.
              Your wallet will be activated instantly after verification.
            </p>

            <div className="mt-8 flex flex-col gap-4">
              {[
                { num: "1", label: "Create account", done: true },
                { num: "2", label: "Verify phone number", done: false },
                { num: "3", label: "Start transacting", done: false },
              ].map((item) => (
                <div key={item.num} className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full grid place-items-center shrink-0 text-sm font-bold ${
                    item.done
                      ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                      : "bg-white/5 border border-white/10 text-slate-400"
                  }`}>
                    {item.done ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      item.num
                    )}
                  </div>
                  <p className={`text-sm font-medium ${item.done ? "text-emerald-400" : "text-slate-300"}`}>
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-600/20 border border-blue-500/30 grid place-items-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white">End-to-end encrypted</p>
                <p className="text-xs text-slate-500">Your OTP is secured with 256-bit encryption</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[45%] flex items-center justify-center bg-white px-6 py-12 sm:px-12">
        <div className="w-full max-w-[440px]">
          <div className="lg:hidden mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-blue-600 grid place-items-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
                </svg>
              </div>
              <span className="font-bold text-xl text-slate-900">NeoBank</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center gap-1.5">
              <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 grid place-items-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className="text-xs font-medium text-emerald-600">Account</span>
            </div>
            <div className="h-px w-8 bg-slate-200" />
            <div className="flex items-center gap-1.5">
              <div className="h-6 w-6 rounded-full bg-blue-600 text-white grid place-items-center text-xs font-bold">
                2
              </div>
              <span className="text-xs font-medium text-blue-600">Verify</span>
            </div>
            <div className="h-px w-8 bg-slate-200" />
            <div className="flex items-center gap-1.5">
              <div className="h-6 w-6 rounded-full bg-slate-100 text-slate-400 grid place-items-center text-xs font-bold">
                3
              </div>
              <span className="text-xs font-medium text-slate-400">Done</span>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">
              {step === "phone" ? "Link your phone number" : "Check your email"}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {step === "phone"
                ? "Enter your phone number to link it to your account. We'll send a verification code to your email."
                : `We sent a 6-digit code to ${email}`}
            </p>
          </div>

          {step === "phone" ? (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                  Phone number
                </Label>
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
                    Sending...
                  </span>
                ) : (
                  "Send code to my email"
                )}
              </Button>

              <p className="text-xs text-slate-400 text-center">
                A 6-digit code will be sent to <span className="font-medium text-slate-500">{email}</span>
              </p>
            </div>
          ) : (
            <div className="space-y-6">
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
                  "Verify & continue"
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || isLoading}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
                </button>
              </div>

              <button
                type="button"
                onClick={() => { setStep("phone"); setOtp(Array(OTP_LENGTH).fill("")); }}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mx-auto"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Change phone number
              </button>
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
