import type { Account, Sale, Terminal } from "@/services/api";
import type { CartItem } from "@/types/product";
import { getPaymentMethodLabel } from "@/lib/paymentMethods";

export { getPaymentMethodLabel };

const IVA_RATE = 0.16;

const formatMoney = (value: string | number | null | undefined): string =>
  `${Number(value || 0).toFixed(2)} MT`;

const formatMozambiqueDateTime = (value?: string): string => {
  // O backend grava datas UTC sem o sufixo "Z". Sem ele, o navegador trata a
  // data como hora local e deixa de aplicar corretamente o UTC+2 de Moçambique.
  const normalized = value?.trim().replace(" ", "T");
  const date = normalized
    ? new Date(/(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized) ? normalized : `${normalized}Z`)
    : new Date();

  return date.toLocaleString("pt-MZ", {
    timeZone: "Africa/Maputo",
  });
};

const getSalePaymentLabel = (sale: Sale): string => {
  const savedLabel = sale.notes?.match(/(?:M[eé]todo|Método)\s*:\s*([^\n)]+)/i)?.[1]?.trim();
  return savedLabel || getPaymentMethodLabel(sale.payment_method);
};

/** Recibo de venda em espera / pendente (impressão via plugin WS). */
export function formatParkedSaleReceipt(
  items: CartItem[],
  opts: { customerName?: string; label?: string; createdAt?: string }
): string {
  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const subtotal = total / (1 + IVA_RATE);
  const ivaAmount = total - subtotal;
  const date = formatMozambiqueDateTime(opts.createdAt);

  const lines: string[] = [];
  lines.push("=".repeat(42));
  lines.push("      SKYPDV - VENDA EM ESPERA");
  lines.push("=".repeat(42));
  lines.push(`Data: ${date}`);
  if (opts.label) lines.push(`Referência: ${opts.label}`);
  if (opts.customerName) lines.push(`Cliente: ${opts.customerName}`);
  lines.push("-".repeat(42));
  lines.push("ITENS:");
  lines.push("-".repeat(42));
  items.forEach((item) => {
    const itemTotal = (item.price * item.quantity).toFixed(2);
    const isKg = item.allow_decimal_quantity || !Number.isInteger(item.quantity);
    const qtyStr = isKg ? `${parseFloat(item.quantity.toFixed(3))} Kg` : `${item.quantity}x`;
    lines.push(item.name);
    lines.push(`  ${qtyStr} ${item.price.toFixed(2)} MT = ${itemTotal} MT`);
  });
  lines.push("-".repeat(42));
  lines.push(`Subtotal: ${subtotal.toFixed(2)} MT`);
  lines.push(`IVA (16%): ${ivaAmount.toFixed(2)} MT`);
  lines.push("=".repeat(42));
  lines.push(`TOTAL: ${total.toFixed(2)} MT`);
  lines.push("=".repeat(42));
  lines.push("Estado: EM ESPERA");
  lines.push("Apresente este comprovativo para finalizar.");
  lines.push("=".repeat(42));
  lines.push("");
  return lines.join("\n");
}

/** Recibo térmico de venda concluída (POS) — mesmo layout da finalização no caixa. */
export function formatSaleReceipt(
  sale: Sale,
  opts?: { terminal?: Terminal | null; printedAt?: string }
): string {
  const receiptSettings = (opts?.terminal?.settings as Record<string, unknown> | null) || {};
  const companyName = String(
    receiptSettings.receipt_company_name || opts?.terminal?.name || "SKYPDV - SISTEMA DE VENDAS"
  ).trim();
  const companyNuit = String(receiptSettings.receipt_nuit || "").trim();
  const companyContacts = String(receiptSettings.receipt_contacts || opts?.terminal?.phone || "").trim();
  const companyAddress = String(receiptSettings.receipt_address || opts?.terminal?.address || "").trim();
  const footerMessage = String(receiptSettings.receipt_footer || "OBRIGADO PELA PREFERENCIA!").trim();

  const date = formatMozambiqueDateTime(opts?.printedAt || sale.created_at);

  const total = Number(sale.total || 0);
  const subtotal = sale.subtotal ? Number(sale.subtotal) : total / (1 + IVA_RATE);
  const taxAmount = sale.tax_amount ? Number(sale.tax_amount) : total - subtotal;
  const paidAmount = Number(sale.amount_paid || total);
  const changeAmount =
    sale.change_amount !== undefined && sale.change_amount !== null
      ? Number(sale.change_amount)
      : Math.max(paidAmount - total, 0);
  const receiptNumber = sale.receipt_number || String(sale.id);

  const lines: string[] = [];

  lines.push("=".repeat(42));
  lines.push(`        ${companyName.toUpperCase()}`);
  lines.push("=".repeat(42));
  if (companyNuit) lines.push(`NUIT: ${companyNuit}`);
  if (companyContacts) lines.push(`Contacto: ${companyContacts}`);
  if (companyAddress) lines.push(`Endereco: ${companyAddress}`);
  lines.push(`Data: ${date}`);
  lines.push(`Recibo: #${receiptNumber}`);
  lines.push("-".repeat(42));
  lines.push("-".repeat(42));
  lines.push("PRODUTOS:");
  lines.push("-".repeat(42));

  (sale.items || []).forEach((item) => {
    const qty = Number(item.quantity);
    const isKg = !Number.isInteger(qty);
    const qtyLabel = isKg ? `${parseFloat(qty.toFixed(3))}Kg` : `${qty}x`;
    const unitPrice = Number(item.unit_price);
    const itemTotal = Number(item.subtotal || unitPrice * qty);
    lines.push(item.product_name);
    lines.push(`  ${qtyLabel} ${unitPrice.toFixed(2)} MT = ${itemTotal.toFixed(2)} MT`);
  });

  lines.push("-".repeat(42));
  lines.push(`Subtotal: ${subtotal.toFixed(2)} MT`);
  lines.push(`IVA (16%): ${taxAmount.toFixed(2)} MT`);
  lines.push("=".repeat(42));
  lines.push(`TOTAL: ${total.toFixed(2)} MT`);
  lines.push("=".repeat(42));
  lines.push(`Pagamento: ${getSalePaymentLabel(sale)}`);
  lines.push(`Valor Pago: ${paidAmount.toFixed(2)} MT`);
  lines.push(`Troco: ${changeAmount.toFixed(2)} MT`);
  lines.push("=".repeat(42));
  lines.push(`        ${footerMessage.toUpperCase()}`);
  lines.push("=".repeat(42));
  lines.push("");
  lines.push("");

  return lines.join("\n");
}

