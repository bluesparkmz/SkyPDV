// Configuração base da API
const BASE_URL = "https://api.skyvenda.com";

export class ApiError<T = unknown> extends Error {
  status: number;
  statusText: string;
  data?: T;

  constructor(message: string, status: number, statusText: string, data?: T) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
    this.data = data;
  }
}

// Função para obter token do localStorage
const getToken = (): string | null => {
  return localStorage.getItem("skypdv_token");
};

// Headers padrão para todas as requisições
const getHeaders = (): HeadersInit => {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};

async function parseErrorBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return undefined;
    }
  }
  try {
    return await response.text();
  } catch {
    return undefined;
  }
}

async function request<T>(endpoint: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...init,
    headers: getHeaders(),
  });

  if (!response.ok) {
    const data = await parseErrorBody(response);
    const message =
      typeof data === "object" && data && "detail" in (data as any)
        ? String((data as any).detail)
        : `API Error: ${response.status} ${response.statusText}`;
    throw new ApiError(message, response.status, response.statusText, data);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return undefined as T;
}

function parseFilenameFromContentDisposition(contentDisposition: string | null): string | undefined {
  if (!contentDisposition) return undefined;
  const match = /filename\*?=(?:UTF-8''|\")?([^;\"\n]+)/i.exec(contentDisposition);
  if (!match) return undefined;
  return decodeURIComponent(match[1]).replace(/\"/g, "").trim();
}

export async function apiGetBlob(endpoint: string): Promise<{ blob: Blob; filename?: string }> {
  const headers = new Headers(getHeaders() as HeadersInit);
  headers.delete("Content-Type");

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const data = await parseErrorBody(response);
    const message =
      typeof data === "object" && data && "detail" in (data as any)
        ? String((data as any).detail)
        : `API Error: ${response.status} ${response.statusText}`;
    throw new ApiError(message, response.status, response.statusText, data);
  }

  const blob = await response.blob();
  const filename = parseFilenameFromContentDisposition(response.headers.get("content-disposition"));
  return { blob, filename };
}

// Função genérica para requisições GET
export async function apiGet<T>(endpoint: string): Promise<T> {
  return request<T>(endpoint, { method: "GET" });
}

// Função genérica para requisições POST
export async function apiPost<T>(endpoint: string, data?: unknown): Promise<T> {
  return request<T>(endpoint, {
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
}

// Função genérica para requisições PUT
export async function apiPut<T>(endpoint: string, data?: unknown): Promise<T> {
  return request<T>(endpoint, {
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined,
  });
}

// Função genérica para requisições PATCH
export async function apiPatch<T>(endpoint: string, data?: unknown): Promise<T> {
  return request<T>(endpoint, {
    method: "PATCH",
    body: data ? JSON.stringify(data) : undefined,
  });
}

// Função genérica para requisições DELETE
export async function apiDelete<T>(endpoint: string): Promise<T> {
  return request<T>(endpoint, { method: "DELETE" });
}

// === Endpoints do SkyPDV ===

// Terminal
export const terminalApi = {
  get: () => apiGet<Terminal>("/skypdv/terminal"),
  setup: (data: CreateTerminal) => apiPost<Terminal>("/skypdv/terminal/setup", data),
  update: (data: Partial<Terminal>) => apiPut<Terminal>("/skypdv/terminal", data),
};

// Produtos
export const productsApi = {
  list: (params?: ProductsParams) => {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.category) query.append("category", params.category);
    if (params?.source_type) query.append("source_type", params.source_type);
    if (params?.is_fastfood !== undefined) query.append("is_fastfood", String(params.is_fastfood));
    if (params?.skip) query.append("skip", String(params.skip));
    if (params?.limit) query.append("limit", String(params.limit));
    const queryString = query.toString();
    return apiGet<Product[]>(`/skypdv/products${queryString ? `?${queryString}` : ""}`);
  },
  create: (data: CreateProduct) => apiPost<Product>("/skypdv/products", data),
  update: (id: number, data: UpdateProduct) => apiPut<Product>(`/skypdv/products/${id}`, data),
  delete: (id: number) => apiDelete<void>(`/skypdv/products/${id}`),
  getMovements: (id: number, skip = 0, limit = 100) =>
    apiGet<StockMovement[]>(`/skypdv/products/${id}/movements?skip=${skip}&limit=${limit}`),
};

// Categorias
export const categoriesApi = {
  list: () => apiGet<string[]>("/skypdv/categories"),
  listFull: () => apiGet<Category[]>("/skypdv/categories-list"),
  create: (data: CreateCategory, isGlobal = false) =>
    apiPost<Category>(`/skypdv/categories-list?is_global=${isGlobal}`, data),
  adopt: (id: number) => apiPost<Category>(`/skypdv/categories-list/${id}/adopt`),
  update: (id: number, data: UpdateCategory) =>
    apiPut<Category>(`/skypdv/categories-list/${id}`, data),
  delete: (id: number) => apiDelete<void>(`/skypdv/categories-list/${id}`),
};

// Caixa
export const cashRegisterApi = {
  getCurrent: () => apiGet<CashRegister | null>("/skypdv/cash-register/current"),
  open: (data: OpenCashRegister) => apiPost<CashRegister>("/skypdv/cash-register/open", data),
  close: (data: CloseCashRegister) => apiPost<CashRegister>("/skypdv/cash-register/close", data),
};

// Vendas
export const salesApi = {
  create: (data: CreateSale) => apiPost<Sale>("/skypdv/sales", data),
  list: (params?: SalesParams & { user_id?: number }) => {
    const query = new URLSearchParams();
    if (params?.start_date) query.append("start_date", params.start_date);
    if (params?.end_date) query.append("end_date", params.end_date);
    if (params?.source_type) query.append("source_type", params.source_type);
    if (params?.payment_method) query.append("payment_method", params.payment_method);
    if (params?.sale_type) query.append("sale_type", params.sale_type);
    if (params?.status) query.append("status", params.status);
    if (params?.skip) query.append("skip", String(params.skip));
    if (params?.limit) query.append("limit", String(params.limit));
    if (params?.user_id) query.append("user_id", String(params.user_id));
    const queryString = query.toString();
    return apiGet<Sale[]>(`/skypdv/sales${queryString ? `?${queryString}` : ""}`);
  },
  get: (id: number) => apiGet<Sale>(`/skypdv/sales/${id}`),
  void: (id: number) => apiPost<Sale>(`/skypdv/sales/${id}/void`),
};

// Dashboard
export const dashboardApi = {
  get: (userId?: number) => {
    const query = new URLSearchParams();
    if (userId) query.append("user_id", String(userId));
    const queryString = query.toString();
    return apiGet<DashboardStats>(`/skypdv/dashboard${queryString ? `?${queryString}` : ""}`);
  },
  getSalesSummary: (startDate?: string, endDate?: string, userId?: number) => {
    const query = new URLSearchParams();
    if (startDate) query.append("start_date", startDate);
    if (endDate) query.append("end_date", endDate);
    if (userId) query.append("user_id", String(userId));
    const queryString = query.toString();
    return apiGet<SalesSummary>(`/skypdv/reports/sales-summary${queryString ? `?${queryString}` : ""}`);
  },
  downloadSalesSummaryPdf: (startDate?: string, endDate?: string, userId?: number) => {
    const query = new URLSearchParams();
    if (startDate) query.append("start_date", startDate);
    if (endDate) query.append("end_date", endDate);
    if (userId) query.append("user_id", String(userId));
    const queryString = query.toString();
    return apiGetBlob(`/skypdv/reports/sales-summary.pdf${queryString ? `?${queryString}` : ""}`);
  },
  downloadProductsPdf: () => {
    return apiGetBlob("/skypdv/reports/products.pdf");
  },
  getPeriodicReport: (period: "day" | "month" | "year", date: string, userId?: number) => {
    const query = new URLSearchParams();
    query.append("period", period);
    query.append("date", date);
    if (userId) query.append("user_id", String(userId));
    return apiGet<SalesSummary>(`/skypdv/reports/periodic?${query}`);
  },
  getDetailedMonthly: (year: number, month: number, userId?: number) => {
    const query = new URLSearchParams();
    query.append("year", String(year));
    query.append("month", String(month));
    if (userId) query.append("user_id", String(userId));
    return apiGet<DetailedMonthlyReport>(`/skypdv/reports/detailed-monthly?${query}`);
  },
  getDetailedYearly: (year: number, userId?: number) => {
    const query = new URLSearchParams();
    query.append("year", String(year));
    if (userId) query.append("user_id", String(userId));
    return apiGet<DetailedYearlyReport>(`/skypdv/reports/detailed-yearly?${query}`);
  },
  getTopProducts: (startDate?: string, endDate?: string, limit = 20, userId?: number) => {
    const query = new URLSearchParams();
    if (startDate) query.append("start_date", startDate);
    if (endDate) query.append("end_date", endDate);
    query.append("limit", String(limit));
    if (userId) query.append("user_id", String(userId));
    return apiGet<TopProduct[]>(`/skypdv/reports/top-products?${query}`);
  },
  getSalesByDay: (startDate?: string, endDate?: string, userId?: number) => {
    const query = new URLSearchParams();
    if (startDate) query.append("start_date", startDate);
    if (endDate) query.append("end_date", endDate);
    if (userId) query.append("user_id", String(userId));
    const queryString = query.toString();
    return apiGet<SalesByPeriod[]>(`/skypdv/reports/sales-by-day${queryString ? `?${queryString}` : ""}`);
  },
};

// Métodos de Pagamento
export const paymentMethodsApi = {
  list: () => apiGet<PaymentMethod[]>("/skypdv/payment-methods"),
  create: (data: CreatePaymentMethod, isGlobal = false) =>
    apiPost<PaymentMethod>(`/skypdv/payment-methods?is_global=${isGlobal}`, data),
  adopt: (id: number) => apiPost<PaymentMethod>(`/skypdv/payment-methods/${id}/adopt`),
  update: (id: number, data: UpdatePaymentMethod) =>
    apiPut<PaymentMethod>(`/skypdv/payment-methods/${id}`, data),
  delete: (id: number) => apiDelete<void>(`/skypdv/payment-methods/${id}`),
};

// Fornecedores
export const suppliersApi = {
  list: () => apiGet<Supplier[]>("/skypdv/suppliers"),
  create: (data: CreateSupplier) => apiPost<Supplier>("/skypdv/suppliers", data),
  connectFastFood: (data: ConnectFastFoodRequest) =>
    apiPost<Supplier>("/skypdv/suppliers/connect/fastfood", data),
  sync: (id: number) => apiPost<Supplier>(`/skypdv/suppliers/${id}/sync`),
  update: (id: number, data: UpdateSupplier) =>
    apiPut<Supplier>(`/skypdv/suppliers/${id}`, data),
  delete: (id: number) => apiDelete<void>(`/skypdv/suppliers/${id}`),
};

// Inventário
export const inventoryApi = {
  getReport: () => apiGet<InventoryReport>("/skypdv/inventory"),
  adjust: (data: StockAdjustment) =>
    apiPost<StockMovement>("/skypdv/inventory/adjustment", data),
  transfer: (data: StockTransfer) =>
    apiPost<StockMovement>("/skypdv/inventory/transfer", data),
};

// Terminal Users
export const terminalUsersApi = {
  list: () => apiGet<PDVTerminalUser[]>("/skypdv/terminal/users"),
  add: (data: CreatePDVTerminalUser) =>
    apiPost<PDVTerminalUser>("/skypdv/terminal/users", data),
  update: (id: number, data: UpdatePDVTerminalUser) =>
    apiPut<PDVTerminalUser>(`/skypdv/terminal/users/${id}`, data),
  remove: (id: number) =>
    apiDelete<{ message: string }>(`/skypdv/terminal/users/${id}`),
};

// === Types ===

export interface Terminal {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  logo: string | null;
  address: string | null;
  phone: string | null;
  tax_rate: string;
  currency: string;
  settings: Record<string, unknown> | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTerminal {
  name: string;
  description?: string | null;
  logo?: string | null;
  bio?: string | null;
  tax_rate?: string;
  currency?: string;
  settings?: Record<string, unknown> | null;
  restaurant_details?: {
    province?: string;
    district?: string;
    neighborhood?: string;
    avenue?: string;
    location_google_maps?: string;
    opening_time?: string;
    closing_time?: string;
    open_days?: string;
    min_delivery_value?: number;
    latitude?: number;
    longitude?: number;
  };
}

export interface Product {
  id: number;
  terminal_id: number;
  supplier_id: number | null;
  source_type: "local" | "fastfood" | "skyvenda";
  external_product_id: number | null;
  name: string;
  sku: string | null;
  barcode: string | null;
  description: string | null;
  category: string | null;
  cost_price: string;
  price: string;
  promotional_price: string | null;
  image: string | null;
  emoji: string | null;
  is_fastfood: boolean;
  track_stock: boolean;
  allow_decimal_quantity: boolean;
  is_active: boolean;
  inventory: ProductInventory | null;
  created_at: string;
  updated_at: string;
}

export interface ProductInventory {
  quantity: string;
  min_quantity: string;
  max_quantity: string | null;
  reserved_quantity: string;
}

export interface CreateProduct {
  name: string;
  sku?: string;
  barcode?: string;
  description?: string;
  category?: string;
  cost_price?: string;
  price: string;
  promotional_price?: string;
  image?: string;
  emoji?: string;
  is_fastfood?: boolean;
  track_stock?: boolean;
  allow_decimal_quantity?: boolean;
  supplier_id?: number;
  initial_stock?: string;
}

export interface UpdateProduct {
  name?: string;
  sku?: string;
  barcode?: string;
  description?: string;
  category?: string;
  cost_price?: string;
  price?: string;
  promotional_price?: string;
  image?: string;
  emoji?: string;
  is_fastfood?: boolean;
  track_stock?: boolean;
  allow_decimal_quantity?: boolean;
  supplier_id?: number;
  is_active?: boolean;
  initial_stock?: string;
}

export interface ProductsParams {
  search?: string;
  category?: string;
  source_type?: string;
  is_fastfood?: boolean;
  skip?: number;
  limit?: number;
}

export interface StockMovement {
  id: number;
  product_id: number;
  terminal_id: number;
  movement_type: "in" | "out" | "adjustment" | "sale" | "return" | "transfer";
  quantity: string;
  quantity_before: string;
  quantity_after: string;
  reference: string | null;
  reference_id: number | null;
  from_location: string | null;
  to_location: string | null;
  notes: string | null;
  created_by: number;
  created_at: string;
}

export interface CashRegister {
  id: number;
  terminal_id: number;
  user_id: number;
  opened_at: string;
  closed_at: string | null;
  opening_amount: string;
  closing_amount: string | null;
  expected_amount: string | null;
  difference: string | null;
  total_cash: string;
  total_card: string;
  total_skywallet: string;
  total_mpesa: string;
  total_sales: string;
  total_refunds: string;
  sales_count: number;
  refunds_count: number;
  status: "open" | "closed";
  notes: string | null;
}

export interface OpenCashRegister {
  opening_amount: string;
  notes?: string;
}

export interface CloseCashRegister {
  closing_amount: string;
  notes?: string;
}

export interface DashboardStats {
  today_sales: number;
  today_revenue: string;
  today_profit: string;
  week_sales: number;
  week_revenue: string;
  month_sales: number;
  month_revenue: string;
  low_stock_alerts: number;
  out_of_stock: number;
  current_register_open: boolean;
  current_register_total: string | null;
  top_products: TopProduct[];
  payment_breakdown: Record<string, { amount: number; percentage: number }>;
  weekly_breakdown: SalesByPeriod[];
}

export interface SalesSummary {
  period_start: string;
  period_end: string;
  total_sales: number;
  total_revenue: string;
  total_cost: string;
  gross_profit: string;
  average_sale_value: string;
  total_items_sold: number;
  total_discounts: string;
  total_taxes: string;
  cash_sales: string;
  card_sales: string;
  skywallet_sales: string;
  mpesa_sales: string;
  voided_sales: number;
  voided_amount: string;
}

export interface SalesByPeriod {
  period: string;
  sales_count: number;
  total_revenue: string;
  average_value: string;
}

export interface DetailedMonthlyReport {
  year: number;
  month: number;
  month_name: string;
  summary: SalesSummary;
  daily_breakdown: SalesByPeriod[];
  top_products: TopProduct[];
  top_categories: Array<{ category: string; revenue: number; quantity: number }>;
  payment_method_breakdown: Record<string, { count: number; total: number; percentage: number }>;
  comparison_previous_month: {
    previous_month_revenue: number;
    previous_month_sales: number;
    revenue_change_percent: number;
    sales_change_percent: number;
  } | null;
}

export interface DetailedYearlyReport {
  year: number;
  summary: SalesSummary;
  monthly_breakdown: SalesByPeriod[];
  top_products: TopProduct[];
  top_categories: Array<{ category: string; revenue: number; quantity: number }>;
  payment_method_breakdown: Record<string, { count: number; total: number; percentage: number }>;
  seasonal_trends: {
    best_month: string;
    best_month_revenue: number;
    worst_month: string;
    worst_month_revenue: number;
    average_monthly_revenue: number;
  } | null;
  comparison_previous_year: {
    previous_year_revenue: number;
    previous_year_sales: number;
    revenue_change_percent: number;
    sales_change_percent: number;
  } | null;
}

export interface Sale {
  id: number;
  terminal_id: number;
  cash_register_id: number | null;
  customer_id: number | null;
  customer_name: string | null;
  customer_phone: string | null;
  subtotal: string;
  discount_amount: string;
  discount_percent: string;
  tax_amount: string;
  total: string;
  payment_method: "cash" | "card" | "skywallet" | "mpesa" | "mixed";
  payment_status: string;
  amount_paid: string;
  change_amount: string;
  sale_type: "local" | "delivery" | "online";
  status: "completed" | "cancelled";
  delivery_address: string | null;
  delivery_notes: string | null;
  external_order_id: number | null;
  external_order_type: string | null;
  notes: string | null;
  receipt_number: string | null;
  items: SaleItem[];
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  product_name: string;
  product_sku: string | null;
  quantity: string;
  unit_price: string;
  discount_amount: string;
  discount_percent: string;
  subtotal: string;
  notes: string | null;
  created_at: string;
}

export interface CreateSale {
  items: CreateSaleItem[];
  customer_id?: number;
  customer_name?: string;
  customer_phone?: string;
  payment_method: "cash" | "card" | "skywallet" | "mpesa" | "mixed";
  amount_paid?: string;
  discount_amount?: string;
  discount_percent?: string;
  sale_type?: "local" | "delivery" | "online";
  delivery_address?: string;
  delivery_notes?: string;
  notes?: string;
}

export interface CreateSaleItem {
  product_id?: number;
  external_product_id?: number;
  source_type?: "local" | "fastfood" | "skyvenda";
  quantity: string;
  unit_price?: string;
  discount_amount?: string;
  discount_percent?: string;
  item_type?: "menu_item" | "drink";
  notes?: string;
}

export interface SalesParams {
  start_date?: string;
  end_date?: string;
  source_type?: string;
  payment_method?: string;
  sale_type?: string;
  status?: string;
  skip?: number;
  limit?: number;
  user_id?: number;
}

export interface DashboardSummary {
  total_sales: string;
  total_revenue: string;
  total_profit: string;
  sales_count: number;
  average_ticket: string;
  top_product: string | null;
  low_stock_count: number;
  period_label: string;
}

export interface SalesChartData {
  date: string;
  total: string;
  count: number;
}

export interface TopProduct {
  product_id: number;
  product_name: string;
  category: string | null;
  quantity_sold: string;
  revenue: string;
  profit: string;
}

export interface CategorySales {
  category: string;
  total: string;
  count: number;
}

export interface PaymentMethodSales {
  payment_method: string;
  total: string;
  count: number;
}

export interface PaymentMethod {
  id: number;
  terminal_id: number | null;
  is_global: boolean;
  created_by: number | null;
  name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentMethod {
  name: string;
  description?: string;
  icon?: string;
}

export interface UpdatePaymentMethod {
  name?: string;
  description?: string;
  icon?: string;
  is_active?: boolean;
}

export interface Category {
  id: number;
  terminal_id: number | null;
  is_global: boolean;
  created_by: number | null;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCategory {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface UpdateCategory {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  is_active?: boolean;
}

export interface Supplier {
  id: number;
  terminal_id: number;
  name: string;
  source_type: "local" | "fastfood" | "skyvenda";
  external_id: number | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSupplier {
  name: string;
  source_type?: "local" | "fastfood" | "skyvenda";
  external_id?: number;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  address?: string;
  notes?: string;
}

export interface UpdateSupplier {
  name?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  address?: string;
  notes?: string;
  is_active?: boolean;
}

export interface ConnectFastFoodRequest {
  restaurant_id: number;
  sync_products: boolean;
}

export interface InventoryReport {
  total_products: number;
  total_value: string;
  total_retail_value: string;
  low_stock_count: number;
  out_of_stock_count: number;
  products: Array<{
    id: number;
    product_id: number;
    terminal_id: number;
    quantity: string;
    min_quantity: string;
    max_quantity: string | null;
    reserved_quantity: string;
    storage_location: "balcao" | "congelado" | "armazem";
    last_restock_at: string | null;
    last_count_at: string | null;
    updated_at: string;
    product_name: string;
    product_sku: string | null;
  }>;
}

export interface PDVTerminalUser {
  id: number;
  terminal_id: number;
  user_id: number;
  role: "admin" | "cashier" | "manager" | "viewer";
  can_sell: boolean;
  can_open_cash_register: boolean;
  can_manage_products: boolean;
  can_manage_stock: boolean;
  can_view_reports: boolean;
  can_manage_users: boolean;
  is_active: boolean;
  invited_by: number | null;
  invited_at: string;
  joined_at: string | null;
  created_at: string;
  updated_at: string;
  user_name: string | null;
  user_email: string | null;
}

export interface CreatePDVTerminalUser {
  email: string;
  role?: "admin" | "cashier" | "manager" | "viewer";
  can_sell?: boolean;
  can_open_cash_register?: boolean;
  can_manage_products?: boolean;
  can_manage_stock?: boolean;
  can_view_reports?: boolean;
  can_manage_users?: boolean;
}

export interface UpdatePDVTerminalUser {
  role?: "admin" | "cashier" | "manager" | "viewer";
  can_sell?: boolean;
  can_open_cash_register?: boolean;
  can_manage_products?: boolean;
  can_manage_stock?: boolean;
  can_view_reports?: boolean;
  can_manage_users?: boolean;
  is_active?: boolean;
}

export interface StockAdjustment {
  product_id: number;
  movement_type: "in" | "out" | "adjustment";
  quantity: string;
  notes?: string;
  reference?: string;
  storage_location: "balcao" | "congelado" | "armazem";
}

export interface StockTransfer {
  product_id: number;
  from_location: "balcao" | "congelado" | "armazem";
  to_location: "balcao" | "congelado" | "armazem";
  quantity: string;
  notes?: string;
}
