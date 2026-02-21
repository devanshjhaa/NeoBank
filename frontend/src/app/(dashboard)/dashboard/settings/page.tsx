"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail") || "";
    setEmail(storedEmail);
  }, []);

  const initials = email ? email.charAt(0).toUpperCase() : "U";

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("pendingEmail");
    router.push("/login");
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(email);
    toast.success("Email copied to clipboard");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">Manage your account settings and preferences</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-[13px] font-semibold text-slate-900">Profile</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Your account information</p>
        </div>
        <div className="p-5 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-xl font-bold text-white shadow-sm shadow-blue-600/20">
              {initials}
            </div>
            <div>
              <p className="text-[14px] font-semibold text-slate-900">{email || "No email"}</p>
              <p className="text-[12px] text-slate-400 mt-0.5">NeoBank Member</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-[13px] font-medium text-slate-700">Email</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="rounded-xl bg-slate-50 border-slate-200"
              />
              <button
                onClick={handleCopyEmail}
                className="px-4 h-10 rounded-xl border border-slate-200 bg-white text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
              >
                Copy
              </button>
            </div>
            <p className="text-[11px] text-slate-400">Email is set during registration and cannot be changed</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-[13px] font-semibold text-slate-900">Security</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Manage your security settings</p>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 ring-1 ring-slate-100">
            <div>
              <p className="text-[13px] font-semibold text-slate-900">Password</p>
              <p className="text-[12px] text-slate-400 mt-0.5">Last changed: Never</p>
            </div>
            <button
              disabled
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-[12px] font-semibold text-slate-400 cursor-not-allowed"
            >
              Change Password
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 ring-1 ring-slate-100">
            <div>
              <p className="text-[13px] font-semibold text-slate-900">Phone Verification</p>
              <p className="text-[12px] text-slate-400 mt-0.5">Verified via OTP during signup</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold ring-1 ring-emerald-200/50">
              Verified
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-[13px] font-semibold text-slate-900">Appearance</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Customize the look and feel</p>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 ring-1 ring-slate-100">
            <div>
              <p className="text-[13px] font-semibold text-slate-900">Theme</p>
              <p className="text-[12px] text-slate-400 mt-0.5">Choose your preferred theme</p>
            </div>
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-xl border-2 border-blue-600 bg-white flex items-center justify-center shadow-sm shadow-blue-600/10">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              </button>
              <button className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-900 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-red-200/80 overflow-hidden">
        <div className="px-5 py-4 border-b border-red-100">
          <h2 className="text-[13px] font-semibold text-red-600">Danger Zone</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Irreversible actions</p>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between p-4 rounded-xl bg-red-50/60 ring-1 ring-red-100">
            <div>
              <p className="text-[13px] font-semibold text-slate-900">Sign Out</p>
              <p className="text-[12px] text-slate-400 mt-0.5">Sign out of your account on this device</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl border border-red-200 bg-white text-[12px] font-semibold text-red-600 hover:bg-red-50 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