export function formatAccountReceipt(
  account: Account,
  opts?: {
    terminal?: Terminal | null;
    paymentMethod?: string;
    amountPaid?: number;
    printedAt?: string;
  }
): string {
  const receiptSettings = (opts?.terminal?.settings as Record<string, unknown> | null) || {};
  const companyName = String(receiptSettings.receipt_company_name || opts?.terminal?.name || "SKYPDV - SISTEMA DE VENDAS").trim();
  const companyNuit = String(receiptSettings.receipt_nuit || "").trim();
  const companyContacts = String(receiptSettings.receipt_contacts || opts?.terminal?.phone || "").trim();
  const companyAddress = String(receiptSettings.receipt_address || opts?.terminal?.address || "").trim();
  const footerMessage = String(receiptSettings.receipt_footer || "OBRIGADO PELA PREFERENCIA!").trim();
  const total = Number(account.current_balance || 0);
  const subtotal = total / (1 + IVA_RATE);
  const ivaAmount = total - subtotal;
  const paidAmount = typeof opts?.amountPaid === "number" && Number.isFinite(opts.amountPaid)
    ? opts.amountPaid
    : null;
  const changeAmount = paidAmount !== null ? Math.max(paidAmount - total, 0) : null;
  const printedAt = formatMozambiqueDateTime(opts?.printedAt);

  const lines: string[] = [];
  lines.push("=".repeat(42));
  lines.push(companyName.toUpperCase());
  lines.push("RECIBO DE FECHO DE CONTA");
  lines.push("=".repeat(42));
  if (companyNuit) lines.push(`NUIT: ${companyNuit}`);
  if (companyContacts) lines.push(`Contacto: ${companyContacts}`);
  if (companyAddress) lines.push(`Endereco: ${companyAddress}`);
  lines.push(`Data: ${printedAt}`);
  lines.push(`Conta: ${account.client_name}`);
  lines.push(`Referencia: #${account.id}`);
  if (account.client_phone) lines.push(`Telefone: ${account.client_phone}`);
  if (account.opened_by_name) lines.push(`Caixa abertura: ${account.opened_by_name}`);
  if (account.closed_by_name) lines.push(`Caixa fechamento: ${account.closed_by_name}`);
  if (account.created_at) {
    lines.push(`Aberta em: ${formatMozambiqueDateTime(account.created_at)}`);
  }
  if (account.closed_at) {
    lines.push(`Fechada em: ${formatMozambiqueDateTime(account.closed_at)}`);
  }
  if (opts?.paymentMethod) {
    lines.push(`Pagamento: ${getPaymentMethodLabel(opts.paymentMethod)}`);
  }
  if (paidAmount !== null) {
    lines.push(`Valor Pago: ${formatMoney(paidAmount)}`);
    lines.push(`Troco: ${formatMoney(changeAmount ?? 0)}`);
  }
  if (account.change_status) {
    lines.push(`Troco: ${account.change_status === "given" ? "Entregue" : "Nao entregue"}`);
  }
  lines.push("-".repeat(42));
  lines.push("ITENS:");
  lines.push("-".repeat(42));
  account.items.forEach((item) => {
    const qty = Number(item.quantity);
    const isKg = !Number.isInteger(qty);
    const qtyStr = isKg ? `${parseFloat(qty.toFixed(3))} Kg` : `${qty.toFixed(0)}x`;
    lines.push(item.product_name);
    lines.push(`  ${qtyStr} ${formatMoney(item.unit_price)} = ${formatMoney(item.subtotal)}`);
  });
  lines.push("-".repeat(42));
  lines.push(`Subtotal: ${formatMoney(subtotal)}`);
  lines.push(`IVA (16%): ${formatMoney(ivaAmount)}`);
  lines.push("=".repeat(42));
  lines.push(`TOTAL: ${formatMoney(total)}`);
  lines.push("=".repeat(42));
  lines.push(footerMessage.toUpperCase());
  lines.push("");
  return lines.join("\n");
}

