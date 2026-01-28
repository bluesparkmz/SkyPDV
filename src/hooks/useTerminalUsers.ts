import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ApiError,
  terminalUsersApi,
  PDVTerminalUser,
  CreatePDVTerminalUser,
  UpdatePDVTerminalUser,
} from "@/services/api";
import { toast } from "sonner";

function getFriendlyAddUserErrorMessage(error: unknown): string | undefined {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return "Este usuário não tem conta na SkyVenda. Peça para criar uma conta e tente novamente.";
    }
    const msg = (error.message || "").toLowerCase();
    if (
      msg.includes("not found") ||
      msg.includes("não encontrado") ||
      msg.includes("nao encontrado") ||
      msg.includes("user") && msg.includes("found")
    ) {
      return "Este usuário não tem conta na SkyVenda. Peça para criar uma conta e tente novamente.";
    }
  }
  if (typeof error === "object" && error && "message" in (error as any)) {
    const msg = String((error as any).message || "").toLowerCase();
    if (msg.includes("not found") || msg.includes("não encontrado") || msg.includes("nao encontrado")) {
      return "Este usuário não tem conta na SkyVenda. Peça para criar uma conta e tente novamente.";
    }
  }
  return undefined;
}

export function useTerminalUsers() {
  return useQuery({
    queryKey: ["terminalUsers"],
    queryFn: () => terminalUsersApi.list(),
  });
}

export function useAddTerminalUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePDVTerminalUser) => terminalUsersApi.add(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["terminalUsers"] });
      toast.success("Usuário adicionado ao terminal com sucesso!");
    },
    onError: (error: any) => {
      const friendly = getFriendlyAddUserErrorMessage(error);
      toast.error(friendly || error.message || "Erro ao adicionar usuário ao terminal");
    },
  });
}

export function useUpdateTerminalUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePDVTerminalUser }) =>
      terminalUsersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["terminalUsers"] });
      toast.success("Permissões atualizadas com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar permissões");
    },
  });
}

export function useRemoveTerminalUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => terminalUsersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["terminalUsers"] });
      toast.success("Usuário removido do terminal com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover usuário do terminal");
    },
  });
}

