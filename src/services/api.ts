// Configuração base da API
const BASE_URL = "https://skypdvmz.bluesparkmz.com";

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

export function translateApiError(message: string): string {
  if (!message) return "Ocorreu um erro inesperado.";
  const msg = message.trim();

  const exactMap: Record<string, string> = {
    "Cash register is closed. Please open register first.": "O caixa está fechado. Por favor, abra o caixa primeiro.",
    "You already have an open cash register": "Já tem um caixa aberto para o seu utilizador.",
    "No open cash register found": "Nenhum caixa aberto foi encontrado.",
    "Only the operator who opened the cash register can close it": "Apenas o operador que abriu o caixa tem permissão para fechá-lo.",
    "Use your own open cash register to register sales.": "Utilize o seu próprio caixa aberto para registar operações.",
    "Amount paid cannot be lower than total for cash sales": "O valor pago não pode ser inferior ao valor total da venda.",
    "Amount paid cannot be lower than total for cash payments": "O valor pago não pode ser inferior ao valor total.",
    "Amount paid cannot be lower than total": "O valor pago não pode ser inferior ao valor total.",
    "Terminal suspended due to unpaid subscription. Please make a payment to reactivate.": "Terminal suspenso por mensalidade pendente. Por favor, regularize o pagamento para desbloquear.",
    "Terminal suspended due to unpaid subscription.": "Terminal suspenso por mensalidade pendente.",
    "Terminal not found": "Terminal não encontrado.",
    "Service not found": "Serviço não encontrado.",
    "Service is inactive": "O serviço selecionado está inactivo.",
    "Quantity must be greater than zero": "A quantidade deve ser superior a zero.",
    "Invalid payment method": "Método de pagamento inválido.",
    "Invalid change status": "Estado de troco inválido.",
    "Product not found": "Produto não encontrado.",
    "Stock cannot be negative": "O estoque não pode ficar negativo.",
    "Estoque insuficiente para esta saida.": "Estoque insuficiente para esta saída.",
    "Not authenticated": "Sessão expirada. Por favor, inicie sessão novamente.",
    "Could not validate credentials": "Não foi possível validar as credenciais. Faça login novamente.",
    "Unauthorized": "Acesso não autorizado.",
    "Forbidden": "Acesso negado.",
    "Internal Server Error": "Erro interno do servidor. Tente novamente mais tarde.",
    "Failed to fetch": "Falha na ligação ao servidor. Verifique a sua ligação à internet.",
  };

  if (exactMap[msg]) {
    return exactMap[msg];
  }

  // Traduções por padrão / expressões
  if (/cash register is closed/i.test(msg)) {
    return "O caixa está fechado. Por favor, abra o caixa primeiro.";
  }
  if (/already have an open cash register/i.test(msg)) {
    return "Já possui um caixa aberto no momento.";
  }
  if (/no open cash register/i.test(msg)) {
    return "Nenhum caixa aberto encontrado.";
  }
  if (/only the operator who opened/i.test(msg)) {
    return "Apenas o operador que abriu o caixa tem permissão para fechá-lo.";
  }
  if (/use your own open cash register/i.test(msg)) {
    return "Utilize o seu próprio caixa aberto para registar operações.";
  }
  if (/amount paid cannot be lower/i.test(msg)) {
    return "O valor entregue não pode ser inferior ao total a pagar.";
  }
  if (/suspended due to unpaid subscription/i.test(msg)) {
    return "Terminal suspenso por mensalidade pendente. Regularize para desbloquear.";
  }
  if (/insufficient stock for/i.test(msg)) {
    return msg.replace(/insufficient stock for/i, "Estoque insuficiente para").replace(/available:/i, "Disponível:");
  }
  if (/does not allow decimal quantity/i.test(msg)) {
    return msg.replace(/does not allow decimal quantity/i, "não permite quantidade fracionada/decimal.");
  }

  return message;
}

