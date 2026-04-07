import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi, Product, CreateProduct, ProductsParams, UpdateProduct, AdoptProduct } from "@/services/api";
import { toast } from "sonner";
import { isEmoji } from "@/lib/imageUtils";

export function useProducts(params?: ProductsParams) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => productsApi.list(params),
  });
}

export function useCatalogProducts(params?: { search?: string; category?: string; business_type?: "loja" | "restaurante"; skip?: number; limit?: number }) {
  return useQuery({
    queryKey: ["catalogProducts", params],
    queryFn: () => productsApi.listCatalog(params),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateProduct) => {
      // Garantir que sempre tenha um emoji padrão se não houver emoji nem imagem
      const productData = { ...data };
      
      // Se não tem emoji nem imagem, usar emoji padrão
      if (!productData.emoji && !productData.image) {
        productData.emoji = "📦";
      } 
      // Se tem imagem mas não tem emoji, verificar se a imagem é um emoji
      else if (!productData.emoji && productData.image) {
        if (!isEmoji(productData.image)) {
          // Se a imagem não é um emoji (é uma URL/caminho), usar emoji padrão como fallback
          productData.emoji = "📦";
        } else {
          // Se a imagem é um emoji, usar como emoji também
          productData.emoji = productData.image;
        }
      }
      // Se tem emoji mas não tem imagem, está ok
      
      return productsApi.create(productData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto criado com sucesso!");
    },
    onError: (error) => {
      // Se o erro for CORS/network após criação bem-sucedida, não mostrar erro ao utilizador
      const isLikelyCorsError = error.message?.toLowerCase().includes('failed to fetch') ||
                               error.message?.toLowerCase().includes('cors') ||
                               error.message?.toLowerCase().includes('network error') ||
                               error.message?.toLowerCase().includes('access-control-allow-origin');
      
      if (!isLikelyCorsError) {
        toast.error(`Erro ao criar produto: ${error.message}`);
      }
      // Mesmo em caso de CORS, invalidar cache para o produto aparecer
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProduct }) => 
      productsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar produto: ${error.message}`);
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto desativado com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao desativar produto: ${error.message}`);
    },
  });
}

export function useAdoptProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AdoptProduct) => productsApi.adopt(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["catalogProducts"] });
      toast.success("Produto adicionado a sua conta com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao adicionar produto: ${error.message}`);
    },
  });
}

