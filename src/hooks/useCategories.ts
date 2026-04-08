import { useQuery } from "@tanstack/react-query";
import { categoriesApi } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

const RESTAURANT_CATEGORIES = [
  "Comida",
  "Guisados",
  "Bebidas",
  "Refrescos",
  "Sumos",
  "Cervejas",
  "Vinhos",
  "Cocktails",
  "Destilados",
  "Lanches",
  "Sobremesas",
  "Cafe da manha",
  "Pratos do dia",
  "Entradas",
  "Petiscos",
  "Chas",
  "Cafes",
  "Agua",
  "Bar",
  "Outros",
];

const STORE_CATEGORIES = [
  "Alimentos",
  "Bebidas",
  "Eletronicos",
  "Vestuario",
  "Higiene",
  "Limpeza",
  "Papelaria",
  "Farmacia",
  "Outros",
];

function uniqueCategories(categories: string[]) {
  return categories.filter((category, index, array) => {
    const current = category.trim().toLowerCase();
    return current && array.findIndex((item) => item.trim().toLowerCase() === current) === index;
  });
}

export function useCategories() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["categories", user?.user?.user_type],
    queryFn: async () => {
      const userType = (user?.user?.user_type || "").toLowerCase();
      const isRestaurantBusiness = ["restaurant", "restaurante", "cafeteria", "snackbar", "bar"].includes(userType);
      const baseCategories = isRestaurantBusiness ? RESTAURANT_CATEGORIES : STORE_CATEGORIES;

      try {
        const apiCategories = await categoriesApi.list();
        return uniqueCategories([...(apiCategories || []), ...baseCategories]);
      } catch (error) {
        console.error("Erro ao carregar categorias:", error);
        return baseCategories;
      }
    },
  });
}
