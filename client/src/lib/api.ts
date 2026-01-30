import type { Category, Tool, Baseline, Customer, InsertCustomer, ConnectwiseSettings, ConnectwiseTypeMapping, ConnectwiseSkuMapping } from "@shared/schema";

const API_BASE = "/api";

interface ConnectwiseSettingsResponse extends Omit<ConnectwiseSettings, "privateKey"> {
  hasPrivateKey?: boolean;
}

interface SyncResult {
  success: boolean;
  companiesFound: number;
  companiesImported: number;
  companiesUpdated: number;
  companiesSkipped: number;
  agreementsProcessed: number;
  toolsActivated: number;
  errors: string[];
  duration: number;
}

interface SyncProgress {
  status: string;
  currentStep: string;
  companiesProcessed: number;
  companiesTotal: number;
  errors: string[];
}

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
    create: (data: InsertCustomer) =>
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
    parseFile: (fileData: string, fileName: string) =>
      fetchJSON<{
        headers: string[];
        columnMapping: Record<string, string>;
        data: Record<string, any>[];
        rowCount: number;
      }>(`${API_BASE}/customers/parse-file`, {
        method: "POST",
        body: JSON.stringify({ fileData, fileName }),
      }),
    importBulk: (data: Record<string, any>[]) =>
      fetchJSON<{
        success: boolean;
        imported: number;
        errors: { row: number; error: string }[];
        total: number;
      }>(`${API_BASE}/customers/import`, {
        method: "POST",
        body: JSON.stringify({ data }),
      }),
  },

  connectwise: {
    getSettings: () => fetchJSON<ConnectwiseSettingsResponse | null>(`${API_BASE}/connectwise/settings`),
    saveSettings: (data: {
      companyId: string;
      publicKey: string;
      privateKey: string;
      siteUrl: string;
      clientId: string;
      enabled?: boolean;
    }) =>
      fetchJSON<ConnectwiseSettingsResponse>(`${API_BASE}/connectwise/settings`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    testConnection: (data: {
      companyId: string;
      publicKey: string;
      privateKey: string;
      siteUrl: string;
      clientId: string;
      useExistingKey?: boolean;
    }) =>
      fetchJSON<{ success: boolean; message: string }>(`${API_BASE}/connectwise/test-connection`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getCompanyTypes: () => fetchJSON<Array<{ id: number; name: string }>>(`${API_BASE}/connectwise/company-types`),
    
    getTypeMappings: () => fetchJSON<ConnectwiseTypeMapping[]>(`${API_BASE}/connectwise/type-mappings`),
    createTypeMapping: (data: Omit<ConnectwiseTypeMapping, "id">) =>
      fetchJSON<ConnectwiseTypeMapping>(`${API_BASE}/connectwise/type-mappings`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateTypeMapping: (id: string, data: Partial<Omit<ConnectwiseTypeMapping, "id">>) =>
      fetchJSON<ConnectwiseTypeMapping>(`${API_BASE}/connectwise/type-mappings/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    deleteTypeMapping: (id: string) =>
      fetch(`${API_BASE}/connectwise/type-mappings/${id}`, { method: "DELETE" }),

    getSkuMappings: () => fetchJSON<ConnectwiseSkuMapping[]>(`${API_BASE}/connectwise/sku-mappings`),
    createSkuMapping: (data: Omit<ConnectwiseSkuMapping, "id">) =>
      fetchJSON<ConnectwiseSkuMapping>(`${API_BASE}/connectwise/sku-mappings`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateSkuMapping: (id: string, data: Partial<Omit<ConnectwiseSkuMapping, "id">>) =>
      fetchJSON<ConnectwiseSkuMapping>(`${API_BASE}/connectwise/sku-mappings/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    deleteSkuMapping: (id: string) =>
      fetch(`${API_BASE}/connectwise/sku-mappings/${id}`, { method: "DELETE" }),

    runSync: () => fetchJSON<SyncResult>(`${API_BASE}/connectwise/sync`, { method: "POST" }),
    getSyncProgress: () => fetchJSON<SyncProgress | null>(`${API_BASE}/connectwise/sync-progress`),
    previewCompanies: () => fetchJSON<PreviewCompany[]>(`${API_BASE}/connectwise/preview-companies`),
    importCompany: (cwCompanyId: number) =>
      fetchJSON<{ success: boolean; message: string; customerId?: string }>(`${API_BASE}/connectwise/import-company`, {
        method: "POST",
        body: JSON.stringify({ cwCompanyId }),
      }),
  },
};

export interface PreviewCompany {
  cwCompanyId: number;
  name: string;
  typeName: string;
  address: string | null;
  phone: string | null;
  contactName: string | null;
  alreadyImported: boolean;
  matchingBaseline: string | null;
}
