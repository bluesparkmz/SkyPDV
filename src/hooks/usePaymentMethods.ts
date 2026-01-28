import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentMethodsApi, PaymentMethod, CreatePaymentMethod, UpdatePaymentMethod } from "@/services/api";
import { toast } from "sonner";

export function usePaymentMethods() {
  return useQuery({
    queryKey: ["paymentMethods"],
    queryFn: () => paymentMethodsApi.list(),
  });
}

export function useCreatePaymentMethod() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ data, isGlobal }: { data: CreatePaymentMethod; isGlobal?: boolean }) => 
      paymentMethodsApi.create(data, isGlobal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
      toast.success("Método de pagamento criado com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao criar método de pagamento: ${error.message}`);
    },
  });
}

export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePaymentMethod }) => 
      paymentMethodsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
      toast.success("Método de pagamento atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar método de pagamento: ${error.message}`);
    },
  });
}

export function useDeletePaymentMethod() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => paymentMethodsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
      toast.success("Método de pagamento desativado com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao desativar método de pagamento: ${error.message}`);
    },
  });
}

