import { useState, useMemo } from "react";
import {
  Money24Regular,
  WeatherSunny24Regular,
  Wifi124Regular,
  BatteryCharge24Regular,
  Search24Regular,
  Print24Regular,
} from "@fluentui/react-icons";
import { Taskbar } from "./Taskbar";
import { StartMenu } from "./StartMenu";
import { ProductCard } from "./ProductCard";
import { CartSidebar } from "./CartSidebar";
import { CategoryTabs } from "./CategoryTabs";
import { QuantityDialog } from "./QuantityDialog";
import { CashRegisterDialog } from "./CashRegisterDialog";
import { OverviewScreen } from "./screens/OverviewScreen";
import { ProductsScreen } from "./screens/ProductsScreen";
import { StockScreen } from "./screens/StockScreen";
import { ReportsScreen } from "./screens/ReportsScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { CategoriesScreen } from "./screens/CategoriesScreen";
import { TablesScreen } from "./screens/TablesScreen";
import { TabsScreen } from "./screens/TabsScreen";
import { SalesHistoryScreen } from "./screens/SalesHistoryScreen";
import { useProducts } from "@/hooks/useProducts";
import { useCashRegister } from "@/hooks/useCashRegister";
import { useBattery } from "@/hooks/useBattery";
import { useNetworkQuality } from "@/hooks/useNetworkQuality";
import { useHardwarePlugin } from "@/hooks/useHardwarePlugin";
import { Product } from "@/services/api";
import { CartItem } from "@/types/product";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { Screen } from "@/types/screen";

type ParkedSale = {
  id: string;
  label: string;
  createdAt: string;
  items: CartItem[];
  customerName?: string;
};