async function request<T>(endpoint: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...init,
    headers: getHeaders(),
  });

  if (!response.ok) {
    const data = await parseErrorBody(response);
    const rawMessage =
      typeof data === "object" && data && "detail" in (data as any)
        ? String((data as any).detail)
        : `Erro na API: ${response.status} ${response.statusText}`;
    const message = translateApiError(rawMessage);
    throw new ApiError(message, response.status, response.statusText, data);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return undefined as T;
}

export interface CsvImportResult {
  imported: number;
  skipped: number;
  skipped_details: Array<{ line?: number; name: string; reason: string }>;
}

export async function apiUploadFile<T = { url: string }>(endpoint: string, file: File): Promise<T> {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);

  const headers = new Headers();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const data = await parseErrorBody(response);
    const rawMessage =
      typeof data === "object" && data && "detail" in (data as any)
        ? String((data as any).detail)
        : `Erro na API: ${response.status} ${response.statusText}`;
    const message = translateApiError(rawMessage);
    throw new ApiError(message, response.status, response.statusText, data);
  }

  return response.json();
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
    const rawMessage =
      typeof data === "object" && data && "detail" in (data as any)
        ? String((data as any).detail)
        : `Erro na API: ${response.status} ${response.statusText}`;
    const message = translateApiError(rawMessage);
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

// Configurações simples/flags do SkyPDV
export const configApi = {
  get: () => apiGet<{ activate_charging: boolean }>("/skypdv/config"),
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
  listCatalog: (params?: { search?: string; category?: string; business_type?: "loja" | "restaurante"; skip?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.category) query.append("category", params.category);
    if (params?.business_type) query.append("business_type", params.business_type);
    if (params?.skip) query.append("skip", String(params.skip));
    if (params?.limit) query.append("limit", String(params.limit));
    const queryString = query.toString();
    return apiGet<Product[]>(`/skypdv/products/catalog${queryString ? `?${queryString}` : ""}`);
  },
  adopt: (data: AdoptProduct) => apiPost<Product>("/skypdv/products/adopt", data),
  create: (data: CreateProduct) => apiPost<Product>("/skypdv/products", data),
  update: (id: number, data: UpdateProduct) => apiPut<Product>(`/skypdv/products/${id}`, data),
  delete: (id: number) => apiDelete<void>(`/skypdv/products/${id}`),
  /** Upload product image to Cloudflare R2 (converted to WebP on the server). Returns { url }. */
  uploadImage: (file: File) => apiUploadFile("/skypdv/products/upload-image", file),
  /** Import products in bulk from a CSV file. */
  importCsv: (file: File) => apiUploadFile<CsvImportResult>("/skypdv/products/import-csv", file),
  getCsvTemplateUrl: () => `${BASE_URL}/skypdv/products/csv-template`,
  getMovements: (id: number, skip = 0, limit = 100) =>
    apiGet<StockMovement[]>(`/skypdv/products/${id}/movements?skip=${skip}&limit=${limit}`),
  getCategorySalesSummaryToday: (category: string) =>
    apiGet<CategorySalesSummary>(`/skypdv/products/category-summary/today?category=${encodeURIComponent(category)}`),
  getCategorySalesReport: (params: {
    category: string;
    start_date?: string;
    end_date?: string;
    user_id?: number;
  }) => {
    const query = new URLSearchParams();
    query.append("category", params.category);
    if (params.start_date) query.append("start_date", params.start_date);
    if (params.end_date) query.append("end_date", params.end_date);
    if (typeof params.user_id === "number") query.append("user_id", String(params.user_id));
    return apiGet<CategorySalesReport>(`/skypdv/products/category-report?${query.toString()}`);
  },
};

