"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api";
import { toast } from "sonner";
import { LogoIcon } from "@/components/logo";

const OTP_LENGTH = 6;

export default function VerifyOtpPage() {
  const router = useRouter();
  const { setTheme } = useTheme();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear() - 18);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTheme("light");
  }, [setTheme]);

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

  useEffect(() => {
    if (!calendarOpen) return;
    const handler = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [calendarOpen]);

  const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const firstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const handleDateSelect = (day: number) => {
    const m = String(calendarMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    setDateOfBirth(`${calendarYear}-${m}-${d}`);
    setCalendarOpen(false);
  };

  const formatDisplayDate = (iso: string) => {
    if (!iso) return "";
    const dt = new Date(iso + "T00:00:00");
    return dt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  };

  const minAge = 18;
  const maxDateForAge = new Date(new Date().getFullYear() - minAge, new Date().getMonth(), new Date().getDate());

  const handleRequestOtp = async () => {
    if (!fullName || fullName.trim().length < 2) {
      toast.error("Enter your full name");
      return;
    }
    if (dateOfBirth) {
      const dob = new Date(dateOfBirth + "T00:00:00");
      if (dob > maxDateForAge) {
        toast.error("You must be at least 18 years old");
        return;
      }
    }
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
      const res = await authApi.verifyOtp({
        email,
        phone,
        otp: code,
        fullName: fullName.trim() || undefined,
        dateOfBirth: dateOfBirth || undefined,
      });
      localStorage.setItem("accessToken", res.accessToken);
      localStorage.setItem("refreshToken", res.refreshToken);
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
              {["Complete Profile", "Verify Identity", "Start Banking"].map((pill) => (
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

      <div className="w-full lg:w-[40%] flex items-center justify-center bg-white dark:bg-slate-950 px-6 py-12 sm:px-12 lg:px-14">
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
              <span className={`text-xs font-medium ${step === "otp" ? "text-emerald-600" : "text-blue-600"}`}>Profile</span>
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
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Complete your profile</h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Tell us a bit about yourself and link your phone number.
              </p>

              <div className="mt-6 space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-sm font-medium text-slate-700 dark:text-slate-300">Full name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Devansh Jha"
                    autoComplete="name"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="dob" className="text-sm font-medium text-slate-700 dark:text-slate-300">Date of birth</Label>
                  <div className="relative" ref={calendarRef}>
                    <button
                      type="button"
                      onClick={() => setCalendarOpen(!calendarOpen)}
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-left text-sm flex items-center justify-between hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
                    >
                      <span className={dateOfBirth ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"}>
                        {dateOfBirth ? formatDisplayDate(dateOfBirth) : "Select your date of birth"}
                      </span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 shrink-0">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </button>
                    {calendarOpen && (
                      <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none p-4 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="flex items-center justify-between mb-4">
                          <button
                            type="button"
                            onClick={() => { if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(y => y - 1); } else setCalendarMonth(m => m - 1); }}
                            className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                          </button>
                          <div className="flex items-center gap-2">
                            <select
                              value={calendarMonth}
                              onChange={(e) => setCalendarMonth(Number(e.target.value))}
                              className="text-sm font-semibold text-slate-900 dark:text-white bg-transparent border-none focus:outline-none cursor-pointer appearance-none pr-1"
                            >
                              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                            </select>
                            <select
                              value={calendarYear}
                              onChange={(e) => setCalendarYear(Number(e.target.value))}
                              className="text-sm font-semibold text-slate-900 dark:text-white bg-transparent border-none focus:outline-none cursor-pointer appearance-none"
                            >
                              {Array.from({ length: 80 }, (_, i) => new Date().getFullYear() - minAge - i).map(y => (
                                <option key={y} value={y}>{y}</option>
                              ))}
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => { if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(y => y + 1); } else setCalendarMonth(m => m + 1); }}
                            className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                          </button>
                        </div>
                        <div className="grid grid-cols-7 gap-0.5 text-center mb-2">
                          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                            <div key={d} className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 py-1">{d}</div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-0.5 text-center">
                          {Array.from({ length: firstDayOfMonth(calendarYear, calendarMonth) }).map((_, i) => (
                            <div key={`e-${i}`} />
                          ))}
                          {Array.from({ length: daysInMonth(calendarYear, calendarMonth) }, (_, i) => i + 1).map(day => {
                            const iso = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                            const selected = dateOfBirth === iso;
                            const dayDate = new Date(calendarYear, calendarMonth, day);
                            const tooYoung = dayDate > maxDateForAge;
                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => !tooYoung && handleDateSelect(day)}
                                disabled={tooYoung}
                                className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                                  tooYoung
                                    ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                                    : selected
                                      ? "bg-blue-600 text-white shadow-sm"
                                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                                }`}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone number</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center justify-center h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-sm text-slate-600 dark:text-slate-300 select-none">
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
                  disabled={isLoading || phone.length < 10 || fullName.trim().length < 2}
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

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-lg p-3 flex items-start gap-3">
                  <svg className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <div>
                    <p className="text-xs font-medium text-blue-800 dark:text-blue-300">Verification via email</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                      A 6-digit code will be sent to <span className="font-semibold">{email}</span> to verify your identity.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Verify your identity</h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Enter the 6-digit code sent to <span className="font-medium text-slate-700 dark:text-slate-200">{email}</span>
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
                      className="w-12 h-14 text-center text-xl font-semibold rounded-lg border-2 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all disabled:opacity-50"
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

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
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
