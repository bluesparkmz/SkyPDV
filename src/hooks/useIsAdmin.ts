import { useMemo } from "react";
import { useTerminalUsers } from "./useTerminalUsers";
import { useAuth } from "@/contexts/AuthContext";
import { terminalApi } from "@/services/api";
import { useQuery } from "@tanstack/react-query";

/**
 * Hook para verificar se o usuário atual é admin do terminal
 * Um usuário é admin se:
 * 1. É o dono do terminal (user_id do terminal === current user id)
 * 2. Tem role "admin" na lista de usuários do terminal
 */
export function useIsAdmin() {
  const { user: profileData } = useAuth();
  const currentUserId = profileData?.user?.id;
  
  // Buscar informações do terminal para verificar se é o dono
  const { data: terminal } = useQuery({
    queryKey: ["terminal"],
    queryFn: () => terminalApi.get(),
    enabled: !!currentUserId,
  });
  
  // Buscar usuários do terminal
  const { data: terminalUsers = [] } = useTerminalUsers();
  
  return useMemo(() => {
    if (!currentUserId) return false;
    
    // Verificar se é o dono do terminal
    if (terminal?.user_id === currentUserId) {
      return true;
    }
    
    // Verificar se tem role "admin" na lista de usuários
    const userInTerminal = terminalUsers.find(u => u.user_id === currentUserId);
    return userInTerminal?.role === "admin";
  }, [currentUserId, terminal?.user_id, terminalUsers]);
}