// Categorias
export const categoriesApi = {
  list: () => apiGet<string[]>("/skypdv/categories"),
  listFull: () => apiGet<Category[]>("/skypdv/categories-list"),
  downloadProductsPdf: (category?: string) => {
    const query = category ? `?category=${encodeURIComponent(category)}` : "";
    return apiGetBlob(`/skypdv/categories/products.pdf${query}`);
  },
  downloadProductsCsv: (category?: string) => {
    const query = category ? `?category=${encodeURIComponent(category)}` : "";
    return apiGetBlob(`/skypdv/categories/products.csv${query}`);
  },
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
  history: (params?: { start_date?: string; end_date?: string; user_id?: number }) => {
    const query = new URLSearchParams();
    if (params?.start_date) query.append("start_date", params.start_date);
    if (params?.end_date) query.append("end_date", params.end_date);
    if (params?.user_id) query.append("user_id", String(params.user_id));
    const queryString = query.toString();
    return apiGet<CashRegister[]>(`/skypdv/cash-register/history${queryString ? `?${queryString}` : ""}`);
  },
};

export const outflowsApi = {
  list: (params?: { outflow_type?: "product" | "cash"; start_date?: string; end_date?: string; skip?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.outflow_type) query.append("outflow_type", params.outflow_type);
    if (params?.start_date) query.append("start_date", params.start_date);
    if (params?.end_date) query.append("end_date", params.end_date);
    if (typeof params?.skip === "number") query.append("skip", String(params.skip));
    if (typeof params?.limit === "number") query.append("limit", String(params.limit));
    const qs = query.toString();
    return apiGet<PDVOutflow[]>(`/skypdv/outflows${qs ? `?${qs}` : ""}`);
  },
  summary: (start_date?: string, end_date?: string) => {
    const query = new URLSearchParams();
    if (start_date) query.append("start_date", start_date);
    if (end_date) query.append("end_date", end_date);
    const qs = query.toString();
    return apiGet<PDVOutflowSummary>(`/skypdv/outflows/summary${qs ? `?${qs}` : ""}`);
  },
  create: (data: CreatePDVOutflow) => apiPost<PDVOutflow>("/skypdv/outflows", data),
  cancel: (id: number) => apiPost<{ message: string }>(`/skypdv/outflows/${id}/cancel`),
  downloadPdf: (params?: { outflow_type?: "product" | "cash"; start_date?: string; end_date?: string }) => {
    const query = new URLSearchParams();
    if (params?.outflow_type) query.append("outflow_type", params.outflow_type);
    if (params?.start_date) query.append("start_date", params.start_date);
    if (params?.end_date) query.append("end_date", params.end_date);
    const qs = query.toString();
    return apiGetBlob(`/skypdv/outflows/report.pdf${qs ? `?${qs}` : ""}`);
  },
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
  updatePaymentMethod: (id: number, payment_method_id: number) =>
    apiPatch<Sale>(`/skypdv/sales/${id}/payment-method`, { payment_method_id }),
};

// Faturas (mesma estrutura de vendas, mas status pendente/pago)
export const invoicesApi = {
  create: (data: CreateSale) => apiPost<Sale>("/skypdv/invoices", data),
  list: (params?: { start_date?: string; end_date?: string; payment_status?: string; skip?: number; limit?: number; user_id?: number }) => {
    const query = new URLSearchParams();
    if (params?.start_date) query.append("start_date", params.start_date);
    if (params?.end_date) query.append("end_date", params.end_date);
    if (params?.payment_status) query.append("payment_status", params.payment_status);
    if (params?.skip) query.append("skip", String(params.skip));
    if (params?.limit) query.append("limit", String(params.limit));
    if (params?.user_id) query.append("user_id", String(params.user_id));
    const qs = query.toString();
    return apiGet<Sale[]>(`/skypdv/invoices${qs ? `?${qs}` : ""}`);
  },
  pay: (id: number) => apiPost<Sale>(`/skypdv/invoices/${id}/pay`),
  generateReceipt: (id: number) => apiPost<Sale>(`/skypdv/invoices/${id}/generate-receipt`),
  downloadPdf: (id: number, phone?: string, documentType: "invoice" | "receipt" = "invoice") => {
    const query = new URLSearchParams();
    if (phone) query.append("phone", phone);
    query.append("document_type", documentType);
    const qs = query.toString();
    return apiGetBlob(`/skypdv/invoices/${id}/pdf${qs ? `?${qs}` : ""}`);
  },
  uploadAsset: (file: File) => apiUploadFile("/skypdv/invoice-assets/upload", file),
};

