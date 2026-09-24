import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { salesApi, CreateSale, SalesParams, Sale } from "@/services/api";
import { toast } from "sonner";

export function useSales(params?: SalesParams) {
  return useQuery({
    queryKey: ["sales", params],
    queryFn: () => salesApi.list(params),
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateSale) => salesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["cashRegister"] });
      queryClient.invalidateQueries({ queryKey: ["cashRegisterHistory"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryAlertsSummary"] });
      queryClient.invalidateQueries({ queryKey: ["salesSummary"] });
      queryClient.invalidateQueries({ queryKey: ["salesByDay"] });
      queryClient.invalidateQueries({ queryKey: ["daySales"] });
      queryClient.invalidateQueries({ queryKey: ["periodicReport"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      toast.success("Venda registrada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Erro ao registrar venda.");
    },
  });
}

export function useVoidSale() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => salesApi.void(id),
    onSuccess: (voidedSale) => {
      queryClient.setQueriesData<Sale[]>({ queryKey: ["daySales"] }, (sales) =>
        sales?.filter((sale) => sale.id !== voidedSale.id)
      );
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["cashRegister"] });
      queryClient.invalidateQueries({ queryKey: ["cashRegisterHistory"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryAlertsSummary"] });
      queryClient.invalidateQueries({ queryKey: ["salesSummary"] });
      queryClient.invalidateQueries({ queryKey: ["salesByDay"] });
      queryClient.invalidateQueries({ queryKey: ["daySales"] });
      queryClient.invalidateQueries({ queryKey: ["periodicReport"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      toast.success("Venda anulada com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao anular venda: ${error.message}`);
    },
  });
}

export function useUpdateSalePaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, paymentMethodId }: { id: number; paymentMethodId: number }) =>
      salesApi.updatePaymentMethod(id, paymentMethodId),
    onSuccess: (updatedSale) => {
      queryClient.setQueriesData<Sale[]>({ queryKey: ["daySales"] }, (sales) =>
        sales?.map((sale) => sale.id === updatedSale.id ? { ...sale, ...updatedSale } : sale)
      );
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["cashRegister"] });
      queryClient.invalidateQueries({ queryKey: ["salesSummary"] });
      queryClient.invalidateQueries({ queryKey: ["salesByDay"] });
      queryClient.invalidateQueries({ queryKey: ["daySales"] });
      queryClient.invalidateQueries({ queryKey: ["periodicReport"] });
      toast.success("Método de pagamento atualizado.");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Erro ao atualizar o método de pagamento.");
    },
  });
}

export function useSale(id: number) {
  return useQuery({
    queryKey: ["sale", id],
    queryFn: () => salesApi.get(id),
    enabled: !!id,
  });
}
