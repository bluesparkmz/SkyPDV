import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTerminalUsers } from "./useTerminalUsers";
import { useQuery } from "@tanstack/react-query";
import { terminalApi } from "@/services/api";

export type TerminalPermissions = {
  can_sell: boolean;
  can_open_cash_register: boolean;
  can_manage_products: boolean;
  can_manage_stock: boolean;
  can_view_reports: boolean;
  can_manage_users: boolean;
};

const ALL_TRUE: TerminalPermissions = {
  can_sell: true,
  can_open_cash_register: true,
  can_manage_products: true,
  can_manage_stock: true,
  can_view_reports: true,
  can_manage_users: true,
};

export function usePermissions(): TerminalPermissions {
  const { user: profile } = useAuth();
  const currentUserId = profile?.user?.id;

  // Terminal owner check
  const { data: terminal } = useQuery({
    queryKey: ["terminal"],
    queryFn: () => terminalApi.get(),
    enabled: !!currentUserId,
  });

  const { data: terminalUsers = [] } = useTerminalUsers();

  return useMemo(() => {
    if (!currentUserId) return ALL_TRUE; // fallback: don't block

    // Owner => full access
    if (terminal?.user_id === currentUserId) {
      return ALL_TRUE;
    }

    const userPerm = terminalUsers.find((u) => u.user_id === currentUserId);
    if (!userPerm) return ALL_TRUE; // fallback permissive

    return {
      can_sell: userPerm.can_sell ?? true,
      can_open_cash_register: userPerm.can_open_cash_register ?? true,
      can_manage_products: userPerm.can_manage_products ?? false,
      can_manage_stock: userPerm.can_manage_stock ?? false,
      can_view_reports: userPerm.can_view_reports ?? true,
      can_manage_users: userPerm.can_manage_users ?? false,
    };
  }, [currentUserId, terminal?.user_id, terminalUsers]);
}
