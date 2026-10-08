const API_BASE = "/api/backend";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiOptions {
  method?: string;
  body?: unknown;
  token?: string;
  isFormData?: boolean;
  apiKey?: string;
  signal?: AbortSignal;
}

export async function apiClient<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { method = "GET", body, token, isFormData, apiKey, signal } = options;

  const headers: Record<string, string> = {};
  if (apiKey) headers["X-API-KEY"] = apiKey;
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!isFormData && body) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    signal,
    cache: "no-store",
    body: isFormData
      ? (body as FormData)
      : body
        ? JSON.stringify(body)
        : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    if (res.status === 401 && token)
      window.dispatchEvent(
        new CustomEvent("3dify:session-expired", { detail: token }),
      );
    throw new ApiError(
      error.message || `Request failed (${res.status})`,
      res.status,
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// --- Auth ---
export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  isAdmin: boolean;
}

export const authApi = {
  register: (email: string, password: string, name?: string) =>
    apiClient<AuthResponse>("/auth/register", {
      method: "POST",
      body: { email, password, name },
    }),
  login: (email: string, password: string) =>
    apiClient<AuthResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
    }),
};

// --- Plans ---
export interface Plan {
  id: string;
  name: string;
  displayName: string | null;
  description: string | null;
  priceCents: number;
  currency: string;
  rateLimitRpm: number;
  monthlyQuota: number;
  sortOrder: number;
  stripePriceId: string | null;
  isActive: boolean;
}

export const plansApi = {
  listActive: () => apiClient<Plan[]>("/public/plans"),
  // Admin
  listAll: (token: string) => apiClient<Plan[]>("/admin/plans", { token }),
  create: (token: string, data: Omit<Plan, "id" | "isActive">) =>
    apiClient<Plan>("/admin/plans", { method: "POST", token, body: data }),
  update: (token: string, id: string, data: Partial<Plan>) =>
    apiClient<Plan>(`/admin/plans/${id}`, { method: "PUT", token, body: data }),
  deactivate: (token: string, id: string) =>
    apiClient<void>(`/admin/plans/${id}`, { method: "DELETE", token }),
};

// --- Subscription ---
export interface SubscriptionStatus {
  planId: string | null;
  planName: string | null;
  displayName: string | null;
  priceCents: number | null;
  status: string | null;
  currentPeriodEnd: string | null;
  isActive: boolean;
}

export const subscriptionApi = {
  getStatus: (token: string) =>
    apiClient<SubscriptionStatus>("/dashboard/subscription", { token }),
  createCheckout: (
    token: string,
    planId: string,
    successUrl: string,
    cancelUrl: string,
  ) =>
    apiClient<{ checkoutUrl: string }>("/dashboard/subscription/checkout", {
      method: "POST",
      token,
      body: { planId, successUrl, cancelUrl },
    }),
  createPortal: (token: string, returnUrl: string) =>
    apiClient<{ portalUrl: string }>("/dashboard/subscription/portal", {
      method: "POST",
      token,
      body: { returnUrl },
    }),
};

// --- API Keys ---
export interface ApiKeyCreated {
  id: string;
  key: string;
  label: string | null;
  planName: string;
  createdAt: string;
}

export interface ApiKey {
  id: string;
  keyPrefix: string;
  label: string | null;
  planName: string;
  isActive: boolean;
  createdAt: string;
  revokedAt: string | null;
}

export const apiKeysApi = {
  list: (token: string) =>
    apiClient<ApiKey[]>("/dashboard/api-keys", { token }),
  create: (token: string, label?: string, planName?: string) =>
    apiClient<ApiKeyCreated>("/dashboard/api-keys", {
      method: "POST",
      token,
      body: { label, planName: planName || "free" },
    }),
  revoke: (token: string, keyId: string) =>
    apiClient<void>(`/dashboard/api-keys/${keyId}`, {
      method: "DELETE",
      token,
    }),
};

// --- Webhook ---
export interface Webhook {
  id: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export const webhookApi = {
  get: (token: string) =>
    apiClient<Webhook | null>("/dashboard/webhooks", { token }),
  set: (token: string, url: string) =>
    apiClient<Webhook>("/dashboard/webhooks", {
      method: "PUT",
      token,
      body: { url },
    }),
  delete: (token: string) =>
    apiClient<void>("/dashboard/webhooks", {
      method: "DELETE",
      token,
    }),
};

// --- Jobs ---
export interface Job {
  id: string;
  status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED";
  inputImages?: string[];
  inputImage1: string;
  inputImage2: string;
  outputGlbUrl: string | null;
  outputUsdzUrl: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface JobHistoryEntry {
  id: string;
  jobId: string;
  status: string;
  details: string | null;
  createdAt: string;
}

export const jobsApi = {
  list: (token: string) => apiClient<Job[]>("/dashboard/jobs", { token }),
  history: (token: string, jobId: string) =>
    apiClient<JobHistoryEntry[]>(`/dashboard/jobs/${jobId}/history`, { token }),
};

export interface GenerationOptions {
  provider: string;
  minImages: number;
  maxImages: number | null;
}
export const generationApi = {
  options: (token: string) =>
    apiClient<GenerationOptions>("/dashboard/generation-options", { token }),
  submit: (apiKey: string, files: File[]) => {
    const body = new FormData();
    files.forEach((file) => body.append("images", file));
    return apiClient<{ jobId: string; status: string }>("/api/v1/generate", {
      method: "POST",
      apiKey,
      body,
      isFormData: true,
    });
  },
};
export function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}
export function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
export function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(cents / 100);
}
