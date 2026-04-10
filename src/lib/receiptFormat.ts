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
    emola: "E-Mola",
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