export const invoiceCustomersApi = {
  list: () => apiGet<InvoiceCustomer[]>("/skypdv/invoice-customers"),
  create: (data: CreateInvoiceCustomer) => apiPost<InvoiceCustomer>("/skypdv/invoice-customers", data),
  update: (id: number, data: Partial<CreateInvoiceCustomer>) =>
    apiPut<InvoiceCustomer>(`/skypdv/invoice-customers/${id}`, data),
  delete: (id: number) => apiDelete<{ message: string }>(`/skypdv/invoice-customers/${id}`),
};

// Perfil
export const profileApi = {
  updatePhone: (phone: string) => apiPost<{ status: string; phone: string }>("/user/phone", { phone }),
};

export const accountsApi = {
  list: (status?: "open" | "closed" | "all") => {
    const query = new URLSearchParams();
    if (status && status !== "all") query.append("status", status);
    const qs = query.toString();
    return apiGet<Account[]>(`/skypdv/accounts${qs ? `?${qs}` : ""}`);
  },
  get: (id: number) => apiGet<Account>(`/skypdv/accounts/${id}`),
  create: (data: CreateAccount) => apiPost<Account>("/skypdv/accounts", data),
  update: (id: number, data: UpdateAccount) => apiPut<Account>(`/skypdv/accounts/${id}`, data),
  addItems: (id: number, items: CreateAccountItem[]) =>
    apiPost<Account>(`/skypdv/accounts/${id}/items`, items),
  updateItem: (accountId: number, itemId: number, data: UpdateAccountItem) =>
    apiPut<Account>(`/skypdv/accounts/${accountId}/items/${itemId}`, data),
  removeItem: (accountId: number, itemId: number) =>
    apiDelete<void>(`/skypdv/accounts/${accountId}/items/${itemId}`),
  close: (id: number, payment_method: PaymentMethodValue, amount_paid: string, change_status: "given" | "not_given") =>
    apiPost<Account>(`/skypdv/accounts/${id}/close`, { payment_method, amount_paid, change_status }),
  remove: (id: number) => apiDelete<void>(`/skypdv/accounts/${id}`),
};

