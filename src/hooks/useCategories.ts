import { useQuery } from "@tanstack/react-query";
import { categoriesApi } from "@/services/api";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        const apiCategories = await categoriesApi.list();
        // Categorias padrão hardcoded para garantir que sempre existam opções
        const defaultCategories = [
          "Alimentos",
          "Bebidas",
          "Eletrônicos",
          "Vestuário",
          "Higiene",
          "Limpeza",
          "Papelaria",
          "Farmácia",
          "Outros"
        ];

        // Combinar e remover duplicatas (case insensitive)
        const allCategories = [...new Set([...(apiCategories || []), ...defaultCategories])];
        return allCategories.sort();
      } catch (error) {
        console.error("Erro ao carregar categorias:", error);
        // Fallback apenas com as hardcoded em caso de erro
        return [
          "Alimentos",
          "Bebidas",
          "Eletrônicos",
          "Vestuário",
          "Higiene",
          "Limpeza",
          "Outros"
        ];
      }
    },
  });
}

