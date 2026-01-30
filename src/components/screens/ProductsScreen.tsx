import { useState, useMemo } from "react";
import {
  Box24Regular,
  Add24Regular,
  Search24Regular,
  Filter24Regular,
  Edit24Regular,
  Delete24Regular,
  Print24Regular,
} from "@fluentui/react-icons";
import { Product } from "@/services/api";
import { dashboardApi } from "@/services/api";
import { ProductDialog } from "@/components/ProductDialog";
import { DeleteProductDialog } from "@/components/DeleteProductDialog";
import { SupplyProductDialog } from "@/components/SupplyProductDialog";
import { ProductImage } from "@/components/ProductImage";
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { toast } from "sonner";

export function ProductsScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSupplyDialogOpen, setIsSupplyDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Buscar produtos da API
  const { data: products = [], isLoading: productsLoading } = useProducts({
    search: searchQuery || undefined,
    category: selectedCategory !== "all" ? selectedCategory : undefined,
    limit: 1000,
  });

  // Buscar categorias da API
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
    stock: number;
    image?: string;
    emoji?: string;
    is_fastfood?: boolean;
  }) => {
    try {
      if (productData.id) {
        // Edit
        await updateProduct.mutateAsync({
          id: typeof productData.id === "string" ? parseInt(productData.id) : productData.id,
          data: {
            name: productData.name,
            price: productData.price.toString(),
            category: productData.category,
            emoji: productData.emoji,
            image: productData.image,
            initial_stock: productData.stock.toString(),
            is_fastfood: productData.is_fastfood,
          },
        });
      } else {
        // Create
        await createProduct.mutateAsync({
          name: productData.name,
          price: productData.price.toString(),
          category: productData.category,
          emoji: productData.emoji || "📦",
          image: productData.image,
          initial_stock: productData.stock.toString(),
          track_stock: true,
          is_fastfood: productData.is_fastfood || false,
        });
      }
      setIsDialogOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      // Error já é tratado pelo hook com toast
      console.error("Erro ao salvar produto:", error);
    }
  };

  const handleDeleteProduct = async () => {
    if (selectedProduct) {
      try {
        await deleteProduct.mutateAsync(selectedProduct.id);
        setIsDeleteDialogOpen(false);
        setSelectedProduct(null);
      } catch (error) {
        // Error já é tratado pelo hook com toast
        console.error("Erro ao deletar produto:", error);
      }
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

  const openSupplyDialog = (product: Product) => {
    setSelectedProduct(product);
    setIsSupplyDialogOpen(true);
  };

  const openCreateDialog = () => {
    setSelectedProduct(null);
    setIsDialogOpen(true);
  };

  const handlePrintProducts = async () => {
    try {
      const { blob, filename } = await dashboardApi.downloadProductsPdf();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "products.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(e?.message || "Falha ao gerar o PDF");
    }
  };

  // Converter produto da API para o formato esperado pelo dialog
  const productForDialog = selectedProduct ? {
    id: selectedProduct.id.toString(),
    name: selectedProduct.name,
    price: parseFloat(selectedProduct.price),
    category: selectedProduct.category || "",
    stock: selectedProduct.inventory ? parseFloat(selectedProduct.inventory.quantity) : 0,
    image: selectedProduct.image || selectedProduct.emoji || "📦",
    emoji: selectedProduct.emoji || "📦",
  } : null;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Fixed Header */}
      <div className="p-3 md:p-6 border-b border-border bg-background/80 backdrop-blur-md z-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary flex items-center justify-center text-white">
              <Box24Regular className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-foreground">Produtos</h1>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Gerencie seu catálogo</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrintProducts}
              className="fluent-button gap-2 px-3 justify-center"
            >
              <Print24Regular className="w-5 h-5" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
            <button onClick={openCreateDialog} className="fluent-button fluent-button-primary gap-2 px-3 justify-center">
              <Add24Regular className="w-5 h-5" />
              <span className="hidden sm:inline">Novo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 p-3 md:p-6 overflow-auto windows-scrollbar">


        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3 mb-4 md:mb-6">
          <div className="relative flex-1">
            <Search24Regular className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 md:pl-10 pr-4 py-2 md:py-2.5 rounded-lg bg-card border border-border text-xs md:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex-1 sm:flex-none px-3 md:px-4 py-2 md:py-2.5 rounded-lg bg-card border border-border text-xs md:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="all">Categorias</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <button className="fluent-button gap-2 hidden sm:flex">
              <Filter24Regular className="w-5 h-5" />
              Filtros
            </button>
          </div>
        </div>

        {/* Loading State */}
        {productsLoading && (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <p className="text-sm">Carregando produtos...</p>
          </div>
        )}

        {/* Products - Mobile Cards */}
        {!productsLoading && (
          <div className="block md:hidden space-y-2">
            {filteredProducts.map((product) => {
              const stock = product.inventory ? parseFloat(product.inventory.quantity) : 0;
              const stockStatus = stock > 20 ? "normal" : stock > 5 ? "low" : "critical";

              return (
                <div key={product.id} className="fluent-card p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
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
                        <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-bold text-primary">{parseFloat(product.price).toFixed(2)} MT</span>
                          {product.track_stock && (
                            <span className="text-[10px] text-muted-foreground">• {stock.toFixed(0)} un</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {product.track_stock && (
                        <button
                          onClick={() => openSupplyDialog(product)}
                          className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600"
                          title="Fornecer"
                        >
                          <Add24Regular className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => openEditDialog(product)}
                        className="p-2 rounded-lg bg-secondary text-muted-foreground"
                      >
                        <Edit24Regular className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteDialog(product)}
                        className="p-2 rounded-lg text-destructive"
                      >
                        <Delete24Regular className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Products Table - Desktop */}
        {!productsLoading && (
          <div className="hidden md:block fluent-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-foreground">Produto</th>
                    <th className="text-left p-4 text-sm font-semibold text-foreground">Categoria</th>
                    <th className="text-left p-4 text-sm font-semibold text-foreground">Preço</th>
                    <th className="text-left p-4 text-sm font-semibold text-foreground">Estoque</th>
                    <th className="text-left p-4 text-sm font-semibold text-foreground">Status</th>
                    <th className="text-right p-4 text-sm font-semibold text-foreground">Ações</th>
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
                        <tr key={product.id} className="border-t border-border hover:bg-secondary/30 transition-colors">
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
                          <td className="p-4 text-sm text-foreground">
                            {product.track_stock ? `${stock.toFixed(0)} un` : "N/A"}
                          </td>
                          <td className="p-4">
                            {product.track_stock ? (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus === "normal"
                                ? "bg-success/20 text-success"
                                : stockStatus === "low"
                                  ? "bg-warning/20 text-warning"
                                  : "bg-destructive/20 text-destructive"
                                }`}>
                                {stockStatus === "normal" ? "Normal" : stockStatus === "low" ? "Baixo" : "Crítico"}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">Sem controle</span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-2">
                              {product.track_stock && (
                                <button
                                  onClick={() => openSupplyDialog(product)}
                                  className="p-2 rounded-lg hover:bg-emerald-500/10 text-emerald-600 hover:text-emerald-700 transition-colors"
                                  title="Fornecer produto"
                                >
                                  <Add24Regular className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => openEditDialog(product)}
                                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <Edit24Regular className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openDeleteDialog(product)}
                                className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <Delete24Regular className="w-4 h-4" />
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

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            Mostrando {filteredProducts.length} de {products.length} produtos
          </p>
          <div className="flex items-center gap-2">
            <button className="fluent-button px-3 py-1.5 text-sm" disabled>Anterior</button>
            <button className="fluent-button fluent-button-primary px-3 py-1.5 text-sm">1</button>
            <button className="fluent-button px-3 py-1.5 text-sm">2</button>
            <button className="fluent-button px-3 py-1.5 text-sm">Próximo</button>
          </div>
        </div>

        {/* Dialogs */}
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
        <SupplyProductDialog
          open={isSupplyDialogOpen}
          onOpenChange={setIsSupplyDialogOpen}
          product={selectedProduct}
          onSuccess={() => {
            // Recarregar produtos após fornecer
            // O React Query vai atualizar automaticamente
          }}
        />
      </div>
    </div>
  );
}
