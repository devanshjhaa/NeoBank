"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { userApi } from "@/lib/api";
import type { UserProfileResponse } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-[52px] h-7 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />;

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`relative w-[52px] h-7 rounded-full transition-colors duration-300 ${isDark ? "bg-blue-600" : "bg-slate-300"}`}
      aria-label="Toggle theme"
    >
      <motion.div
        className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center"
        animate={{ x: isDark ? 24 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        <AnimatePresence mode="wait">
          {isDark ? (
            <motion.svg
              key="moon"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </motion.svg>
          ) : (
            <motion.svg
              key="sun"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.div>
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await userApi.getMe();
        setProfile(data);
      } catch {
        /* fallback */
      }
      setIsLoading(false);
    };
    fetchProfile();
  }, []);

  const email = profile?.email || localStorage.getItem("userEmail") || "";
  const phone = profile?.phone || "";
  const phoneVerified = profile?.phoneVerified ?? false;
  const tier = profile?.tier || "FREE";
  const authProvider = profile?.authProvider || "EMAIL";
  const avatarEmoji = profile?.avatarEmoji || "";
  const fullName = profile?.fullName || "";
  const dateOfBirth = profile?.dateOfBirth || "";
  const initials = avatarEmoji || (email ? email.charAt(0).toUpperCase() : "U");

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

  const handleDeleteAccount = async () => {
    if (deleteText !== "DELETE") return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api/v1"}/users/me`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("pendingEmail");
      toast.success("Account deleted successfully");
      router.push("/login");
    } catch {
      toast.error("Failed to delete account. Please try again.");
    }
    setIsDeleting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 dark:text-white tracking-tight">Settings</h1>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">Manage your account settings and preferences</p>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-100 dark:border-slate-700/50 p-5 h-[180px]" />
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-100 dark:border-slate-700/50 p-5 h-[120px]" />
        </div>
      ) : (
      <>
      <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-slate-700/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50">
          <h2 className="text-[13px] font-semibold text-slate-900 dark:text-white">Profile</h2>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Your account information</p>
        </div>
        <div className="p-5 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white shadow-sm shadow-blue-600/20">
              {initials}
            </div>
            <div>
              {fullName && <p className="text-[15px] font-bold text-slate-900 dark:text-white">{fullName}</p>}
              <p className={`text-[13px] ${fullName ? "text-slate-500 dark:text-slate-400" : "font-semibold text-slate-900 dark:text-white"}`}>{email || "No email"}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${tier === "PREMIUM" || tier === "ADMIN" ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200/50 dark:ring-amber-700/50" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 ring-1 ring-slate-200/50 dark:ring-slate-600/50"}`}>
                  {tier}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-semibold ring-1 ring-blue-200/50 dark:ring-blue-700/50">
                  {authProvider === "GOOGLE" ? "Google" : "Email"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Email</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 dark:text-slate-200"
              />
              <button
                onClick={handleCopyEmail}
                className="px-4 h-10 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-[13px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shrink-0"
              >
                Copy
              </button>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">Email is set during registration and cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Full Name</Label>
            <Input
              type="text"
              value={fullName || "Not set"}
              disabled
              className="rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 dark:text-slate-200"
            />
          </div>

          {phone && (
            <div className="space-y-2">
              <Label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Phone</Label>
              <Input
                type="text"
                value={phone}
                disabled
                className="rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 dark:text-slate-200"
              />
            </div>
          )}

          {dateOfBirth && (
            <div className="space-y-2">
              <Label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Date of birth</Label>
              <Input
                type="text"
                value={new Date(dateOfBirth + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                disabled
                className="rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 dark:text-slate-200"
              />
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-slate-700/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50">
          <h2 className="text-[13px] font-semibold text-slate-900 dark:text-white">Security</h2>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Manage your security settings</p>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-100 dark:ring-slate-700/50">
            <div>
              <p className="text-[13px] font-semibold text-slate-900 dark:text-white">Password</p>
              <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-0.5">Last changed: Never</p>
            </div>
            <button
              disabled
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-[12px] font-semibold text-slate-400 dark:text-slate-500 cursor-not-allowed"
            >
              Change Password
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-100 dark:ring-slate-700/50">
            <div>
              <p className="text-[13px] font-semibold text-slate-900 dark:text-white">Phone Verification</p>
              <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-0.5">{phone ? `Phone: ${phone}` : "No phone on file"}</p>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ring-1 ${phoneVerified ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-emerald-200/50 dark:ring-emerald-700/50" : "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 ring-amber-200/50 dark:ring-amber-700/50"}`}>
              {phoneVerified ? "Verified" : "Not verified"}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-slate-700/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50">
          <h2 className="text-[13px] font-semibold text-slate-900 dark:text-white">Appearance</h2>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Customize the look and feel</p>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-100 dark:ring-slate-700/50">
            <div>
              <p className="text-[13px] font-semibold text-slate-900 dark:text-white">Theme</p>
              <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-0.5">Switch between light and dark mode</p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111827] rounded-xl border border-red-200/80 dark:border-red-900/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-red-100 dark:border-red-900/50">
          <h2 className="text-[13px] font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Irreversible actions</p>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl bg-red-50/60 dark:bg-red-950/30 ring-1 ring-red-100 dark:ring-red-900/50">
            <div>
              <p className="text-[13px] font-semibold text-slate-900 dark:text-white">Sign Out</p>
              <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-0.5">Sign out of your account on this device</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl border border-red-200 dark:border-red-800 bg-white dark:bg-slate-800 text-[12px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
            >
              Sign Out
            </button>
          </div>

          <div className="rounded-xl bg-red-50/60 dark:bg-red-950/30 ring-1 ring-red-100 dark:ring-red-900/50 overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-[13px] font-semibold text-slate-900 dark:text-white">Delete Account</p>
                <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-0.5">Permanently delete your account and all data</p>
              </div>
              {!showDeleteConfirm && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 rounded-xl border border-red-200 dark:border-red-800 bg-white dark:bg-slate-800 text-[12px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                >
                  Delete Account
                </button>
              )}
            </div>
            <AnimatePresence>
              {showDeleteConfirm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 pt-0 space-y-3">
                    <div className="p-3 rounded-lg bg-red-100/80 dark:bg-red-900/30 border border-red-200/60 dark:border-red-800/50">
                      <p className="text-[12px] text-red-700 dark:text-red-300 font-medium">
                        This action cannot be undone. All your data including wallet balance, transaction history, and profile will be permanently deleted.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[12px] font-medium text-slate-600 dark:text-slate-400">
                        Type <span className="font-bold text-red-600 dark:text-red-400">DELETE</span> to confirm
                      </Label>
                      <Input
                        value={deleteText}
                        onChange={(e) => setDeleteText(e.target.value)}
                        placeholder="DELETE"
                        className="rounded-xl bg-white dark:bg-slate-800 border-red-200 dark:border-red-800/50 text-[13px] dark:text-slate-200 focus:border-red-400 dark:focus:border-red-600"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setShowDeleteConfirm(false); setDeleteText(""); }}
                        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-[12px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deleteText !== "DELETE" || isDeleting}
                        className="px-4 py-2 rounded-xl bg-red-600 text-[12px] font-semibold text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        {isDeleting ? "Deleting..." : "Permanently Delete"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
