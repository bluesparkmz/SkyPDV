import { useState, useMemo, useEffect, useRef } from "react";
import {
  Money24Regular,
  AlertOff24Regular,
  Wifi124Regular,
  BatteryCharge24Regular,
  Search24Regular,
  Print24Regular,
  ArrowDownload24Regular,
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
import { TerminalSetup } from "./TerminalSetup";
import { CategoriesScreen } from "./screens/CategoriesScreen";
import { TablesScreen } from "./screens/TablesScreen";
import { TabsScreen } from "./screens/TabsScreen";
import { SalesHistoryScreen } from "./screens/SalesHistoryScreen";
import { FastfoodAdminScreen } from "./screens/FastfoodAdminScreen";
import { FinanceScreen } from "./screens/FinanceScreen";
import { useProducts } from "@/hooks/useProducts";
import { useCashRegister } from "@/hooks/useCashRegister";
import { useDashboard } from "@/hooks/useDashboard";
import { useBattery } from "@/hooks/useBattery";
import { useNetworkQuality } from "@/hooks/useNetworkQuality";
import { useHardwarePlugin } from "@/hooks/useHardwarePlugin";
import { useSkyWebsocket } from "@/hooks/useSkyWebsocket";
import { usePermissions } from "@/hooks/usePermissions";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Product } from "@/services/api";
import { CartItem } from "@/types/product";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { inventoryApi, terminalApi } from "@/services/api";

import { Screen } from "@/types/screen";

type ParkedSale = {
  id: string;
  label: string;
  createdAt: string;
  items: CartItem[];
  customerName?: string;
};

