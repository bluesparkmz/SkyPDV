import { API_URL } from "@/config";
import { ApiError } from "@/services/api";

export type ManagerOverview = {
  total_terminals: number;
  active_terminals: number;
  inactive_terminals: number;
  trial: number;
  active_subs: number;
  suspended: number;
  total_users: number;
};

export type ManagerTerminal = {
  id: number;
  name: string;
  active: boolean;
  subscription_status: string;
  next_billing_date?: string | null;
  grace_period_ends_at?: string | null;
  created_at?: string | null;
  staff_count: number;
  sales_count: number;
  owner: {
    id: number;
    email: string;
    username: string;
    name?: string | null;
    phone?: string | null;
    is_active: boolean;
  };
};

export type ManagerTerminalsPage = {
  total: number;
  limit: number;
  offset: number;
  items: ManagerTerminal[];
};

function getToken() {
  return localStorage.getItem("skypdv_token");
}

async function managerFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const data = await response.json();
      detail = typeof data?.detail === "string" ? data.detail : detail;
    } catch {
      // ignore
    }
    throw new ApiError(detail || "Pedido falhou", response.status, response.statusText);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export function getManagerOverview() {
  return managerFetch<ManagerOverview>("/manager/overview");
}

export function listManagerTerminals(params: {
  q?: string;
  subscription_status?: string;
  active?: boolean | null;
  limit?: number;
  offset?: number;
} = {}) {
  const search = new URLSearchParams();
  if (params.q?.trim()) search.set("q", params.q.trim());
  if (params.subscription_status) search.set("subscription_status", params.subscription_status);
  if (params.active === true || params.active === false) {
    search.set("active", String(params.active));
  }
  if (params.limit != null) search.set("limit", String(params.limit));
  if (params.offset != null) search.set("offset", String(params.offset));
  const query = search.toString();
  return managerFetch<ManagerTerminalsPage>(`/manager/terminals${query ? `?${query}` : ""}`);
}

export function updateManagerTerminal(
  terminalId: number,
  payload: {
    active?: boolean;
    subscription_status?: string;
  },
) {
  return managerFetch<ManagerTerminal>(`/manager/terminals/${terminalId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
