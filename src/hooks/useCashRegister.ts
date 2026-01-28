import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cashRegisterApi, OpenCashRegister, CloseCashRegister, CashRegister } from "@/services/api";
import { toast } from "sonner";

export function useCashRegister() {
  return useQuery({
    queryKey: ["cashRegister", "current"],
    queryFn: () => cashRegisterApi.getCurrent(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useOpenCashRegister() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: OpenCashRegister) => cashRegisterApi.open(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashRegister"] });
      toast.success("Caixa aberto com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao abrir caixa: ${error.message}`);
    },
  });
}

export function useCloseCashRegister() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CloseCashRegister) => cashRegisterApi.close(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashRegister"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Caixa fechado com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao fechar caixa: ${error.message}`);
    },
  });
}

