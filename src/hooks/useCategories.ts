import { useQuery } from "@tanstack/react-query";
import { categoriesApi } from "@/services/api";

function uniqueCategories(categories: string[]) {
  return categories.filter((category, index, array) => {
    const current = category.trim().toLowerCase();
    return current && array.findIndex((item) => item.trim().toLowerCase() === current) === index;
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        const apiCategories = await categoriesApi.list();
        return uniqueCategories(apiCategories || []);
      } catch (error) {
        console.error("Erro ao carregar categorias:", error);
        return [];
      }
    },
  });
}
