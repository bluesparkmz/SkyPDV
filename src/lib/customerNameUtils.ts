import { Sale } from "@/services/api";

/**
 * Extrai o ID da conta do nome do cliente se for do formato "fastfood" + ID
 */
export function extractTabIdFromCustomerName(customerName: string | null): number | null {
  if (!customerName) return null;
  
  const fastfoodMatch = customerName.match(/^fastfood\s*(\d+)$/i);
  if (fastfoodMatch) {
    return parseInt(fastfoodMatch[1]);
  }
  
  return null;
}

/**
 * Retorna o nome formatado do cliente
 * Se o nome começar com "fastfood" + ID, retorna um placeholder
 * que será substituído pelo hook useCustomerName
 */
export function getCustomerNameDisplay(sale: Sale): string {
  if (!sale.customer_name) {
    return "Cliente não informado";
  }

  // Verifica se é fastfood + ID
  const tabId = extractTabIdFromCustomerName(sale.customer_name);
  if (tabId !== null) {
    // Retorna placeholder que será substituído pelo hook
    return ""; // O hook vai substituir
  }

  // Se não for fastfood, retorna o nome original
  return sale.customer_name;
}

