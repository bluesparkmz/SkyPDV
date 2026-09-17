// Categorias fixas do sistema — sem necessidade de backend
export const STATIC_CATEGORIES = [
  "Alimentos",
  "Bebidas",
  "Refrescos",
  "Cozinha",
  "Cafetaria",
  "Eletrodoméstico",
  "Roupa",
  "Outros"
];

export function useCategories() {
  return {
    data: STATIC_CATEGORIES,
    isLoading: false,
    isError: false,
  };
}
