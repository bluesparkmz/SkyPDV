import { useQuery } from "@tanstack/react-query";
import { Sale } from "@/services/api";
import { fastfoodApi } from "@/services/fastfoodApi";
import { extractTabIdFromCustomerName } from "@/lib/customerNameUtils";

/**
 * Hook para obter o nome formatado do cliente de uma venda
 * Se a venda vier de uma conta fastfood, busca o nome real da conta
 */
export function useCustomerName(sale: Sale | null): string {
  if (!sale?.customer_name) {
    return "Cliente não informado";
  }

  const tabId = extractTabIdFromCustomerName(sale.customer_name);
  
  // Se não for fastfood, retorna o nome original
  if (tabId === null) {
    return sale.customer_name;
  }

  // Busca o nome real da conta
  const { data: tab, isLoading } = useQuery({
    queryKey: ["tab", tabId],
    queryFn: () => fastfoodApi.getTab(tabId),
    enabled: tabId !== null,
  });

  if (isLoading) {
    return "Carregando...";
  }

  if (tab) {
    return tab.client_name || `Mesa ${tabId}`;
  }

  // Fallback se não conseguir buscar
  return `Conta ${tabId}`;
}

