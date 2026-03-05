"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/logo";
import ChatWidget from "@/components/chat/ChatWidget";
import { userApi, authApi } from "@/lib/api";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

interface NavGroup {
  label: string;
  icon: React.ReactNode;
  items: NavItem[];
}

const homeNav: NavItem = {
  label: "Home",
  href: "/dashboard",
  icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
};

const navGroups: NavGroup[] = [
  {
    label: "Money",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
        <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
        <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
      </svg>
    ),
    items: [
      {
        label: "Wallet",
        href: "/dashboard/wallet",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
          </svg>
        ),
      },
      {
        label: "Top Up",
        href: "/dashboard/topup",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M2 12h20" />
          </svg>
        ),
      },
      {
        label: "Send Money",
        href: "/dashboard/transfer",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Payouts",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
    items: [
      {
        label: "Payout",
        href: "/dashboard/payout",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Transactions",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    items: [
      {
        label: "History",
        href: "/dashboard/history",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        ),
      },
    ],
  },
];

const adminGroup: NavGroup = {
  label: "Admin",
  icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  items: [
    {
      label: "Users",
      href: "/dashboard/admin/users",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      label: "Wallets",
      href: "/dashboard/admin/wallets",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      ),
    },
  ],
};

const bottomNav: NavItem[] = [
  {
    label: "Premium",
    href: "/dashboard/premium",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    badge: "PRO",
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

function DarkModeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  const isDark = theme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={collapsed ? (isDark ? "Light mode" : "Dark mode") : undefined}
      className={cn(
        "flex items-center rounded-lg text-[13px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all",
        collapsed ? "justify-center w-10 h-10 mx-auto" : "w-full gap-3 px-3 py-2"
      )}
    >
      {isDark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 shrink-0">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 shrink-0">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
      {!collapsed && "Dark Mode"}
      {!collapsed && (
        <div className={cn(
          "ml-auto w-9 h-5 rounded-full p-0.5 transition-colors",
          isDark ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-600"
        )}>
          <div className={cn(
            "w-4 h-4 rounded-full bg-white shadow-sm transition-transform",
            isDark ? "translate-x-4" : "translate-x-0"
          )} />
        </div>
      )}
    </button>
  );
}

function CollapsibleGroup({
  group,
  pathname,
  onLinkClick,
  collapsed,
}: {
  group: NavGroup;
  pathname: string;
  onLinkClick: () => void;
  collapsed: boolean;
}) {
  const hasActiveChild = group.items.some((i) =>
    i.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(i.href)
  );
  const [open, setOpen] = useState(hasActiveChild);

  useEffect(() => {
    if (hasActiveChild) setOpen(true);
  }, [hasActiveChild]);

  if (collapsed) {
    return (
      <div className="space-y-0.5">
        {group.items.map((item) => {
          const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              title={item.label}
              className={cn(
                "flex items-center justify-center w-10 h-10 mx-auto rounded-lg transition-all duration-150",
                active
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50"
              )}
            >
              <span className={cn("shrink-0", active ? "text-white" : "")}>
                {item.icon}
              </span>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-[9px] rounded-lg text-[13px] font-medium transition-all duration-150 group",
          hasActiveChild
            ? "text-slate-900 dark:text-white"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50"
        )}
      >
        <span className={cn("shrink-0 transition-colors", hasActiveChild ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-300")}>
          {group.icon}
        </span>
        {group.label}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            "ml-auto text-slate-400 dark:text-slate-500 transition-transform duration-200",
            open ? "rotate-180" : ""
          )}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="ml-4 pl-3 border-l border-slate-200 dark:border-slate-700/50 space-y-0.5 py-1">
          {group.items.map((item) => {
            const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onLinkClick}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[12.5px] font-medium transition-all duration-150 group/item",
                  active
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50"
                )}
              >
                <span className={cn("shrink-0 transition-colors", active ? "text-white" : "text-slate-400 dark:text-slate-500 group-hover/item:text-slate-500")}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userTier, setUserTier] = useState("");
  const [userAvatar, setUserAvatar] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      router.push("/login");
      return;
    }
    setUserEmail(localStorage.getItem("userEmail") || "");
    setCollapsed(localStorage.getItem("sidebarCollapsed") === "true");
    setReady(true);

    userApi.getMe()
      .then((profile) => {
        setUserTier(profile.tier || "FREE");
        if (profile.email) {
          setUserEmail(profile.email);
          localStorage.setItem("userEmail", profile.email);
        }
        if (profile.avatarEmoji) setUserAvatar(profile.avatarEmoji);
        if (profile.fullName) setUserName(profile.fullName);
      })
      .catch(() => {});
  }, [router]);

  const handleLogout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await authApi.logout({ refreshToken });
      }
    } catch {
      // ignore
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userEmail");
      router.push("/login");
    }
  }, [router]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebarCollapsed", String(next));
      return next;
    });
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fb] dark:bg-[#0b0f1a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center animate-pulse">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  const initials = userEmail ? userEmail[0].toUpperCase() : "U";
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  const closeSidebar = () => setSidebarOpen(false);

  const sidebarWidth = collapsed ? 72 : 252;

  return (
    <div className="min-h-screen bg-[#f8f9fb] dark:bg-[#0b0f1a] transition-colors duration-300">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={closeSidebar}
        />
      )}

      <motion.aside
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          "fixed top-0 left-0 z-50 h-full bg-white dark:bg-[#111827] border-r border-slate-200/80 dark:border-slate-700/50 lg:translate-x-0 flex flex-col overflow-hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-[60px] flex items-center px-5 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <LogoIcon size={32} />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-[16px] font-bold text-slate-900 dark:text-white tracking-tight whitespace-nowrap overflow-hidden"
                >
                  NeoBank
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
          <button
            onClick={toggleCollapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden lg:flex ml-auto p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("transition-transform", collapsed ? "rotate-180" : "")}>
              <path d="M11 19l-7-7 7-7" />
              <path d="M18 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={closeSidebar}
            className="lg:hidden ml-auto p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          <div className="mb-1">
            <Link
              href={homeNav.href}
              onClick={closeSidebar}
              title={collapsed ? homeNav.label : undefined}
              className={cn(
                "flex items-center rounded-lg text-[13px] font-medium transition-all duration-150 group",
                collapsed ? "justify-center w-10 h-10 mx-auto" : "gap-3 px-3 py-[9px]",
                isActive(homeNav.href)
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50"
              )}
            >
              <span className={cn("shrink-0 transition-colors", isActive(homeNav.href) ? "text-white" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-300")}>
                {homeNav.icon}
              </span>
              {!collapsed && homeNav.label}
            </Link>
          </div>

          <div className={cn("my-3 border-t border-slate-100 dark:border-slate-700/50", collapsed ? "mx-1" : "mx-3")} />

          <div className="space-y-0.5">
            {navGroups.map((group) => (
              <CollapsibleGroup
                key={group.label}
                group={group}
                pathname={pathname}
                onLinkClick={closeSidebar}
                collapsed={collapsed}
              />
            ))}
          </div>

          {userTier === "ADMIN" && (
            <>
              <div className={cn("my-3 border-t border-slate-100 dark:border-slate-700/50", collapsed ? "mx-1" : "mx-3")} />
              <CollapsibleGroup group={adminGroup} pathname={pathname} onLinkClick={closeSidebar} collapsed={collapsed} />
            </>
          )}

          <div className={cn("my-3 border-t border-slate-100 dark:border-slate-700/50", collapsed ? "mx-1" : "mx-3")} />

          <div className="space-y-0.5">
            {bottomNav.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeSidebar}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center rounded-lg text-[13px] font-medium transition-all duration-150 group",
                    collapsed ? "justify-center w-10 h-10 mx-auto" : "gap-3 px-3 py-[9px]",
                    active
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  )}
                >
                  <span className={cn("shrink-0 transition-colors", active ? "text-white" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-300")}>
                    {item.icon}
                  </span>
                  {!collapsed && item.label}
                  {!collapsed && item.badge && (
                    <span className={cn(
                      "ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded",
                      active ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    )}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            <button
              onClick={handleLogout}
              title={collapsed ? "Sign out" : undefined}
              className={cn(
                "w-full flex items-center rounded-lg text-[13px] font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-150 group",
                collapsed ? "justify-center w-10 h-10 mx-auto" : "gap-3 px-3 py-[9px]"
              )}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 dark:text-slate-500 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors shrink-0">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              {!collapsed && "Sign out"}
            </button>
          </div>
        </nav>

        <div className={cn("border-t border-slate-100 dark:border-slate-700/50 shrink-0", collapsed ? "p-2 space-y-1" : "p-3 space-y-2")}>
          <DarkModeToggle collapsed={collapsed} />

          <div className={cn(
            "flex items-center rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-default",
            collapsed ? "justify-center p-1" : "gap-3 p-2"
          )}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-[16px] font-bold text-white shrink-0 ring-2 ring-white dark:ring-slate-800 shadow-sm">
              {userAvatar || initials}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-slate-900 dark:text-white truncate">
                  {userName || userEmail || "User"}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">{userTier === "PREMIUM" || userTier === "ADMIN" ? "Premium" : "Free plan"}</p>
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      <motion.div
        animate={{ paddingLeft: sidebarWidth }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className="max-lg:!pl-0"
      >
        <header className="sticky top-0 z-30 h-[60px] bg-white/80 dark:bg-[#111827]/80 backdrop-blur-lg border-b border-slate-200/80 dark:border-slate-700/50 transition-colors duration-300">
          <div className="h-full px-4 lg:px-6 flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            </button>

            <div className="hidden md:flex flex-1 max-w-sm">
              <div className="relative w-full group">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  type="text"
                  placeholder="Search transactions, users..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-transparent text-[13px] text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-blue-200 dark:focus:border-blue-700 focus:ring-2 focus:ring-blue-600/10 transition-all"
                />
                <kbd className="hidden lg:inline-flex absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded">
                  /
                </kbd>
              </div>
            </div>

            <div className="flex-1 md:hidden" />

            <div className="flex items-center gap-1">
              <button className="relative p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-[#111827]" />
              </button>

              <div className="hidden md:block w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2" />

              <Link href="/dashboard/settings" className="hidden md:flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-[16px] font-bold text-white ring-2 ring-white dark:ring-slate-800 shadow-sm">
                  {userAvatar || initials}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-slate-900 dark:text-white truncate leading-tight">
                    {userName || userEmail?.split("@")[0] || "User"}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                    {userTier === "PREMIUM" || userTier === "ADMIN" ? "Premium" : "Free plan"}
                  </p>
                </div>
              </Link>

              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-[14px] font-bold text-white ring-2 ring-white shadow-sm cursor-pointer md:hidden">
                {userAvatar || initials}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6 min-h-[calc(100vh-60px)]">
          {children}
        </main>
      </motion.div>

      {(userTier === "PREMIUM" || userTier === "ADMIN") && <ChatWidget />}
    </div>
  );
}
