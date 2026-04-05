import type { CartItem } from "@/types/product";

const IVA_RATE = 0.16;

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
