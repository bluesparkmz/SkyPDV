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
      toast.success("Venda registrada com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao registrar venda: ${error.message}`);
    },
  });
}

export function useVoidSale() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => salesApi.void(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["cashRegister"] });
      toast.success("Venda anulada com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao anular venda: ${error.message}`);
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

