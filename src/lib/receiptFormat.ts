import type { Account, Terminal } from "@/services/api";
import type { CartItem } from "@/types/product";

const IVA_RATE = 0.16;

function formatMoney(value: string | number): string {
  return `${Number(value || 0).toFixed(2)} MT`;
}

export function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    cash: "Cash",
    bci_pos: "BCI POS",
    card: "BCI POS",
    emola: "E-Mola",
    skywallet: "E-Mola",
    mpesa: "M-pesa",
  };
  return labels[method] || method;
}

/** Recibo de venda em espera / pendente (impressão via plugin WS). */
export function formatParkedSaleReceipt(
  items: CartItem[],
  opts: { customerName?: string; label?: string; createdAt?: string }
): string {
  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const subtotal = total / (1 + IVA_RATE);
  const ivaAmount = total - subtotal;
  const date = opts.createdAt
    ? new Date(opts.createdAt).toLocaleString("pt-MZ")
    : new Date().toLocaleString("pt-MZ");

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
    lines.push(item.name);
    lines.push(`  ${item.quantity}x ${item.price.toFixed(2)} MT = ${itemTotal} MT`);
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

export function formatAccountReceipt(
  account: Account,
  opts?: {
    terminal?: Terminal | null;
    paymentMethod?: string;
    amountPaid?: number;
    printedAt?: string;
  }
): string {
  const total = Number(account.current_balance || 0);
  const subtotal = total / (1 + IVA_RATE);
  const ivaAmount = total - subtotal;
  const establishmentName = opts?.terminal?.name?.trim() || "ESTABELECIMENTO";
  const printedAt = opts?.printedAt
    ? new Date(opts.printedAt).toLocaleString("pt-MZ")
    : new Date().toLocaleString("pt-MZ");

  const lines: string[] = [];
  lines.push("=".repeat(42));
  lines.push(establishmentName.toUpperCase());
  lines.push("RECIBO DE FECHO DE CONTA");
  lines.push("=".repeat(42));
  lines.push(`Data: ${printedAt}`);
  lines.push(`Conta: ${account.client_name}`);
  lines.push(`Referencia: #${account.id}`);
  if (account.client_phone) lines.push(`Telefone: ${account.client_phone}`);
  if (account.opened_by_name) lines.push(`Caixa abertura: ${account.opened_by_name}`);
  if (account.closed_by_name) lines.push(`Caixa fechamento: ${account.closed_by_name}`);
  if (account.created_at) {
    lines.push(`Aberta em: ${new Date(account.created_at).toLocaleString("pt-MZ")}`);
  }
  if (account.closed_at) {
    lines.push(`Fechada em: ${new Date(account.closed_at).toLocaleString("pt-MZ")}`);
  }
  if (opts?.paymentMethod) {
    lines.push(`Pagamento: ${getPaymentMethodLabel(opts.paymentMethod)}`);
  }
  if (typeof opts?.amountPaid === "number") {
    lines.push(`Valor Pago: ${formatMoney(opts.amountPaid)}`);
    const change = opts.amountPaid - total;
    if (change > 0) {
      lines.push(`Troco: ${formatMoney(change)}`);
    }
  }
  lines.push("-".repeat(42));
  lines.push("ITENS:");
  lines.push("-".repeat(42));
  account.items.forEach((item) => {
    lines.push(item.product_name);
    lines.push(`  ${Number(item.quantity)}x ${formatMoney(item.unit_price)} = ${formatMoney(item.subtotal)}`);
  });
  lines.push("-".repeat(42));
  lines.push(`Subtotal: ${formatMoney(subtotal)}`);
  lines.push(`IVA (16%): ${formatMoney(ivaAmount)}`);
  lines.push("=".repeat(42));
  lines.push(`TOTAL: ${formatMoney(total)}`);
  lines.push("=".repeat(42));
  lines.push("Venda confirmada no fecho da conta.");
  lines.push("");
  return lines.join("\n");
}

export function formatKitchenTicket(
  account: Account,
  items: Account["items"],
  opts?: { terminal?: Terminal | null; printedAt?: string; ticketNumber?: number }
): string {
  const establishmentName = opts?.terminal?.name?.trim() || "ESTABELECIMENTO";
  const printedAt = opts?.printedAt
    ? new Date(opts.printedAt).toLocaleString("pt-MZ")
    : new Date().toLocaleString("pt-MZ");

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
    lines.push(item.product_name);
    lines.push(`  Qtd: ${Number(item.quantity)}`);
  });
  lines.push("=".repeat(42));
  lines.push("");
  return lines.join("\n");
}

export function formatAccountItemsReceipt(
  account: Account,
  opts?: { terminal?: Terminal | null; printedAt?: string }
): string {
  const establishmentName = opts?.terminal?.name?.trim() || "ESTABELECIMENTO";
  const printedAt = opts?.printedAt
    ? new Date(opts.printedAt).toLocaleString("pt-MZ")
    : new Date().toLocaleString("pt-MZ");

  const lines: string[] = [];
  lines.push("=".repeat(42));
  lines.push(establishmentName.toUpperCase());
  lines.push("CONTA ABERTA - PRODUTOS");
  lines.push("=".repeat(42));
  lines.push(`Data: ${printedAt}`);
  lines.push(`Conta: ${account.client_name}`);
  lines.push(`Referencia: #${account.id}`);
  if (account.opened_by_name) lines.push(`Caixa: ${account.opened_by_name}`);
  lines.push("-".repeat(42));
  lines.push("ITENS:");
  lines.push("-".repeat(42));
  account.items.forEach((item) => {
    lines.push(item.product_name);
    lines.push(`  ${Number(item.quantity)}x ${formatMoney(item.unit_price)}`);
  });
  lines.push("=".repeat(42));
  lines.push("");
  return lines.join("\n");
}
