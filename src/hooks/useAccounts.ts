import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { accountsApi, CreateAccount, CreateAccountItem, PaymentMethodValue, UpdateAccount, UpdateAccountItem } from "@/services/api";
import { toast } from "sonner";

export function useAccounts(status?: "open" | "closed" | "all") {
  return useQuery({
    queryKey: ["accounts", status],
    queryFn: () => accountsApi.list(status),
  });
}

export function useAccount(accountId?: number) {
  return useQuery({
    queryKey: ["account", accountId],
    queryFn: () => accountsApi.get(accountId!),
    enabled: !!accountId,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAccount) => accountsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Conta criada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar conta");
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAccount }) => accountsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["account", variables.id] });
      toast.success("Conta atualizada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar conta");
    },
  });
}

export function useAddAccountItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, items }: { id: number; items: CreateAccountItem[] }) => accountsApi.addItems(id, items),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["account", variables.id] });
      toast.success("Produtos adicionados na conta!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao adicionar produtos");
    },
  });
}

export function useCloseAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payment_method, amount_paid, change_status }: { id: number; payment_method: PaymentMethodValue; amount_paid: string; change_status: "given" | "not_given" }) =>
      accountsApi.close(id, payment_method, amount_paid, change_status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["account", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      toast.success("Conta fechada e venda criada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao fechar conta");
    },
  });
}

export function useUpdateAccountItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, itemId, data }: { accountId: number; itemId: number; data: UpdateAccountItem }) =>
      accountsApi.updateItem(accountId, itemId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["account", variables.accountId] });
      toast.success("Item atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar item");
    },
  });
}

export function useRemoveAccountItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, itemId }: { accountId: number; itemId: number }) =>
      accountsApi.removeItem(accountId, itemId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["account", variables.accountId] });
      toast.success("Item removido com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover item");
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => accountsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Conta removida com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover conta");
    },
  });
}