type StockAlertNotice = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
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
  const [showSetup, setShowSetup] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallCard, setShowInstallCard] = useState(false);
  const [alertsPanelOpen, setAlertsPanelOpen] = useState(false);
  const [stockNotifications, setStockNotifications] = useState<StockAlertNotice[]>([]);
  const previousNotificationCount = useRef(0);
  const previousAlertKeys = useRef<string[]>([]);
  const alertsAutoOpened = useRef(false);

  const { data: currentRegister } = useCashRegister();
  const { data: dashboard } = useDashboard();
  const { level: batteryLevel, charging: isCharging, isSupported: batterySupported } = useBattery();
  const { qualityLabel, qualityColor, isOnline } = useNetworkQuality();
  const { isConnected: hardwareConnected, isConnecting: hardwareConnecting } = useHardwarePlugin();
  const perms = usePermissions();
  const isAdmin = useIsAdmin();
  const { data: terminal, error: terminalError } = useQuery({
    queryKey: ["terminal"],
    queryFn: () => terminalApi.get(),
  });
  const { data: inventoryReport } = useQuery({
    queryKey: ["inventoryAlertsSummary"],
    queryFn: () => inventoryApi.getReport(),
    refetchInterval: 15000,
  });

  useEffect(() => {
    if ((terminalError as any)?.status === 404) {
      setShowSetup(true);
    } else if (terminal) {
      setShowSetup(false);
    }
  }, [terminalError, terminal]);

  // PWA install prompt handling
  useEffect(() => {
    const isStandalone =
      (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
      // @ts-ignore
      window.navigator.standalone === true;
    if (isStandalone) {
      setShowInstallCard(false);
      return;
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallCard(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowInstallCard(false);
    }
    setDeferredPrompt(null);
  };

  // Initialize global WebSocket for notifications
  useSkyWebsocket();

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
      const balcaoStock = product.inventory?.quantity ? parseFloat(product.inventory.quantity) : 0;
      const canSellWithoutStock = product.track_stock === false;
      return matchesCategory && matchesSearch && product.is_active && (canSellWithoutStock || balcaoStock > 0);
    });
  }, [products, activeCategory, searchQuery]);

  if (showSetup) {
    return (
      <TerminalSetup
        onSuccess={() => {
          setShowSetup(false);
          window.location.reload();
        }}
      />
    );
  }

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart((prev) => {
      const productStock = product.track_stock === false
        ? Number.MAX_SAFE_INTEGER
        : product.inventory?.quantity
          ? parseFloat(product.inventory.quantity)
          : 0;

      if (product.track_stock !== false && productStock <= 0) {
        toast.error("Este produto esta sem stock e nao pode ser vendido.");
        return prev;
      }

      const existing = prev.find((item) => item.id === product.id.toString());

      if (existing) {
        const newQuantity = existing.quantity + quantity;
        if (existing.track_stock !== false && newQuantity > existing.stock) {
          toast.error("Quantidade superior ao stock disponivel para este produto.");
          return prev;
        }

        return prev.map((item) =>
          item.id === product.id.toString()
            ? { ...item, quantity: newQuantity }
            : item
        );
      }

      const cartItem: CartItem = {
        id: product.id.toString(),
        name: product.name,
        price: parseFloat(product.price),
        category: product.category || "",
        image: product.emoji || product.image || "ðŸ“¦",
        stock: productStock,
        track_stock: product.track_stock,
        quantity,
        source_type: product.source_type,
        external_product_id: product.external_product_id,
        pdv_product_id: product.id,
      };

      if (cartItem.track_stock !== false && cartItem.quantity > cartItem.stock) {
        toast.error("Quantidade superior ao stock disponivel para este produto.");
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

      if (item.track_stock !== false && quantity > item.stock) {
        toast.error("Quantidade superior ao stock disponivel para este produto.");
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
    // NÃ£o limpar vendas em espera, mas podemos limpar o nome atual
    setCurrentCustomerName("");
  };

  // Colocar venda atual em espera (PDV local, nÃ£o FastFood)
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
        toast.error("Venda em espera nÃ£o encontrada.");
        return prev;
      }
      // Se o carrinho atual tiver itens, avisar o usuÃ¡rio
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
    if (screen === "finance" && !isAdmin) {
      toast.error("Apenas administradores do terminal podem aceder Ã s FinanÃ§as.");
      setIsStartOpen(false);
      return;
    }
    setCurrentScreen(screen);
    setIsStartOpen(false);
  };

  useEffect(() => {
    if (currentScreen === "finance" && !isAdmin) {
      setCurrentScreen("overview");
    }
  }, [currentScreen, isAdmin]);

  const notificationCount = (dashboard?.low_stock_alerts || 0) + (dashboard?.out_of_stock || 0);

  const criticalAlerts = useMemo(() => {
    const items = inventoryReport?.products || [];
    return items
      .filter((item) => {
        const quantity = parseFloat(item.quantity || "0");
        const minimum = parseFloat(item.min_quantity || "0");
        const threshold = minimum > 0 ? minimum : 5;
        return quantity <= threshold;
      })
      .sort((a, b) => {
        const qtyA = parseFloat(a.quantity || "0");
        const qtyB = parseFloat(b.quantity || "0");
        if (qtyA === qtyB) return a.product_name.localeCompare(b.product_name);
        return qtyA - qtyB;
      })
      .slice(0, 8);
  }, [inventoryReport]);

  useEffect(() => {
    if (notificationCount > previousNotificationCount.current) {
      toast.warning("Existem novos alertas de estoque critico.", {
        description: `${notificationCount} produto(s) precisam de atencao no estoque.`,
      });
    }
    previousNotificationCount.current = notificationCount;
  }, [notificationCount]);

  useEffect(() => {
    const nextKeys = criticalAlerts.map((alert) => `${alert.product_id}:${alert.storage_location}`);
    const previousKeys = previousAlertKeys.current;
    const newAlerts = criticalAlerts.filter(
      (alert) => !previousKeys.includes(`${alert.product_id}:${alert.storage_location}`),
    );

    if (newAlerts.length > 0) {
      setStockNotifications((prev) => {
        const additions = newAlerts.map((alert) => {
          const quantity = parseFloat(alert.quantity || "0");
          const status = quantity <= 0 ? "Produto esgotado" : "Estoque critico";
          return {
            id: `${alert.product_id}:${alert.storage_location}:${Date.now()}:${Math.random()}`,
            title: status,
            description: `${alert.product_name} no ${alert.storage_location} com ${quantity.toFixed(0)} un.`,
            createdAt: new Date().toISOString(),
          };
        });
        return [...additions, ...prev].slice(0, 12);
      });
    }

    previousAlertKeys.current = nextKeys;
  }, [criticalAlerts]);

  useEffect(() => {
    if (!alertsAutoOpened.current && criticalAlerts.length > 0) {
      setAlertsPanelOpen(true);
      alertsAutoOpened.current = true;
    }
  }, [criticalAlerts]);

  useEffect(() => {
    const handleIncomingNotification = (event: Event) => {
      const customEvent = event as CustomEvent<any>;
      const payload = customEvent.detail || {};
      const title = payload?.title || payload?.data?.title || payload?.type || "Notificacao";
      const description =
        payload?.message ||
        payload?.detail ||
        payload?.data?.message ||
        "Nova notificacao recebida.";

      setStockNotifications((prev) => [
        {
          id: `remote:${Date.now()}`,
          title: String(title),
          description: String(description),
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 12));
    };

    window.addEventListener("new-notification", handleIncomingNotification as EventListener);
    return () => window.removeEventListener("new-notification", handleIncomingNotification as EventListener);
  }, []);

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
        return <SettingsScreen onOpenSetup={() => setShowSetup(true)} />;
      case "categories":
        return <CategoriesScreen />;
      case "tables":
        return <TablesScreen />;
      case "tabs":
        return <TabsScreen />;
      case "sales":
        return <SalesHistoryScreen />;
      case "fastfood":
        return <FastfoodAdminScreen />;
      case "finance":
        return isAdmin ? <FinanceScreen /> : <OverviewScreen />;
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
                    disabled={perms.can_open_cash_register === false}
                  >
                    <Money24Regular className="w-5 h-5" />
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${currentRegister?.status === "open"
                        ? "bg-emerald-500"
                        : "bg-red-500"
                        }`} />
                      <span className="hidden sm:inline text-xs">
                        {currentRegister?.status === "open" ? "Fechar Caixa" : "Abrir Caixa"}
                      </span>
                      <span className="hidden md:inline text-[11px] text-muted-foreground">
                        {currentRegister?.status === "open" ? "Caixa aberto" : "Caixa fechado"}
                      </span>
                    </div>
                  </Button>

                  {/* Status bar */}
                  <div className="hidden sm:flex items-center gap-4 text-muted-foreground">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setAlertsPanelOpen((prev) => !prev)}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                          notificationCount > 0
                            ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300"
                            : "border-border bg-card text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <AlertOff24Regular className={`w-5 h-5 ${notificationCount > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
                        <span>
                          {notificationCount} alerta{notificationCount === 1 ? "" : "s"}
                        </span>
                      </button>

                      {alertsPanelOpen && (
                        <div className="absolute right-0 top-12 z-30 w-[340px] rounded-xl border border-border bg-card p-3 shadow-2xl">
                          <div className="mb-3 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-foreground">Alertas de Estoque</p>
                              <p className="text-xs text-muted-foreground">Atualizacao automatica em tempo real</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setAlertsPanelOpen(false)}
                              className="text-xs text-muted-foreground hover:text-foreground"
                            >
                              Fechar
                            </button>
                          </div>

                          <div className="max-h-[420px] overflow-y-auto pr-1 windows-scrollbar">
                            <div className="space-y-2">
                              {criticalAlerts.length === 0 ? (
                                <div className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
                                  Nenhum produto em alerta neste momento.
                                </div>
                              ) : (
                              criticalAlerts.map((alert) => {
                                const quantity = parseFloat(alert.quantity || "0");
                                const isOut = quantity <= 0;
                                return (
                                  <div
                                    key={`${alert.product_id}-${alert.storage_location}`}
                                    className={`rounded-lg border px-3 py-2 ${
                                      isOut
                                        ? "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20"
                                        : "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-foreground">{alert.product_name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          Local: {alert.storage_location} • Min: {parseFloat(alert.min_quantity || "0").toFixed(0)} un
                                        </p>
                                      </div>
                                      <span className={`text-xs font-semibold ${isOut ? "text-red-600 dark:text-red-300" : "text-amber-700 dark:text-amber-300"}`}>
                                        {isOut ? "Esgotado" : `${quantity.toFixed(0)} un`}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                            </div>

                            <div className="mt-3 border-t border-border pt-3">
                              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Notificacoes Recentes
                              </p>
                              <div className="space-y-2">
                                {stockNotifications.length === 0 ? (
                                  <p className="text-xs text-muted-foreground">Nenhuma notificacao recebida ainda.</p>
                                ) : (
                                  stockNotifications.slice(0, 5).map((notice) => (
                                    <div key={notice.id} className="rounded-lg bg-secondary/40 px-3 py-2">
                                      <p className="text-xs font-semibold text-foreground">{notice.title}</p>
                                      <p className="text-xs text-muted-foreground">{notice.description}</p>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
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
                          <span className="text-xs text-emerald-500">âš¡</span>
                        )}
                      </div>
                    ) : (
                      <BatteryCharge24Regular className="w-5 h-5" />
                    )}
                    {/* Hardware Plugin Status */}
                    <div className="flex items-center gap-1.5" title={hardwareConnected ? "Plugin de hardware conectado" : hardwareConnecting ? "Conectando ao plugin..." : "Plugin de hardware nÃ£o conectado"}>
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

            {showInstallCard && (
              <div className="mb-3 md:mb-4 p-3 rounded-xl border border-primary/30 bg-primary/5 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <ArrowDownload24Regular className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Instale o app SkyPDV</p>
                  <p className="text-xs text-muted-foreground">Acesse mais rÃ¡pido e use em modo offline.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowInstallCard(false)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Depois
                  </button>
                  <Button size="sm" onClick={handleInstallPwa}>
                    Instalar
                  </Button>
                </div>
              </div>
            )}

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
              canSell={perms.can_sell}
              parkedSales={parkedSales.map(({ id, label, createdAt, customerName, items }) => ({
                id,
                label,
                createdAt,
                customerName,
                items,
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




