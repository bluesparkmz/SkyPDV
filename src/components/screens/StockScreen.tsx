import { useState, useMemo } from "react";
import {
  ClipboardTaskListLtr24Regular,
  ArrowDownload24Regular,
  ArrowUpload24Regular,
  Search24Regular,
  CheckmarkCircle24Regular,
  Warning24Regular,
  ErrorCircle24Regular,
  History24Regular,
} from "@fluentui/react-icons";
import { ProductImage } from "@/components/ProductImage";
import { useProducts } from "@/hooks/useProducts";
import { productsApi, StockMovement } from "@/services/api";
import { useQuery } from "@tanstack/react-query";

export function StockScreen() {
  const [searchQuery, setSearchQuery] = useState("");

  // Buscar produtos da API
  const { data: products = [], isLoading: productsLoading } = useProducts({
    limit: 1000,
  });

  // Buscar movimentações recentes (últimos 10 produtos com movimentações)
  const { data: recentMovements = [] } = useQuery<StockMovement[]>({
    queryKey: ["stock-movements-recent"],
    queryFn: async () => {
      // Buscar movimentações dos primeiros produtos
      const productsWithStock = products.filter(p => p.track_stock && p.inventory);
      const movementsPromises = productsWithStock.slice(0, 10).map(p =>
        productsApi.getMovements(p.id, 0, 5).catch(() => [])
      );
      const allMovements = await Promise.all(movementsPromises);
      return allMovements.flat().sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ).slice(0, 10);
    },
    enabled: products.length > 0,
  });

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch && p.track_stock && p.is_active;
      })
      .map(p => ({
        ...p,
        stock: p.inventory ? parseFloat(p.inventory.quantity) : 0,
        minStock: p.inventory ? parseFloat(p.inventory.min_quantity) : 0,
      }))
      .sort((a, b) => a.stock - b.stock);
  }, [products, searchQuery]);

  const lowStockProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.track_stock || !p.inventory) return false;
      const stock = parseFloat(p.inventory.quantity);
      const minStock = parseFloat(p.inventory.min_quantity);
      return stock <= minStock;
    });
  }, [products]);

  const totalValue = useMemo(() => {
    return products.reduce((acc, p) => {
      if (!p.track_stock || !p.inventory) return acc;
      const stock = parseFloat(p.inventory.quantity);
      const price = parseFloat(p.price);
      return acc + price * stock;
    }, 0);
  }, [products]);

  // Formatar movimentações para exibição
  const formattedMovements = useMemo(() => {
    return recentMovements.map((mov) => {
      const product = products.find(p => p.id === mov.product_id);
      const date = new Date(mov.created_at);
      return {
        type: mov.movement_type === "in" || mov.movement_type === "adjustment" ? "in" : "out",
        product: product?.name || "Produto desconhecido",
        quantity: parseFloat(mov.quantity),
        date: date.toLocaleDateString("pt-MZ"),
        user: "Sistema",
      };
    });
  }, [recentMovements, products]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Fixed Header */}
      <div className="p-3 md:p-6 border-b border-border bg-background/80 backdrop-blur-md z-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary flex items-center justify-center text-white">
              <ClipboardTaskListLtr24Regular className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-foreground">Estoque</h1>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Controle de inventário</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="fluent-button gap-2 px-3 justify-center">
              <ArrowDownload24Regular className="w-5 h-5" />
              <span className="hidden sm:inline">Entrada</span>
            </button>
            <button className="fluent-button fluent-button-primary gap-2 px-3 justify-center">
              <ArrowUpload24Regular className="w-5 h-5" />
              <span className="hidden sm:inline">Saída</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 p-3 md:p-6 overflow-auto windows-scrollbar">


        {/* Stats */}
        {productsLoading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground mb-4 md:mb-6">
            <p className="text-sm">Carregando dados de estoque...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
            <div className="fluent-card p-3 md:p-4">
              <p className="text-xs md:text-sm text-muted-foreground">Total de Produtos</p>
              <p className="text-xl md:text-2xl font-bold text-foreground">
                {products.filter(p => p.track_stock).length}
              </p>
            </div>
            <div className="fluent-card p-3 md:p-4">
              <p className="text-xs md:text-sm text-muted-foreground">Itens em Estoque</p>
              <p className="text-xl md:text-2xl font-bold text-foreground">
                {products.reduce((acc, p) => {
                  if (!p.track_stock || !p.inventory) return acc;
                  return acc + parseFloat(p.inventory.quantity);
                }, 0).toFixed(0)}
              </p>
            </div>
            <div className="fluent-card p-3 md:p-4">
              <p className="text-xs md:text-sm text-muted-foreground">Estoque Baixo</p>
              <p className="text-xl md:text-2xl font-bold text-warning">{lowStockProducts.length}</p>
            </div>
            <div className="fluent-card p-3 md:p-4">
              <p className="text-xs md:text-sm text-muted-foreground">Valor Total</p>
              <p className="text-xl md:text-2xl font-bold text-primary">{totalValue.toFixed(2)} MT</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Stock List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative">
              <Search24Regular className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar no estoque..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>

            <div className="fluent-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="text-left p-2 md:p-3 text-xs md:text-sm font-semibold text-foreground">Produto</th>
                      <th className="text-center p-2 md:p-3 text-xs md:text-sm font-semibold text-foreground">Estoque</th>
                      <th className="text-center p-2 md:p-3 text-xs md:text-sm font-semibold text-foreground hidden sm:table-cell">Mín</th>
                      <th className="text-center p-2 md:p-3 text-xs md:text-sm font-semibold text-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productsLoading ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                          Carregando produtos...
                        </td>
                      </tr>
                    ) : filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                          Nenhum produto com controle de estoque encontrado
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.slice(0, 10).map((product) => {
                        const stock = product.stock;
                        const minStock = product.minStock;
                        const status = stock > minStock * 2 ? "ok" : stock > minStock ? "warning" : "critical";
                        return (
                          <tr key={product.id} className="border-t border-border hover:bg-secondary/30">
                            <td className="p-2 md:p-3">
                              <div className="flex items-center gap-2">
                                <ProductImage
                                  emoji={product.emoji}
                                  image={product.image}
                                  alt={product.name}
                                  size="sm"
                                  productName={product.name}
                                  color="bg-primary/10"
                                  textColor="text-primary"
                                />
                                <span className="text-xs md:text-sm text-foreground truncate">{product.name}</span>
                              </div>
                            </td>
                            <td className="p-2 md:p-3 text-center text-xs md:text-sm font-semibold text-foreground">{stock.toFixed(0)}</td>
                            <td className="p-2 md:p-3 text-center text-xs md:text-sm text-muted-foreground hidden sm:table-cell">{minStock.toFixed(0)}</td>
                            <td className="p-2 md:p-3 text-center text-lg">
                              {status === "ok" && <CheckmarkCircle24Regular className="w-4 h-4 md:w-5 md:h-5 text-success" />}
                              {status === "warning" && <Warning24Regular className="w-4 h-4 md:w-5 md:h-5 text-warning" />}
                              {status === "critical" && <ErrorCircle24Regular className="w-4 h-4 md:w-5 md:h-5 text-destructive" />}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recent Movements */}
          <div className="fluent-card p-3 md:p-4">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <History24Regular className="w-5 h-5 md:w-6 md:h-6" />
              <h3 className="text-sm md:text-base font-semibold text-foreground">Movimentações</h3>
            </div>
            <div className="space-y-2 md:space-y-3">
              {formattedMovements.length === 0 ? (
                <p className="text-xs md:text-sm text-muted-foreground text-center py-4">
                  Nenhuma movimentação recente
                </p>
              ) : (
                formattedMovements.map((mov, i) => (
                  <div key={i} className="flex items-center gap-2 md:gap-3 p-2 rounded-lg hover:bg-secondary/50">
                    <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-sm ${mov.type === "in" ? "bg-success/20" : "bg-destructive/20"
                      }`}>
                      {mov.type === "in"
                        ? <ArrowDownload24Regular className="w-3 h-3 md:w-4 md:h-4" />
                        : <ArrowUpload24Regular className="w-3 h-3 md:w-4 md:h-4" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm font-medium text-foreground truncate">{mov.product}</p>
                      <p className="text-[10px] md:text-xs text-muted-foreground">{mov.date} • {mov.user}</p>
                    </div>
                    <span className={`text-xs md:text-sm font-semibold ${mov.type === "in" ? "text-success" : "text-destructive"
                      }`}>
                      {mov.type === "in" ? "+" : "-"}{mov.quantity.toFixed(0)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
