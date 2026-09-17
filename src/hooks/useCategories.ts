import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoriesApi, type CreateCategory, type UpdateCategory } from "@/services/api";

export const CATEGORIES_QUERY_KEY = ["categories-list"] as const;

/** Hook principal: lista categorias do terminal (próprias + globais) */
export function useCategories() {
  const query = useQuery({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: () => categoriesApi.listFull(),
    staleTime: 1000 * 30,
  });

  // Extrair apenas os nomes únicos para uso em selects
  const data: string[] = Array.from(
    new Set((query.data ?? []).filter((c) => c.is_active).map((c) => c.name))
  ).sort();

  return {
    data,
    categories: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

/** Hook: criar nova categoria */
export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategory) => categoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
  });
}

/** Hook: actualizar categoria */
export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCategory }) =>
      categoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
  });
}

/** Hook: eliminar/desativar categoria */
export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
  });
}
