import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoicesApi, CreateSale, Sale } from "@/services/api";
import { toast } from "sonner";

export function useInvoices(params?: { start_date?: string; end_date?: string; payment_status?: string; skip?: number; limit?: number; user_id?: number }) {
  return useQuery({
    queryKey: ["invoices", params],
    queryFn: () => invoicesApi.list(params),
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSale) => invoicesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Fatura criada com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao criar fatura: ${error.message}`);
    },
  });
}

export function usePayInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => invoicesApi.pay(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Fatura marcada como paga!");
    },
    onError: (error) => {
      toast.error(`Erro ao marcar como paga: ${error.message}`);
    },
  });
}
