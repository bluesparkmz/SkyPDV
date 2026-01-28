import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fastfoodApi, OrderCreate, TabCreate } from "@/services/fastfoodApi";
import { toast } from "sonner";

export function useRestaurants() {
    return useQuery({
        queryKey: ["restaurants"],
        queryFn: () => fastfoodApi.getMyRestaurants(),
    });
}

export function useTables(restaurantId: number) {
    return useQuery({
        queryKey: ["tables", restaurantId],
        queryFn: () => fastfoodApi.getTables(restaurantId),
        enabled: !!restaurantId,
    });
}

export function useTabs(restaurantId: number, status?: "open" | "closed") {
    return useQuery({
        queryKey: ["tabs", restaurantId, status],
        queryFn: () => fastfoodApi.getTabs(restaurantId, status),
        enabled: !!restaurantId,
    });
}

export function useCreateTab() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ restaurantId, data }: { restaurantId: number; data: TabCreate }) =>
            fastfoodApi.createTab(restaurantId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["tabs", variables.restaurantId] });
            toast.success("Conta aberta com sucesso!");
        },
        onError: (error: any) => {
            toast.error(`Erro ao abrir conta: ${error.message}`);
        },
    });
}

export function useCreateRestaurantOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: OrderCreate) => fastfoodApi.createOrder(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["tables", variables.restaurant_id] });
            queryClient.invalidateQueries({ queryKey: ["tabs", variables.restaurant_id] });
            toast.success("Pedido enviado com sucesso!");
        },
        onError: (error: any) => {
            toast.error(`Erro ao enviar pedido: ${error.message}`);
        },
    });
}