export function formatKitchenTicket(
  account: Account,
  items: Account["items"],
  opts?: { terminal?: Terminal | null; printedAt?: string; ticketNumber?: number }
): string {
  const establishmentName = opts?.terminal?.name?.trim() || "ESTABELECIMENTO";
  const printedAt = formatMozambiqueDateTime(opts?.printedAt);

  const lines: string[] = [];
  lines.push("=".repeat(42));
  lines.push(establishmentName.toUpperCase());
  lines.push("PEDIDO COZINHA");
  lines.push("=".repeat(42));
  lines.push(`Data: ${printedAt}`);
  if (opts?.ticketNumber) {
    lines.push(`Pedido: #${opts.ticketNumber}`);
  }
  lines.push(`Conta: ${account.client_name}`);
  lines.push(`Referencia: #${account.id}`);
  if (account.opened_by_name) lines.push(`Caixa: ${account.opened_by_name}`);
  lines.push("-".repeat(42));
  lines.push("ITENS PARA COZINHA:");
  lines.push("-".repeat(42));
  items.forEach((item) => {
    const qty = Number(item.quantity);
    const isKg = !Number.isInteger(qty);
    const qtyStr = isKg ? `${parseFloat(qty.toFixed(3))} Kg` : `${qty.toFixed(0)}x`;
    lines.push(item.product_name);
    lines.push(`  Qtd: ${qtyStr}`);
  });
  lines.push("=".repeat(42));
  lines.push("");
  return lines.join("\n");
}

export function formatAccountItemsReceipt(
  account: Account,
  opts?: { terminal?: Terminal | null; printedAt?: string }
): string {
  const receiptSettings = (opts?.terminal?.settings as Record<string, unknown> | null) || {};
  const companyName = String(receiptSettings.receipt_company_name || opts?.terminal?.name || "SKYPDV - SISTEMA DE VENDAS").trim();
  const companyNuit = String(receiptSettings.receipt_nuit || "").trim();
  const companyContacts = String(receiptSettings.receipt_contacts || opts?.terminal?.phone || "").trim();
  const companyAddress = String(receiptSettings.receipt_address || opts?.terminal?.address || "").trim();
  const footerMessage = String(receiptSettings.receipt_footer || "OBRIGADO PELA PREFERENCIA!").trim();
  const printedAt = formatMozambiqueDateTime(opts?.printedAt);
  const total = Number(account.current_balance || 0);
  const subtotal = total / (1 + IVA_RATE);
  const ivaAmount = total - subtotal;

  const lines: string[] = [];
  lines.push("=".repeat(42));
  lines.push(companyName.toUpperCase());
  lines.push("CONTA ABERTA - PRODUTOS");
  lines.push("=".repeat(42));
  if (companyNuit) lines.push(`NUIT: ${companyNuit}`);
  if (companyContacts) lines.push(`Contacto: ${companyContacts}`);
  if (companyAddress) lines.push(`Endereco: ${companyAddress}`);
  lines.push(`Data: ${printedAt}`);
  lines.push(`Conta: ${account.client_name}`);
  lines.push(`Referencia: #${account.id}`);
  if (account.opened_by_name) lines.push(`Caixa: ${account.opened_by_name}`);
  lines.push("-".repeat(42));
  lines.push("ITENS:");
  lines.push("-".repeat(42));
  account.items.forEach((item) => {
    const qty = Number(item.quantity);
    const isKg = !Number.isInteger(qty);
    const qtyStr = isKg ? `${parseFloat(qty.toFixed(3))} Kg` : `${qty.toFixed(0)}x`;
    lines.push(item.product_name);
    lines.push(`  ${qtyStr} ${formatMoney(item.unit_price)}`);
  });
  lines.push("-".repeat(42));
  lines.push(`Subtotal: ${formatMoney(subtotal)}`);
  lines.push(`IVA (16%): ${formatMoney(ivaAmount)}`);
  lines.push("=".repeat(42));
  lines.push(`TOTAL: ${formatMoney(total)}`);
  lines.push("=".repeat(42));
  lines.push(footerMessage.toUpperCase());
  lines.push("");
  return lines.join("\n");
}
