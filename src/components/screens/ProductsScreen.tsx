import { useMemo, useState } from "react";
import {
  Box24Regular,
  Delete24Regular,
  Edit24Regular,
  Filter24Regular,
  Add24Regular,
  Print24Regular,
  Search24Regular,
} from "@fluentui/react-icons";
import { toast } from "sonner";

import { AdoptProductDialog } from "@/components/AdoptProductDialog";
import { DeleteProductDialog } from "@/components/DeleteProductDialog";
import { ProductDialog } from "@/components/ProductDialog";
import { ProductImage } from "@/components/ProductImage";
import { useCategories } from "@/hooks/useCategories";
import { useCreateProduct, useDeleteProduct, useProducts, useUpdateProduct } from "@/hooks/useProducts";
import { dashboardApi, Product } from "@/services/api";

const DEFAULT_EMOJI = "📦";

export function ProductsScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAdoptDialogOpen, setIsAdoptDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { data: products = [], isLoading: productsLoading } = useProducts({
    search: searchQuery || undefined,
    category: selectedCategory !== "all" ? selectedCategory : undefined,
    limit: 1000,
  });
  const { data: categoriesList = [] } = useCategories();

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      return matchesSearch && matchesCategory && product.is_active;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleSaveProduct = async (productData: {
    id?: string | number;
    name: string;
    price: number;
    category: string;
    initialStock?: number;
    image?: string;
    emoji?: string;
    is_fastfood?: boolean;
    track_stock?: boolean;
  }) => {
    try {
      if (productData.id) {
        await updateProduct.mutateAsync({
          id: typeof productData.id === "string" ? parseInt(productData.id, 10) : productData.id,
          data: {
            name: productData.name,
            price: productData.price.toString(),
            category: productData.category,
            emoji: productData.emoji,
            image: productData.image,
            is_fastfood: productData.is_fastfood,
            track_stock: productData.track_stock,
          },
        });
      } else {
        await createProduct.mutateAsync({
          name: productData.name,
          price: productData.price.toString(),
          category: productData.category,
          emoji: productData.emoji || DEFAULT_EMOJI,
          image: productData.image,
          initial_stock: productData.track_stock === false ? "0" : (productData.initialStock || 0).toString(),
          track_stock: productData.track_stock !== false,
          is_fastfood: productData.is_fastfood || false,
        });
      }

      setIsDialogOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    try {
      await deleteProduct.mutateAsync(selectedProduct.id);
      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error("Erro ao deletar produto:", error);
    }
  };

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const openCreateDialog = () => {
    setSelectedProduct(null);
    setIsDialogOpen(true);
  };

  const handlePrintProducts = async () => {
    try {
      const { blob, filename } = await dashboardApi.downloadProductsPdf();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename || "products.pdf";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error(error?.message || "Falha ao gerar o PDF");
    }
  };

  const productForDialog = selectedProduct
    ? {
        id: selectedProduct.id.toString(),
        name: selectedProduct.name,
        price: parseFloat(selectedProduct.price),
        category: selectedProduct.category || "",
        image: selectedProduct.image || selectedProduct.emoji || DEFAULT_EMOJI,
        emoji: selectedProduct.emoji || DEFAULT_EMOJI,
        is_fastfood: selectedProduct.is_fastfood || false,
        track_stock: selectedProduct.track_stock !== false,
      }
    : null;

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="z-10 border-b border-border bg-background/80 p-3 backdrop-blur-md md:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white md:h-10 md:w-10">
              <Box24Regular className="h-5 w-5 md:h-6 md:w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground md:text-2xl">Produtos</h1>
              <p className="hidden text-xs text-muted-foreground sm:block md:text-sm">Gerencie seu catalogo</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePrintProducts} className="fluent-button justify-center gap-2 px-3">
              <Print24Regular className="h-5 w-5" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
            <button onClick={() => setIsAdoptDialogOpen(true)} className="fluent-button justify-center gap-2 px-3">
              <Search24Regular className="h-5 w-5" />
              <span className="hidden sm:inline">Usar Existente</span>
            </button>
            <button onClick={openCreateDialog} className="fluent-button fluent-button-primary justify-center gap-2 px-3">
              <Add24Regular className="h-5 w-5" />
              <span className="hidden sm:inline">Novo</span>
            </button>
          </div>
        </div>
      </div>

      <div className="windows-scrollbar flex-1 overflow-auto p-3 md:p-6">
        <div className="mb-4 flex flex-col items-stretch gap-2 md:mb-6 md:gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search24Regular className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground md:h-5 md:w-5" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full rounded-lg border border-border bg-card py-2 pr-4 pl-9 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 md:py-2.5 md:pl-10 md:text-sm"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 md:px-4 md:py-2.5 md:text-sm sm:flex-none"
            >
              <option value="all">Categorias</option>
              {categoriesList.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <button className="fluent-button hidden gap-2 sm:flex">
              <Filter24Regular className="h-5 w-5" />
              Filtros
            </button>
          </div>
        </div>

        {productsLoading && (
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            <p className="text-sm">Carregando produtos...</p>
          </div>
        )}

        {!productsLoading && (
          <div className="block space-y-2 md:hidden">
            {filteredProducts.map((product) => {
              const stock = product.inventory ? parseFloat(product.inventory.quantity) : 0;

              return (
                <div key={product.id} className="fluent-card p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <ProductImage
                        emoji={product.emoji}
                        image={product.image}
                        alt={product.name}
                        size="md"
                        productName={product.name}
                        color="bg-primary/10"
                        textColor="text-primary"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className="text-xs font-bold text-primary">{parseFloat(product.price).toFixed(2)} MT</span>
                          {product.track_stock && <span className="text-[10px] text-muted-foreground">• {stock.toFixed(0)} un</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button onClick={() => openEditDialog(product)} className="rounded-lg bg-secondary p-2 text-muted-foreground">
                        <Edit24Regular className="h-4 w-4" />
                      </button>
                      <button onClick={() => openDeleteDialog(product)} className="rounded-lg p-2 text-destructive">
                        <Delete24Regular className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!productsLoading && (
          <div className="fluent-card hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="p-4 text-left text-sm font-semibold text-foreground">Produto</th>
                    <th className="p-4 text-left text-sm font-semibold text-foreground">Categoria</th>
                    <th className="p-4 text-left text-sm font-semibold text-foreground">Preco</th>
                    <th className="p-4 text-left text-sm font-semibold text-foreground">Estoque</th>
                    <th className="p-4 text-left text-sm font-semibold text-foreground">Status</th>
                    <th className="p-4 text-right text-sm font-semibold text-foreground">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        Nenhum produto encontrado
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => {
                      const stock = product.inventory ? parseFloat(product.inventory.quantity) : 0;
                      const stockStatus = stock > 20 ? "normal" : stock > 5 ? "low" : "critical";

                      return (
                        <tr key={product.id} className="border-t border-border transition-colors hover:bg-secondary/30">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <ProductImage
                                emoji={product.emoji}
                                image={product.image}
                                alt={product.name}
                                size="md"
                                productName={product.name}
                                color="bg-primary/10"
                                textColor="text-primary"
                              />
                              <span className="text-sm font-medium text-foreground">{product.name}</span>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">{product.category || "Sem categoria"}</td>
                          <td className="p-4 text-sm font-semibold text-foreground">{parseFloat(product.price).toFixed(2)} MT</td>
                          <td className="p-4 text-sm text-foreground">{product.track_stock ? `${stock.toFixed(0)} un` : "N/A"}</td>
                          <td className="p-4">
                            {product.track_stock ? (
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-medium ${
                                  stockStatus === "normal"
                                    ? "bg-success/20 text-success"
                                    : stockStatus === "low"
                                      ? "bg-warning/20 text-warning"
                                      : "bg-destructive/20 text-destructive"
                                }`}
                              >
                                {stockStatus === "normal" ? "Normal" : stockStatus === "low" ? "Baixo" : "Critico"}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">Sem controle</span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditDialog(product)}
                                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                              >
                                <Edit24Regular className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => openDeleteDialog(product)}
                                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Delete24Regular className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-center text-sm text-muted-foreground sm:text-left">
            Mostrando {filteredProducts.length} de {products.length} produtos
          </p>
          <div className="flex items-center gap-2">
            <button className="fluent-button px-3 py-1.5 text-sm" disabled>
              Anterior
            </button>
            <button className="fluent-button fluent-button-primary px-3 py-1.5 text-sm">1</button>
            <button className="fluent-button px-3 py-1.5 text-sm">2</button>
            <button className="fluent-button px-3 py-1.5 text-sm">Proximo</button>
          </div>
        </div>

        <ProductDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSave={handleSaveProduct}
          product={productForDialog}
        />
        <DeleteProductDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDeleteProduct}
          product={productForDialog}
        />
        <AdoptProductDialog open={isAdoptDialogOpen} onOpenChange={setIsAdoptDialogOpen} />
      </div>
    </div>
  );
}
