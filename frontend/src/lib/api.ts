const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/v1";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

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

  verifyOtp: (data: { email: string; phone: string; otp: string }) =>
    request<AuthResponse>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  googleAuth: (data: { idToken: string }) =>
    request<AuthResponse>("/auth/google", {
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
