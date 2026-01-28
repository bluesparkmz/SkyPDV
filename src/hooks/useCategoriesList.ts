import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesApi, CreateCategory, UpdateCategory } from "@/services/api";
import { toast } from "sonner";

export function useCategoriesList() {
    return useQuery({
        queryKey: ["categories-list"],
        queryFn: () => categoriesApi.listFull(),
    });
}

export function useCreateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { data: CreateCategory; isGlobal?: boolean }) =>
            categoriesApi.create(data.data, data.isGlobal),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories-list"] });
            queryClient.invalidateQueries({ queryKey: ["categories"] }); // Invalidate simple list too
            toast.success("Categoria criada com sucesso");
        },
        onError: (error: any) => {
            toast.error(error.message || "Erro ao criar categoria");
        },
    });
}

export function useUpdateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { id: number; data: UpdateCategory }) =>
            categoriesApi.update(data.id, data.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories-list"] });
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            toast.success("Categoria atualizada com sucesso");
        },
        onError: (error: any) => {
            toast.error(error.message || "Erro ao atualizar categoria");
        },
    });
}

export function useDeleteCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => categoriesApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories-list"] });
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            toast.success("Categoria removida com sucesso");
        },
        onError: (error: any) => {
            toast.error(error.message || "Erro ao remover categoria");
        },
    });
}

export function useAdoptCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => categoriesApi.adopt(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories-list"] });
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            toast.success("Categoria adotada com sucesso");
        },
        onError: (error: any) => {
            toast.error(error.message || "Erro ao adotar categoria");
        },
    });
}