// Finanças
export const financeApi = {
  summary: (start_date?: string, end_date?: string, user_id?: number) => {
    const query = new URLSearchParams();
    if (start_date) query.append("start_date", start_date);
    if (end_date) query.append("end_date", end_date);
    if (user_id) query.append("user_id", String(user_id));
    const qs = query.toString();
    return apiGet<FinancialSummary>(`/skypdv/finance/summary${qs ? `?${qs}` : ""}`);
  },
  taxSummary: (year: number, month: number) =>
    apiGet<PDVTaxSummary>(`/skypdv/finance/tax-summary?year=${year}&month=${month}`),
  updateTaxSummary: (year: number, month: number, data: PDVTaxSummaryUpdate) =>
    apiPut<PDVTaxSummary>(`/skypdv/finance/tax-summary?year=${year}&month=${month}`, data),
  listCategories: () => apiGet<PDVExpenseCategory[]>("/skypdv/finance/expense-categories"),
  createCategory: (data: PDVExpenseCategoryCreate) =>
    apiPost<PDVExpenseCategory>("/skypdv/finance/expense-categories", data),
  updateCategory: (id: number, data: PDVExpenseCategoryUpdate) =>
    apiPut<PDVExpenseCategory>(`/skypdv/finance/expense-categories/${id}`, data),
  deleteCategory: (id: number) => apiDelete(`/skypdv/finance/expense-categories/${id}`),
  listExpenses: (start_date?: string, end_date?: string, category_id?: number) => {
    const query = new URLSearchParams();
    if (start_date) query.append("start_date", start_date);
    if (end_date) query.append("end_date", end_date);
    if (category_id) query.append("category_id", String(category_id));
    const qs = query.toString();
    return apiGet<PDVExpense[]>(`/skypdv/finance/expenses${qs ? `?${qs}` : ""}`);
  },
  createExpense: (data: PDVExpenseCreate) => apiPost<PDVExpense>("/skypdv/finance/expenses", data),
  updateExpense: (id: number, data: PDVExpenseUpdate) =>
    apiPut<PDVExpense>(`/skypdv/finance/expenses/${id}`, data),
  deleteExpense: (id: number) => apiDelete(`/skypdv/finance/expenses/${id}`),
  downloadSummaryPdf: (start_date?: string, end_date?: string, user_id?: number, phone?: string) => {
    const query = new URLSearchParams();
    if (start_date) query.append("start_date", start_date);
    if (end_date) query.append("end_date", end_date);
    if (user_id) query.append("user_id", String(user_id));
    if (phone) query.append("phone", phone);
    const qs = query.toString();
    return apiGetBlob(`/skypdv/finance/summary.pdf${qs ? `?${qs}` : ""}`);
  },
  downloadSummaryExcel: (start_date?: string, end_date?: string, user_id?: number, phone?: string) => {
    const query = new URLSearchParams();
    if (start_date) query.append("start_date", start_date);
    if (end_date) query.append("end_date", end_date);
    if (user_id) query.append("user_id", String(user_id));
    if (phone) query.append("phone", phone);
    const qs = query.toString();
    return apiGetBlob(`/skypdv/finance/summary.xlsx${qs ? `?${qs}` : ""}`);
  },
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
  downloadSalesSummaryPdf: (startDate?: string, endDate?: string, userId?: number, phone?: string, productScope?: string) => {
    const query = new URLSearchParams();
    if (startDate) query.append("start_date", startDate);
    if (endDate) query.append("end_date", endDate);
    if (userId) query.append("user_id", String(userId));
    if (phone) query.append("phone", phone);
    if (productScope) query.append("product_scope", productScope);
    const queryString = query.toString();
    return apiGetBlob(`/skypdv/reports/sales-summary.pdf${queryString ? `?${queryString}` : ""}`);
  },
  downloadSalesSummaryExcel: (startDate?: string, endDate?: string, userId?: number, phone?: string) => {
    const query = new URLSearchParams();
    if (startDate) query.append("start_date", startDate);
    if (endDate) query.append("end_date", endDate);
    if (userId) query.append("user_id", String(userId));
    if (phone) query.append("phone", phone);
    const queryString = query.toString();
    return apiGetBlob(`/skypdv/reports/sales-summary.xlsx${queryString ? `?${queryString}` : ""}`);
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
  create: (data: CreatePaymentMethod) => apiPost<PaymentMethod>("/skypdv/payment-methods", data),
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
  getMovements: (skip = 0, limit = 100) =>
    apiGet<StockMovement[]>(`/skypdv/inventory/movements?skip=${skip}&limit=${limit}`),
  update: (productId: number, data: InventorySettingsUpdate, storageLocation = "balcao") =>
    apiPut<InventoryReport["products"][number]>(`/skypdv/inventory/${productId}?storage_location=${storageLocation}`, data),
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

// SkyWallet
export const skyWalletApi = {
  getBalance: () => apiGet<{ balance: { main_balance: number; bonus_balance: number }; user: any }>("/skypdv/skywallet/balance"),
  paySubscription: () => apiPost<any>("/skypdv/terminal/subscription/pay"),
  paySubscriptionAdvance: (months: number) => apiPost<any>("/skypdv/terminal/subscription/pay-advance", { months }),
  deposit: (amount: number, msisdn: string) => apiPost<any>("/skypdv/skywallet/deposit", { amount, msisdn }),
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
  subscription_status?: string;
  next_billing_date?: string;
  grace_period_ends_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceCustomer {
  id: number;
  terminal_id: number;
  name: string;
  nuit: string | null;
  phone: string | null;
  address: string | null;
  is_active: boolean;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateInvoiceCustomer {
  name: string;
  nuit?: string;
  phone?: string;
  address?: string;
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
  shared_source_product_id: number | null;
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
  initial_stock_location?: "balcao" | "armazem" | "congelado";
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

export interface CategorySalesSummaryItem {
  product_id: number;
  product_name: string;
  quantity_sold: string;
  total_amount: string;
}

export interface CategorySalesSummary {
  category: string;
  date: string;
  products_count: number;
  total_quantity_sold: string;
  total_amount: string;
  items: CategorySalesSummaryItem[];
}

export interface CategorySalesReportItem {
  product_id: number;
  product_name: string;
  quantity_sold: string;
  quantity_in: string;
  total_amount: string;
}

export interface CategorySalesReport {
  category: string;
  start_date: string;
  end_date: string;
  products_count: number;
  total_quantity_sold: string;
  total_quantity_in: string;
  total_amount: string;
  items: CategorySalesReportItem[];
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
  total_withdrawals?: string;
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

export type OutflowType = "product" | "cash";

export interface PDVOutflow {
  id: number;
  terminal_id: number;
  outflow_type: OutflowType | string;
  reason: string;
  destination: string | null;
  title: string;
  notes: string | null;
  product_id: number | null;
  product_name?: string | null;
  storage_location: string | null;
  quantity: string | null;
  amount: string | null;
  cash_register_id: number | null;
  expense_id: number | null;
  stock_movement_id: number | null;
  created_by: number | null;
  created_by_name?: string | null;
  created_at: string;
  is_active: boolean;
}

export interface CreatePDVOutflow {
  outflow_type: OutflowType;
  reason: string;
  destination?: string;
  title?: string;
  notes?: string;
  product_id?: number;
  storage_location?: "balcao" | "congelado" | "armazem";
  quantity?: string;
  amount?: string;
}

export interface PDVOutflowSummary {
  product_count: number;
  cash_count: number;
  product_quantity: string;
  cash_amount: string;
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
  payment_method_id: number | null;
  payment_method: string;
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
  payment_method_id: number;
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
  terminal_id: number;
  is_global: boolean;
  created_by: number | null;
  name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type PaymentMethodValue = string;
export type PaymentMethodType = PaymentMethodValue;
export type PaymentMethodName = PaymentMethodValue;

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
  product_count?: number;
  products_total_value?: string;
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

export interface InventorySettingsUpdate {
  quantity?: string;
  min_quantity?: string;
  max_quantity?: string;
  storage_location?: "balcao" | "congelado" | "armazem";
}

export interface StockTransfer {
  product_id: number;
  from_location: "balcao" | "congelado" | "armazem";
  to_location: "balcao" | "congelado" | "armazem";
  quantity: string;
  notes?: string;
}

export interface AdoptProduct {
  source_product_id: number;
  price?: string;
  cost_price?: string;
  initial_stock?: string;
}

export interface PDVTaxSummary {
  year: number;
  month: number;
  total_tax_due: string;
  is_paid: boolean;
  paid_at: string | null;
  notes: string | null;
}

export interface PDVTaxSummaryUpdate {
  is_paid: boolean;
  notes?: string;
  change_status?: "given" | "not_given";
}

export interface AccountItem {
  id: number;
  account_id: number;
  product_id: number | null;
  product_name: string;
  quantity: string;
  unit_price: string;
  subtotal: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAccountItem {
  product_id: number;
  quantity: string;
  unit_price?: string;
}

export interface UpdateAccountItem {
  quantity: string;
}

export interface CreateAccount {
  client_name: string;
  client_phone?: string;
  notes?: string;
  items?: CreateAccountItem[];
}

export interface UpdateAccount {
  client_name?: string;
  client_phone?: string;
  notes?: string;
  change_status?: "given" | "not_given";
}

export interface Account {
  id: number;
  terminal_id: number;
  linked_sale_id: number | null;
  client_name: string;
  client_phone: string | null;
  status: "open" | "closed";
  current_balance: string;
  amount_paid: string;
  change_amount: string;
  change_status: "given" | "not_given";
  opened_by_user_id: number | null;
  opened_by_name: string | null;
  closed_by_user_id: number | null;
  closed_by_name: string | null;
  notes: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  items: AccountItem[];
}

// ==========================================
// Serviços (Services)
// ==========================================

export interface PDVService {
  id: number;
  terminal_id: number;
  name: string;
  price: string;
  is_active: boolean;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePDVService {
  name: string;
  price: number;
}

export interface UpdatePDVService {
  name?: string;
  price?: number;
  is_active?: boolean;
}

export interface PDVServiceOrder {
  id: number;
  terminal_id: number;
  cash_register_id?: number | null;
  service_id?: number | null;
  service_name: string;
  service_price: string;
  quantity: string;
  discount_amount: string;
  subtotal: string;
  total: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  payment_method_id?: number | null;
  payment_method: string;
  amount_paid: string;
  change_amount: string;
  notes?: string | null;
  receipt_number?: string | null;
  status: string;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePDVServiceOrder {
  service_id: number;
  quantity?: number;
  discount_amount?: number;
  customer_name?: string;
  customer_phone?: string;
  payment_method_id: number;
  amount_paid?: number;
  notes?: string;
}

export interface PDVServiceSummary {
  period_start?: string | null;
  period_end?: string | null;
  total_orders: number;
  total_revenue: string;
  total_discounts: string;
  average_order_value: string;
  cash_revenue: string;
  card_revenue: string;
  mpesa_revenue: string;
  skywallet_revenue: string;
  mixed_revenue: string;
}

export const servicesApi = {
  list: (params?: { search?: string; is_active?: boolean; skip?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.is_active !== undefined) query.append("is_active", String(params.is_active));
    if (params?.skip) query.append("skip", String(params.skip));
    if (params?.limit) query.append("limit", String(params.limit));
    const qs = query.toString();
    return apiGet<PDVService[]>(`/skypdv/services${qs ? `?${qs}` : ""}`);
  },
  create: (data: CreatePDVService) => apiPost<PDVService>("/skypdv/services", data),
  update: (id: number, data: UpdatePDVService) => apiPut<PDVService>(`/skypdv/services/${id}`, data),
  delete: (id: number) => apiDelete<{ ok: boolean; message: string }>(`/skypdv/services/${id}`),
  downloadCatalogPdf: () => apiGetBlob("/skypdv/services/catalog.pdf"),
};

export const serviceOrdersApi = {
  create: (data: CreatePDVServiceOrder) => apiPost<PDVServiceOrder>("/skypdv/service-orders", data),
  list: (params?: {
    skip?: number;
    limit?: number;
    start_date?: string;
    end_date?: string;
    service_id?: number;
    status?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.skip) query.append("skip", String(params.skip));
    if (params?.limit) query.append("limit", String(params.limit));
    if (params?.start_date) query.append("start_date", params.start_date);
    if (params?.end_date) query.append("end_date", params.end_date);
    if (params?.service_id) query.append("service_id", String(params.service_id));
    if (params?.status) query.append("status", params.status);
    const qs = query.toString();
    return apiGet<PDVServiceOrder[]>(`/skypdv/service-orders${qs ? `?${qs}` : ""}`);
  },
  getSummary: (params?: { start_date?: string; end_date?: string }) => {
    const query = new URLSearchParams();
    if (params?.start_date) query.append("start_date", params.start_date);
    if (params?.end_date) query.append("end_date", params.end_date);
    const qs = query.toString();
    return apiGet<PDVServiceSummary>(`/skypdv/service-orders/summary${qs ? `?${qs}` : ""}`);
  },
  get: (id: number) => apiGet<PDVServiceOrder>(`/skypdv/service-orders/${id}`),
  downloadPdf: (period?: "today" | "week" | "month" | "all", startDate?: string, endDate?: string) => {
    const query = new URLSearchParams();
    if (period) query.append("period", period);
    if (startDate) query.append("start_date", startDate);
    if (endDate) query.append("end_date", endDate);
    const qs = query.toString();
    return apiGetBlob(`/skypdv/reports/service-orders.pdf${qs ? `?${qs}` : ""}`);
  },
};