export function SkyPDV() {
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentScreen, setCurrentScreen] = useState<Screen>("pdv");
  const [quantityDialogOpen, setQuantityDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cashRegisterDialogOpen, setCashRegisterDialogOpen] = useState(false);
  const [currentCustomerName, setCurrentCustomerName] = useState<string>("");
  const [parkedSales, setParkedSales] = useState<ParkedSale[]>([]);

  const { data: currentRegister } = useCashRegister();
  const { level: batteryLevel, charging: isCharging, isSupported: batterySupported } = useBattery();
  const { qualityLabel, qualityColor, isOnline } = useNetworkQuality();
  const { isConnected: hardwareConnected, isConnecting: hardwareConnecting } = useHardwarePlugin();

  // Fetch products from API
  const { data: products = [], isLoading: productsLoading } = useProducts({
    search: searchQuery || undefined,
    category: activeCategory !== "all" ? activeCategory : undefined,
    limit: 100,
  });

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = activeCategory === "all" || product.category === activeCategory;
      const matchesSearch = !searchQuery || product.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch && product.is_active;
    });
  }, [products, activeCategory, searchQuery]);

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart((prev) => {
      const productStock = product.inventory?.quantity
        ? parseFloat(product.inventory.quantity)
        : 0;

      // Não permitir adicionar produtos com stock 0
      if (productStock <= 0) {
        toast.error("Este produto está sem stock e não pode ser vendido.");
        return prev;
      }

      const existing = prev.find((item) => item.id === product.id.toString());

      // Se já existe no carrinho, verificar limite de stock
      if (existing) {
        const newQuantity = existing.quantity + quantity;
        if (newQuantity > existing.stock) {
          toast.error("Quantidade superior ao stock disponível para este produto.");
          return prev;
        }

        return prev.map((item) =>
          item.id === product.id.toString()
            ? { ...item, quantity: newQuantity }
            : item
        );
      }

      // Converter API Product para CartItem
      const cartItem: CartItem = {
        id: product.id.toString(),
        name: product.name,
        price: parseFloat(product.price),
        category: product.category || "",
        image: product.emoji || product.image || "📦",
        stock: productStock,
        quantity,
        // Preserve FastFood integration fields
        source_type: product.source_type,
        external_product_id: product.external_product_id,
        pdv_product_id: product.id,
      };

      // Garantir que a quantidade inicial não ultrapasse o stock
      if (cartItem.quantity > cartItem.stock) {
        toast.error("Quantidade superior ao stock disponível para este produto.");
        return prev;
      }

      return [...prev, cartItem];
    });
  };

  const handleLongPress = (product: Product) => {
    setSelectedProduct(product);
    setQuantityDialogOpen(true);
  };

  const handleQuantityConfirm = (product: Product, quantity: number) => {
    addToCart(product, quantity);
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(id);
      return;
    }

    setCart((prev) => {
      const item = prev.find((i) => i.id === id);
      if (!item) return prev;

      // Bloquear quantidades acima do stock
      if (quantity > item.stock) {
        toast.error("Quantidade superior ao stock disponível para este produto.");
        return prev;
      }

      return prev.map((cartItem) =>
        cartItem.id === id ? { ...cartItem, quantity } : cartItem
      );
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    // Não limpar vendas em espera, mas podemos limpar o nome atual
    setCurrentCustomerName("");
  };

  // Colocar venda atual em espera (PDV local, não FastFood)
  const parkCurrentSale = () => {
    if (cart.length === 0) {
      toast.error("Carrinho vazio. Nada para colocar em espera.");
      return;
    }

    const newSale: ParkedSale = {
      id: Date.now().toString(),
      label: currentCustomerName || `Venda ${parkedSales.length + 1}`,
      createdAt: new Date().toISOString(),
      items: cart,
      customerName: currentCustomerName || undefined,
    };

    setParkedSales((prev) => [...prev, newSale]);
    
    setCurrentCustomerName("");
    toast.success("Venda colocada em espera.");
  };

  const loadParkedSale = (id: string) => {
    setParkedSales((prev) => {
      const sale = prev.find((s) => s.id === id);
      if (!sale) {
        toast.error("Venda em espera não encontrada.");
        return prev;
      }
      // Se o carrinho atual tiver itens, avisar o usuário
      if (cart.length > 0) {
        toast.error("Limpe ou finalize a venda atual antes de recuperar uma venda em espera.");
        return prev;
      }
      setCart(sale.items);
      setCurrentCustomerName(sale.customerName || "");
      return prev.filter((s) => s.id !== id);
    });
  };

  const handleSaleComplete = () => {
    // Refresh products to update stock
    // Query will auto-refetch
  };

  const handleNavigate = (screen: Screen) => {
    setCurrentScreen(screen);
    setIsStartOpen(false);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case "overview":
        return <OverviewScreen />;
      case "products":
        return <ProductsScreen />;
      case "stock":
        return <StockScreen />;
      case "reports":
        return <ReportsScreen />;
      case "settings":
        return <SettingsScreen />;
      case "categories":
        return <CategoriesScreen />;
      case "tables":
        return <TablesScreen />;
      case "tabs":
        return <TabsScreen />;
      case "sales":
        return <SalesHistoryScreen />;
      case "pdv":
      default:
        return (
          <>
            {/* Main Content */}
            <div className="flex-1 flex flex-col p-3 md:p-4 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold">
                      <span className="text-primary">Sky</span>
                      <span className="text-foreground">PDV</span>
                    </h1>
                    <p className="text-xs text-muted-foreground hidden sm:block">Sistema de Vendas</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Cash Register Status */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCashRegisterDialogOpen(true)}
                    className="gap-2"
                  >
                    <Money24Regular className="w-5 h-5" />
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${currentRegister?.status === "open"
                        ? "bg-emerald-500"
                        : "bg-red-500"
                        }`} />
                      <span className="hidden sm:inline text-xs">
                        {currentRegister?.status === "open" ? "Caixa Aberto" : "Caixa Fechado"}
                      </span>
                    </div>
                  </Button>

                  {/* Status bar */}
                  <div className="hidden sm:flex items-center gap-4 text-muted-foreground">
                    <div className="flex items-center gap-2 text-sm">
                      <WeatherSunny24Regular className="w-5 h-5" />
                      <span>26°C</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Wifi124Regular className={`w-5 h-5 ${qualityColor}`} />
                      {qualityLabel && (
                        <span className={`text-xs ${qualityColor}`}>
                          {qualityLabel}
                        </span>
                      )}
                    </div>
                    {batterySupported && batteryLevel !== null ? (
                      <div className="flex items-center gap-1.5 text-sm">
                        <BatteryCharge24Regular
                          className={`w-5 h-5 ${isCharging ? "text-emerald-500" : batteryLevel < 0.2 ? "text-destructive" : ""}`}
                        />
                        <span className="text-xs">
                          {Math.round(batteryLevel * 100)}%
                        </span>
                        {isCharging && (
                          <span className="text-xs text-emerald-500">⚡</span>
                        )}
                      </div>
                    ) : (
                      <BatteryCharge24Regular className="w-5 h-5" />
                    )}
                    {/* Hardware Plugin Status */}
                    <div className="flex items-center gap-1.5" title={hardwareConnected ? "Plugin de hardware conectado" : hardwareConnecting ? "Conectando ao plugin..." : "Plugin de hardware não conectado"}>
                      <Print24Regular
                        className={`w-5 h-5 ${hardwareConnected ? "text-emerald-500" : hardwareConnecting ? "text-yellow-500 animate-pulse" : "text-muted-foreground opacity-50"}`}
                      />
                      {hardwareConnected && (
                        <span className="text-xs text-emerald-500">Hardware</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="relative mb-3 md:mb-4">
                <Search24Regular className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 md:py-2.5 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>

              {/* Categories */}
              <CategoryTabs
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
              />

              {/* Products Grid */}
              <div className="flex-1 overflow-auto windows-scrollbar pb-16 lg:pb-0">
                {productsLoading ? (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                    <p className="text-sm">Carregando produtos...</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2 md:gap-3">
                      {filteredProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onAdd={(p) => addToCart(p)}
                          onLongPress={handleLongPress}
                        />
                      ))}
                    </div>

                    {filteredProducts.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                        <p className="text-sm">Nenhum produto encontrado</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Cart Sidebar */}
            <CartSidebar
              items={cart}
              onUpdateQuantity={updateQuantity}
              onRemove={removeFromCart}
              onClear={clearCart}
              onSaleComplete={handleSaleComplete}
              isCashRegisterOpen={currentRegister?.status === "open"}
              parkedSales={parkedSales.map(({ id, label, createdAt, customerName }) => ({
                id,
                label,
                createdAt,
                customerName,
              }))}
              customerName={currentCustomerName}
              onCustomerNameChange={setCurrentCustomerName}
              onParkSale={parkCurrentSale}
              onLoadParkedSale={loadParkedSale}
            />
          </>
        );
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Desktop Area */}
      <div className="flex-1 flex overflow-hidden pb-12">
        {renderScreen()}
      </div>

      {/* Taskbar */}
      <Taskbar
        isStartOpen={isStartOpen}
        onStartClick={() => setIsStartOpen(!isStartOpen)}
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
      />

      {/* Start Menu */}
      <StartMenu
        isOpen={isStartOpen}
        onClose={() => setIsStartOpen(false)}
        onNavigate={handleNavigate}
        currentScreen={currentScreen}
      />

      {/* Quantity Dialog */}
      <QuantityDialog
        product={selectedProduct}
        open={quantityDialogOpen}
        onOpenChange={setQuantityDialogOpen}
        onConfirm={handleQuantityConfirm}
      />

      {/* Cash Register Dialog */}
      <CashRegisterDialog
        open={cashRegisterDialogOpen}
        onOpenChange={setCashRegisterDialogOpen}
      />
    </div>
  );
}
