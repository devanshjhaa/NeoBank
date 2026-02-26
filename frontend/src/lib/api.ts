const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/v1";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      return false;
    }

    const data = await res.json();
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  if (res.status === 401 && !isRetry && !endpoint.startsWith("/auth/")) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = tryRefreshToken().finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    }

    const refreshed = await (refreshPromise || tryRefreshToken());
    if (refreshed) {
      return request<T>(endpoint, options, true);
    }

    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userEmail");
      window.location.href = "/login";
    }
  }

  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return {} as T;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data.message || data.error?.message || data.error || `Request failed (${res.status})`;
    throw new ApiError(typeof msg === "string" ? msg : `Request failed (${res.status})`, res.status);
  }

  return data as T;
}

/* ------------------------------------------------------------------ */
/*  Response Shapes (matching backend DTOs)                            */
/* ------------------------------------------------------------------ */

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  newUser?: boolean;
}

export interface WalletResponse {
  walletId: number;
  balance: number;
  currency: string;
  status: string;
}

export interface TransferResponse {
  transactionId: number;
  senderId: number;
  receiverId: number;
  amount: number;
  status: string;
  createdAt: string;
}

export interface TopupResponse {
  topupId: number;
  amount: number;
  status: string;
  gatewayRef: string;
  createdAt: string;
}

export interface PayoutResponse {
  payoutId: number;
  amount: number;
  status: string;
  createdAt: string;
}

export interface BankAccountResponse {
  id: number;
  accountNumber: string;
  maskedAccountNumber: string;
  ifscCode: string;
  holderName: string;
  verified: boolean;
  createdAt: string;
}

export interface UserSummary {
  id: number;
  email: string;
  phone: string;
  phoneVerified: boolean;
  status: string;
  tier: string;
  createdAt: string;
}

export interface WalletSummary {
  id: number;
  userId: number;
  balance: number;
  currency: string;
  status: string;
  createdAt: string;
}

export interface UserProfileResponse {
  id: number;
  email: string;
  phone: string;
  phoneVerified: boolean;
  status: string;
  tier: string;
  authProvider: string;
  fullName: string | null;
  dateOfBirth: string | null;
  avatarEmoji: string | null;
  createdAt: string;
}

export interface LedgerEntryResponse {
  id: number;
  amount: number;
  direction: string;
  txnType: string;
  referenceId: string;
  description: string;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Auth                                                               */
/* ------------------------------------------------------------------ */

export const authApi = {
  signup: (data: { email: string; password: string }) =>
    request<void>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  requestOtp: (data: { email: string; phone: string }) =>
    request<void>("/auth/request-otp", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  verifyOtp: (data: { email: string; phone: string; otp: string; fullName?: string; dateOfBirth?: string }) =>
    request<AuthResponse>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  googleAuth: (data: { idToken: string }) =>
    request<AuthResponse>("/auth/google", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  refresh: (data: { refreshToken: string }) =>
    request<AuthResponse>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logout: (data: { refreshToken: string }) =>
    request<void>("/auth/logout", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

/* ------------------------------------------------------------------ */
/*  Wallet                                                             */
/* ------------------------------------------------------------------ */

export const walletApi = {
  getMyWallet: () => request<WalletResponse>("/wallet/me"),
};

/* ------------------------------------------------------------------ */
/*  User Profile                                                       */
/* ------------------------------------------------------------------ */

export const userApi = {
  getMe: () => request<UserProfileResponse>("/users/me"),
};

/* ------------------------------------------------------------------ */
/*  Transaction History                                                */
/* ------------------------------------------------------------------ */

export const transactionApi = {
  getHistory: () => request<LedgerEntryResponse[]>("/transactions/history"),
};

/* ------------------------------------------------------------------ */
/*  Topup                                                              */
/* ------------------------------------------------------------------ */

export const topupApi = {
  confirm: (data: { amount: number; idempotencyKey: string; gatewayRef: string }) =>
    request<TopupResponse>("/topup/confirm", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

/* ------------------------------------------------------------------ */
/*  Transfer                                                           */
/* ------------------------------------------------------------------ */

export const transferApi = {
  send: (data: { receiverId: number; amount: number; idempotencyKey: string }) =>
    request<TransferResponse>("/transfer", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

/* ------------------------------------------------------------------ */
/*  Payout                                                             */
/* ------------------------------------------------------------------ */

export const payoutApi = {
  request: (data: { bankAccountId: number; amount: number; idempotencyKey: string }) =>
    request<PayoutResponse>("/payout", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

/* ------------------------------------------------------------------ */
/*  Bank Accounts                                                      */
/* ------------------------------------------------------------------ */

export const bankAccountApi = {
  list: () => request<BankAccountResponse[]>("/bank-accounts"),

  link: (data: { accountNumber: string; ifscCode: string; holderName: string }) =>
    request<BankAccountResponse>("/bank-accounts", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  remove: (id: number) =>
    request<void>(`/bank-accounts/${id}`, { method: "DELETE" }),
};

/* ------------------------------------------------------------------ */
/*  Premium                                                            */
/* ------------------------------------------------------------------ */

export const premiumApi = {
  upgrade: () =>
    request<void>("/premium/upgrade", {
      method: "POST",
    }),
};

/* ------------------------------------------------------------------ */
/*  Admin                                                              */
/* ------------------------------------------------------------------ */

export const adminApi = {
  getUsers: () => request<UserSummary[]>("/admin/users"),

  getWallets: () => request<WalletSummary[]>("/admin/wallets"),

  freezeWallet: (walletId: number) =>
    request<void>(`/admin/wallets/${walletId}/freeze`, { method: "POST" }),

  unfreezeWallet: (walletId: number) =>
    request<void>(`/admin/wallets/${walletId}/unfreeze`, { method: "POST" }),
};
