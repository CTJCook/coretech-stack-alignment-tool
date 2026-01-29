import type { Category, Tool, Baseline, Customer } from "@shared/schema";

const API_BASE = "/api";

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorData.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  categories: {
    getAll: () => fetchJSON<Category[]>(`${API_BASE}/categories`),
    create: (data: Omit<Category, "id">) =>
      fetchJSON<Category>(`${API_BASE}/categories`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Omit<Category, "id">>) =>
      fetchJSON<Category>(`${API_BASE}/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetch(`${API_BASE}/categories/${id}`, { method: "DELETE" }),
  },

  tools: {
    getAll: (categoryId?: string) => {
      const url = categoryId
        ? `${API_BASE}/tools?categoryId=${categoryId}`
        : `${API_BASE}/tools`;
      return fetchJSON<Tool[]>(url);
    },
    create: (data: Omit<Tool, "id">) =>
      fetchJSON<Tool>(`${API_BASE}/tools`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Omit<Tool, "id">>) =>
      fetchJSON<Tool>(`${API_BASE}/tools/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetch(`${API_BASE}/tools/${id}`, { method: "DELETE" }),
  },

  baselines: {
    getAll: () => fetchJSON<Baseline[]>(`${API_BASE}/baselines`),
    getOne: (id: string) => fetchJSON<Baseline>(`${API_BASE}/baselines/${id}`),
    create: (data: Omit<Baseline, "id">) =>
      fetchJSON<Baseline>(`${API_BASE}/baselines`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Omit<Baseline, "id">>) =>
      fetchJSON<Baseline>(`${API_BASE}/baselines/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetch(`${API_BASE}/baselines/${id}`, { method: "DELETE" }),
  },

  customers: {
    getAll: () => fetchJSON<Customer[]>(`${API_BASE}/customers`),
    getOne: (id: string) => fetchJSON<Customer>(`${API_BASE}/customers/${id}`),
    create: (data: Omit<Customer, "id">) =>
      fetchJSON<Customer>(`${API_BASE}/customers`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Omit<Customer, "id">>) =>
      fetchJSON<Customer>(`${API_BASE}/customers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetch(`${API_BASE}/customers/${id}`, { method: "DELETE" }),
    getGapReport: (id: string) =>
      fetchJSON<any>(`${API_BASE}/customers/${id}/gap-report`),
  },
};
