"use client";

import { useState, useEffect, useCallback } from "react";
import { adminApi, type UserSummary } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getUsers();
      setUsers(data);
    } catch (error: unknown) {
      const apiError = error as { message?: string };
      toast.error("Failed to load users", {
        description: apiError.message || "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search) ||
      u.id.toString().includes(search)
  );

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200/50",
      SUSPENDED: "bg-red-50 text-red-700 ring-red-200/50",
      PENDING: "bg-amber-50 text-amber-700 ring-amber-200/50",
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ring-1 ${map[status] || "bg-slate-50 text-slate-600 ring-slate-200/50"}`}>
        {status}
      </span>
    );
  };

  const getTierBadge = (tier: string) => {
    const isPremium = tier === "PREMIUM";
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ring-1 ${
        isPremium
          ? "bg-amber-50 text-amber-700 ring-amber-200/50"
          : "bg-slate-50 text-slate-500 ring-slate-200/50"
      }`}>
        {tier}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-7 w-48 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-4 w-64 bg-slate-100 rounded-lg animate-pulse mt-2" />
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="h-10 bg-slate-100 rounded-xl animate-pulse max-w-sm" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-5 py-4 border-b border-slate-50 flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl bg-slate-100 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 bg-slate-100 rounded animate-pulse" />
                <div className="h-3 w-32 bg-slate-50 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Users</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">Manage all registered users</p>
        </div>
        <button
          onClick={fetchUsers}
          className="h-9 px-4 rounded-xl border border-slate-200 bg-white text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="relative max-w-sm">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Search by email, phone, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-transparent text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-200 focus:ring-2 focus:ring-blue-600/10 transition-all"
            />
          </div>
        </div>

        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-6">
          <p className="text-[12px] text-slate-500">
            <span className="font-semibold text-slate-900">{filtered.length}</span> user{filtered.length !== 1 ? "s" : ""}
          </p>
          <p className="text-[12px] text-slate-500">
            <span className="font-semibold text-emerald-600">{users.filter(u => u.status === "ACTIVE").length}</span> active
          </p>
          <p className="text-[12px] text-slate-500">
            <span className="font-semibold text-amber-600">{users.filter(u => u.tier === "PREMIUM").length}</span> premium
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            </div>
            <h3 className="text-[15px] font-semibold text-slate-900 mb-1">No users found</h3>
            <p className="text-[13px] text-slate-400">Try adjusting your search query</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">User</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Phone</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tier</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-[12px] font-bold text-white shrink-0">
                          {user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-slate-900">{user.email}</p>
                          <p className="text-[11px] text-slate-400">ID: {user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[13px] text-slate-600 font-mono">{user.phone}</p>
                        {user.phoneVerified && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">{getStatusBadge(user.status)}</td>
                    <td className="px-5 py-3.5">{getTierBadge(user.tier)}</td>
                    <td className="px-5 py-3.5">
                      <p className="text-[12px] text-slate-500">{formatDate(user.createdAt)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
