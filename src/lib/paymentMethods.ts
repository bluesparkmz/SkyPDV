/**
 * Payment methods are company data. There are intentionally no default
 * banks, wallets or cash options in the frontend.
 */
export interface PaymentMethodOption {
  value: string;
  label: string;
}

// Compatibility for old screens: an empty list is never a fallback catalog.
export const LOCAL_PAYMENT_METHODS: PaymentMethodOption[] = [];

/** Shows the exact saved value, including historical sales. */
export function getPaymentMethodLabel(method: string | undefined | null): string {
  return String(method || "Não informado").trim() || "Não informado";
}

/** @deprecated New sales must send payment_method_id returned by the API. */
export function mapToApiPaymentMethod(method: string): string {
  return method;
}
