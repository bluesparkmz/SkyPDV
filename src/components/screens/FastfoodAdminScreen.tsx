import { useEffect, useMemo, useState } from "react";
import {
    Food24Regular,
    ChartMultiple24Regular,
    Receipt24Regular,
    Box24Regular,
    Settings24Regular,
    ArrowSync24Regular,
    Timer24Regular,
    CheckmarkCircle24Regular,
    DismissCircle24Regular,
    Person24Regular,
    Phone24Regular,
    Location24Regular,
    Search24Regular,
    CalendarLtr24Regular,
    Money24Regular,
    ShoppingBag24Regular,
    Star24Regular,
    ArrowTrendingLines24Regular,
} from "@fluentui/react-icons";
import type { DrawerProps } from "@fluentui/react-components";
import {
    Hamburger,
    NavDrawer,
    NavDrawerBody,
    NavDrawerHeader,
    NavItem,
    NavSectionHeader,
    makeStyles,
    Tooltip,
    useRestoreFocusTarget,
} from "@fluentui/react-components";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { fastfoodApi, FastFoodOrder, Restaurant, FastFoodProduct } from "@/services/fastfoodApi";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSales } from "@/hooks/useSales";

const useStyles = makeStyles({
    root: {
        overflow: "hidden",
        display: "flex",
        flex: 1,
        minHeight: 0,
    },
    nav: {
        minWidth: "260px",
    },
    content: {
        flex: 1,
        minWidth: 0,
    },
});

type FastfoodView = "dashboard" | "orders" | "sales" | "products" | "settings";

export function FastfoodAdminScreen() {
    const styles = useStyles();
    const isMobile = useIsMobile();
    const drawerType: Required<DrawerProps>["type"] = isMobile ? "overlay" : "inline";
    const [isNavOpen, setIsNavOpen] = useState(false);
    const restoreFocusTargetAttributes = useRestoreFocusTarget();
    const [activeView, setActiveView] = useState<FastfoodView>("dashboard");

    const [orders, setOrders] = useState<FastFoodOrder[]>([]);
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split('T')[0]);
    const [products, setProducts] = useState<FastFoodProduct[]>([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<FastFoodOrder | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Fetch sales data for the sales view
    const { data: salesData = [], isLoading: salesLoading } = useSales({
        limit: 100,
        status: "completed",
    });

    useEffect(() => {
        setIsNavOpen(!isMobile);
    }, [isMobile]);

    const fetchDashboard = async () => {
        try {
            setIsLoading(true);
            const restaurants = await fastfoodApi.getMyRestaurants();
            if (restaurants.length > 0) {
                const res = restaurants[0];
                setRestaurant(res);
                const activeOrders = await fastfoodApi.getRestaurantOrders(res.id);
                setOrders(activeOrders);
            }
        } catch (error) {
            toast.error("Erro ao carregar dados do Fastfood");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
        const interval = setInterval(fetchDashboard, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (activeView === "products" && restaurant) {
            const fetchProducts = async () => {
                try {
                    setProductsLoading(true);
                    const prods = await fastfoodApi.getFastfoodProducts(restaurant.id);
                    setProducts(prods);
                } catch (error) {
                    toast.error("Erro ao carregar produtos");
                } finally {
                    setProductsLoading(false);
                }
            };
            fetchProducts();
        }
    }, [activeView, restaurant]);

    const handleUpdateStatus = async (orderId: number, status: string) => {
        try {
            if (status === "preparing") {
                await fastfoodApi.acceptOrder(orderId);
            } else if (status === "completed") {
                await fastfoodApi.completeOrder(orderId);
            } else if (status === "rejected") {
                await fastfoodApi.rejectOrder(orderId);
            } else {
                await fastfoodApi.updateOrderStatus(orderId, { status: status as any });
            }
            toast.success(`Pedido #${orderId} atualizado para ${status}`);
            fetchDashboard();
        } catch (error) {
            toast.error("Erro ao atualizar pedido");
        }
    };

    const handleToggleStatus = () => {
        if (restaurant) {
            fastfoodApi.toggleRestaurantStatus(restaurant.id)
                .then(res => {
                    setRestaurant(prev => prev ? { ...prev, is_open: res.is_open } : null);
                    toast.success(res.is_open ? "Restaurante aberto" : "Restaurante fechado");
                })
                .catch(() => toast.error("Erro ao mudar status do restaurante"));
        }
    };

    const handleViewDetails = (order: FastFoodOrder) => {
        setSelectedOrder(order);
        setIsDetailsOpen(true);
    };

    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            const matchesSearch =
                !searchQuery ||
                order.id.toString().includes(searchQuery.toLowerCase()) ||
                order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesDate =
                !dateFilter ||
                new Date(order.created_at).toLocaleDateString("pt-BR") ===
                new Date(dateFilter).toLocaleDateString("pt-BR");

            return matchesSearch && matchesDate;
        });
    }, [orders, searchQuery, dateFilter]);

    // Calculate statistics
    const stats = useMemo(() => {
        const today = new Date().toLocaleDateString("pt-BR");
        const todayOrders = orders.filter(o => new Date(o.created_at).toLocaleDateString("pt-BR") === today);
        const totalRevenue = todayOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
        const pendingOrders = orders.filter(o => o.status === "pending").length;
        const preparingOrders = orders.filter(o => o.status === "preparing").length;

        return {
            totalRevenue,
            todayOrders: todayOrders.length,
            pendingOrders,
            preparingOrders,
        };
    }, [orders]);

    const renderOrderDetailsSheet = () => {
        if (!selectedOrder) return null;

        const statusColors = {
            pending: "bg-red-100 text-red-700",
            preparing: "bg-yellow-100 text-yellow-700",
            ready: "bg-green-100 text-green-700",
            delivering: "bg-blue-100 text-blue-700",
            completed: "bg-emerald-100 text-emerald-700",
            cancelled: "bg-gray-100 text-gray-700",
            rejected: "bg-gray-100 text-gray-700",
        };

        return (
            <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
                    <SheetHeader className="text-left">
                        <div className="flex justify-between items-center pr-8">
                            <SheetTitle className="text-2xl font-black">Pedido #{selectedOrder.id}</SheetTitle>
                            <div className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${statusColors[selectedOrder.status as keyof typeof statusColors]}`}>
                                {selectedOrder.status.toUpperCase()}
                            </div>
                        </div>
                        <SheetDescription>
                            Realizado em {new Date(selectedOrder.created_at).toLocaleString()}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="mt-8 space-y-6">
                        {/* Customer Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Cliente</h3>
                            <div className="fluent-card p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <Person24Regular className="w-5 h-5 text-orange-500" />
                                    <div>
                                        <p className="text-sm font-bold">{selectedOrder.customer_name || "N/A"}</p>
                                        <p className="text-xs text-muted-foreground">Nome do Cliente</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone24Regular className="w-5 h-5 text-orange-500" />
                                    <div className="flex-1 flex justify-between items-center">
                                        <div>
                                            <p className="text-sm font-bold">{selectedOrder.customer_phone || "N/A"}</p>
                                            <p className="text-xs text-muted-foreground">Telefone</p>
                                        </div>
                                        {selectedOrder.customer_phone && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => window.open(`https://wa.me/${selectedOrder.customer_phone?.replace(/\D/g, '')}`, '_blank')}
                                                className="h-8 gap-1"
                                            >
                                                <Person24Regular className="w-4 h-4" /> WhatsApp
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                {selectedOrder.order_type === "distance" && (
                                    <div className="flex items-start gap-3">
                                        <Location24Regular className="w-5 h-5 text-orange-500 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-bold">{selectedOrder.delivery_address || "Endereço não informado"}</p>
                                            <p className="text-xs text-muted-foreground">Endereço de Entrega</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Itens do Pedido</h3>
                            <div className="fluent-card p-0 overflow-hidden">
                                <div className="p-4 space-y-4">
                                    {selectedOrder.items?.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-start">
                                            <div className="flex gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center text-lg">
                                                    📦
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold">{item.product_name}</p>
                                                    <p className="text-xs text-muted-foreground">{item.quantity}x {item.price} MT</p>
                                                </div>
                                            </div>
                                            <p className="text-sm font-bold text-orange-600">
                                                {(Number(item.price) * item.quantity).toFixed(2)} MT
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-secondary/30 p-4 border-t border-border">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold">Total</span>
                                        <span className="text-xl font-black text-orange-600">
                                            {(Number(selectedOrder.total_value) || 0).toFixed(2)} MT
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment & Status */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Pagamento e Tipo</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="fluent-card p-3">
                                    <p className="text-[10px] text-muted-foreground uppercase font-black">Tipo</p>
                                    <p className="text-sm font-bold flex items-center gap-1 mt-1">
                                        {selectedOrder.order_type === "distance" ? <ShoppingBag24Regular className="w-4 h-4" /> : <Food24Regular className="w-4 h-4" />}
                                        {selectedOrder.order_type === "distance" ? "Delivery" : "Local"}
                                    </p>
                                </div>
                                <div className="fluent-card p-3">
                                    <p className="text-[10px] text-muted-foreground uppercase font-black">Pagamento</p>
                                    <p className="text-sm font-bold mt-1 uppercase">{selectedOrder.payment_method}</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-4 flex flex-col gap-2">
                            {selectedOrder.status === "pending" && (
                                <div className="flex gap-2">
                                    <Button
                                        className="flex-1 bg-orange-500 hover:bg-orange-600 h-12 text-md font-bold"
                                        onClick={() => {
                                            handleUpdateStatus(selectedOrder.id, "preparing");
                                            setIsDetailsOpen(false);
                                        }}
                                    >
                                        Aceitar Pedido
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 h-12 font-bold"
                                        onClick={() => {
                                            handleUpdateStatus(selectedOrder.id, "rejected");
                                            setIsDetailsOpen(false);
                                        }}
                                    >
                                        Rejeitar
                                    </Button>
                                </div>
                            )}

                            {selectedOrder.status === "preparing" && (
                                <Button
                                    className="w-full bg-emerald-500 hover:bg-emerald-600 h-12 text-md font-bold"
                                    onClick={() => {
                                        handleUpdateStatus(selectedOrder.id, "ready");
                                        setIsDetailsOpen(false);
                                    }}
                                >
                                    Marcar como Pronto
                                </Button>
                            )}

                            {selectedOrder.status === "ready" && (
                                <Button
                                    className="w-full bg-blue-500 hover:bg-blue-600 h-12 text-md font-bold"
                                    onClick={() => {
                                        handleUpdateStatus(selectedOrder.id, "delivering");
                                        setIsDetailsOpen(false);
                                    }}
                                >
                                    Saiu para Entrega
                                </Button>
                            )}

                            {selectedOrder.status === "delivering" && (
                                <Button
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-md font-bold text-white shadow-lg"
                                    onClick={() => {
                                        handleUpdateStatus(selectedOrder.id, "completed");
                                        setIsDetailsOpen(false);
                                    }}
                                >
                                    Confirmar Entrega
                                </Button>
                            )}

                            {(selectedOrder.status === "pending" || selectedOrder.status === "preparing") && (
                                <Button
                                    variant="ghost"
                                    className="w-full h-10 text-xs font-bold text-muted-foreground hover:text-red-500"
                                    onClick={() => {
                                        handleUpdateStatus(selectedOrder.id, "cancelled");
                                        setIsDetailsOpen(false);
                                    }}
                                >
                                    Cancelar Pedido
                                </Button>
                            )}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        );
    };

    const renderDashboard = () => (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
                {/* Revenue Card */}
                <div className="fluent-card p-4 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/10 border-orange-200 dark:border-orange-800">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase mb-1">Receita Hoje</p>
                            {isLoading ? (
                                <div className="h-8 w-32 bg-orange-200/50 dark:bg-orange-800/50 rounded animate-pulse"></div>
                            ) : (
                                <p className="text-2xl font-black text-orange-700 dark:text-orange-300">{stats.totalRevenue.toFixed(2)} MT</p>
                            )}
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                            <Money24Regular className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Today Orders */}
                <div className="fluent-card p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 border-amber-200 dark:border-amber-800">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase mb-1">Pedidos Hoje</p>
                            {isLoading ? (
                                <div className="h-8 w-20 bg-amber-200/50 dark:bg-amber-800/50 rounded animate-pulse"></div>
                            ) : (
                                <p className="text-2xl font-black text-amber-700 dark:text-amber-300">{stats.todayOrders}</p>
                            )}
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                            <ShoppingBag24Regular className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Pending Orders */}
                <div className="fluent-card p-4 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/20 dark:to-red-900/10 border-red-200 dark:border-red-800">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase mb-1">Pendentes</p>
                            {isLoading ? (
                                <div className="h-8 w-16 bg-red-200/50 dark:bg-red-800/50 rounded animate-pulse"></div>
                            ) : (
                                <p className="text-2xl font-black text-red-700 dark:text-red-300">{stats.pendingOrders}</p>
                            )}
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/30">
                            <Timer24Regular className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Preparing Orders */}
                <div className="fluent-card p-4 bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/20 dark:to-yellow-900/10 border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 uppercase mb-1">Em Preparo</p>
                            {isLoading ? (
                                <div className="h-8 w-16 bg-yellow-200/50 dark:bg-yellow-800/50 rounded animate-pulse"></div>
                            ) : (
                                <p className="text-2xl font-black text-yellow-700 dark:text-yellow-300">{stats.preparingOrders}</p>
                            )}
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-yellow-500 flex items-center justify-center text-white shadow-lg shadow-yellow-500/30">
                            <Food24Regular className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="fluent-card">
                <div className="p-4 border-b border-border">
                    <h3 className="text-lg font-bold text-foreground">Pedidos Recentes</h3>
                    <p className="text-sm text-muted-foreground">Últimos pedidos do dia</p>
                </div>
                <div className="p-4">
                    {isLoading ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="w-10 h-10 rounded-full bg-orange-200/50 dark:bg-orange-800/50 animate-pulse"></div>
                                        <div className="space-y-2 flex-1">
                                            <div className="h-4 w-32 bg-secondary rounded animate-pulse"></div>
                                            <div className="h-3 w-16 bg-secondary/70 rounded animate-pulse"></div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-5 w-24 bg-secondary rounded animate-pulse ml-auto"></div>
                                        <div className="h-4 w-16 bg-secondary/70 rounded animate-pulse ml-auto"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : orders.slice(0, 5).length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Timer24Regular className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>Nenhum pedido ainda hoje</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {orders.slice(0, 5).map((order) => (
                                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold">
                                            #{order.id}
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">{order.customer_name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(order.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-orange-600">{Number(order.total_amount || 0).toFixed(2)} MT</p>
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${order.status === "pending" ? "bg-red-100 text-red-700" :
                                            order.status === "preparing" ? "bg-yellow-100 text-yellow-700" :
                                                order.status === "ready" ? "bg-green-100 text-green-700" :
                                                    "bg-gray-100 text-gray-700"
                                            }`}>
                                            {order.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderOrders = () => (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                <div className="relative flex-1">
                    <Search24Regular className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                    <Input
                        placeholder="Buscar pedido, cliente..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 md:pl-10 h-9 md:h-10 text-xs md:text-sm"
                    />
                </div>
                <div className="flex gap-2">
                    <div className="relative flex-1 sm:flex-none">
                        <CalendarLtr24Regular className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                        <Input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="pl-9 md:pl-10 h-9 md:h-10 text-xs md:text-sm"
                        />
                    </div>
                    {dateFilter && (
                        <Button
                            variant="outline"
                            onClick={() => setDateFilter("")}
                            size="sm"
                            className="h-9 md:h-10"
                        >
                            Limpar
                        </Button>
                    )}
                </div>
            </div>

            {/* Orders Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="fluent-card p-4 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-2 flex-1">
                                    <div className="h-6 w-24 bg-secondary rounded animate-pulse"></div>
                                    <div className="h-4 w-32 bg-secondary/70 rounded animate-pulse"></div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-6 w-28 bg-secondary rounded animate-pulse ml-auto"></div>
                                    <div className="h-3 w-16 bg-secondary/70 rounded animate-pulse ml-auto"></div>
                                </div>
                            </div>
                            <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-3 space-y-2 border border-orange-200/50 dark:border-orange-800/50">
                                <div className="h-4 w-full bg-orange-200/50 dark:bg-orange-800/50 rounded animate-pulse"></div>
                                <div className="h-4 w-3/4 bg-orange-200/50 dark:bg-orange-800/50 rounded animate-pulse"></div>
                            </div>
                            <div className="h-10 w-full bg-secondary rounded animate-pulse"></div>
                        </div>
                    ))}
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="fluent-card p-8 text-center text-muted-foreground">
                    <Timer24Regular className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>Nenhum pedido encontrado</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {filteredOrders.map((order) => (
                        <div key={order.id} className="fluent-card p-4 space-y-4 hover:shadow-md transition-shadow cursor-pointer border-transparent hover:border-orange-200 dark:hover:border-orange-800" onClick={() => handleViewDetails(order)}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-bold text-foreground">#{order.id}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${order.status === "pending" ? "bg-red-100 text-red-700" :
                                            order.status === "preparing" ? "bg-yellow-100 text-yellow-700" :
                                                order.status === "ready" ? "bg-green-100 text-green-700" :
                                                    order.status === "delivering" ? "bg-blue-100 text-blue-700" :
                                                        order.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                                                            "bg-gray-100 text-gray-700"
                                            }`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                        <Person24Regular className="w-4 h-4" />
                                        <span>{order.customer_name || "N/A"}</span>
                                    </div>
                                    {order.order_type === "distance" && (
                                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-orange-600 font-bold uppercase">
                                            <ShoppingBag24Regular className="w-3 h-3" />
                                            <span>Delivery</span>
                                        </div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-black text-orange-600">{(Number(order.total_value) || 0).toFixed(2)} MT</p>
                                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleTimeString()}</p>
                                </div>
                            </div>

                            <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-3 space-y-2 border border-orange-200/50 dark:border-orange-800/50">
                                {order.items?.slice(0, 2).map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span className="text-foreground">{item.quantity}x {item.product_name}</span>
                                        <span className="font-medium text-orange-600">{(Number(item.price) * item.quantity).toFixed(2)} MT</span>
                                    </div>
                                ))}
                                {order.items && order.items.length > 2 && (
                                    <p className="text-xs text-muted-foreground text-center pt-1 border-t border-orange-200/30">
                                        + {order.items.length - 2} outros itens
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                <button
                                    onClick={() => handleViewDetails(order)}
                                    className="flex-1 fluent-button bg-secondary text-secondary-foreground hover:bg-secondary/70 font-bold text-xs"
                                >
                                    Ver Detalhes
                                </button>
                                {order.status === "pending" && (
                                    <button
                                        onClick={() => handleUpdateStatus(order.id, "preparing")}
                                        className="flex-1 fluent-button bg-orange-500 text-white hover:bg-orange-600 font-bold text-xs"
                                    >
                                        Aceitar
                                    </button>
                                )}
                                {order.status === "preparing" && (
                                    <button
                                        onClick={() => handleUpdateStatus(order.id, "ready")}
                                        className="flex-1 fluent-button bg-emerald-500 text-white hover:bg-emerald-600 font-bold text-xs"
                                    >
                                        Pronto
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderSales = () => {
        // Filter and categorize sales (using salesData from component level hook)
        const onlineSales = salesData.filter(sale => sale.sale_type === "online" || sale.sale_type === "delivery");
        const offlineSales = salesData.filter(sale => sale.sale_type === "local");

        // Calculate stats
        const onlineRevenue = onlineSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
        const offlineRevenue = offlineSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
        const totalRevenue = onlineRevenue + offlineRevenue;

        return (
            <div className="space-y-4">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Online Sales - Highlighted */}
                    <div className="fluent-card p-6 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/10 border-orange-200 dark:border-orange-800 border-2">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-orange-500/10">
                                <ShoppingBag24Regular className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase">Vendas Online (Delivery)</p>
                                <p className="text-[10px] text-orange-500">Foco Fastfood</p>
                            </div>
                        </div>
                        {salesLoading ? (
                            <div className="space-y-2">
                                <div className="h-8 w-32 bg-orange-200/50 dark:bg-orange-800/50 rounded animate-pulse"></div>
                                <div className="h-4 w-20 bg-orange-200/30 dark:bg-orange-800/30 rounded animate-pulse"></div>
                            </div>
                        ) : (
                            <>
                                <p className="text-3xl font-black text-orange-700 dark:text-orange-300">{onlineRevenue.toFixed(2)} MT</p>
                                <p className="text-xs text-muted-foreground mt-1">{onlineSales.length} pedidos online</p>
                            </>
                        )}
                    </div>

                    {/* Offline Sales */}
                    <div className="fluent-card p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-3 mb-2">
                            <Receipt24Regular className="w-8 h-8 text-blue-600" />
                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">Vendas Local (Offline)</p>
                        </div>
                        {salesLoading ? (
                            <div className="space-y-2">
                                <div className="h-8 w-32 bg-blue-200/50 dark:bg-blue-800/50 rounded animate-pulse"></div>
                                <div className="h-4 w-20 bg-blue-200/30 dark:bg-blue-800/30 rounded animate-pulse"></div>
                            </div>
                        ) : (
                            <>
                                <p className="text-3xl font-black text-blue-700 dark:text-blue-300">{offlineRevenue.toFixed(2)} MT</p>
                                <p className="text-xs text-muted-foreground mt-1">{offlineSales.length} vendas locais</p>
                            </>
                        )}
                    </div>

                    {/* Total Sales */}
                    <div className="fluent-card p-6 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/10 border-emerald-200 dark:border-emerald-800">
                        <div className="flex items-center gap-3 mb-2">
                            <ArrowTrendingLines24Regular className="w-8 h-8 text-emerald-600" />
                            <p className="text-xs font-semibold text-emerald-600 uppercase">Total Geral</p>
                        </div>
                        {salesLoading ? (
                            <div className="space-y-2">
                                <div className="h-8 w-32 bg-emerald-200/50 dark:bg-emerald-800/50 rounded animate-pulse"></div>
                                <div className="h-4 w-20 bg-emerald-200/30 dark:bg-emerald-800/30 rounded animate-pulse"></div>
                            </div>
                        ) : (
                            <>
                                <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300">{totalRevenue.toFixed(2)} MT</p>
                                <p className="text-xs text-muted-foreground mt-1">{salesData.length} vendas totais</p>
                            </>
                        )}
                    </div>
                </div>

                {/* Online Sales Section - Highlighted */}
                <div className="fluent-card border-2 border-orange-200 dark:border-orange-800">
                    <div className="p-4 border-b border-border bg-orange-50/50 dark:bg-orange-950/20">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                            <h3 className="text-lg font-bold text-orange-700 dark:text-orange-400">Vendas Online - Delivery Fastfood</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">Pedidos realizados via aplicativo</p>
                    </div>
                    <div className="p-4">
                        {salesLoading ? (
                            <div className="space-y-2">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-950/10 border border-orange-200/50 dark:border-orange-800/50">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="w-10 h-10 rounded-full bg-orange-200/50 dark:bg-orange-800/50 animate-pulse"></div>
                                            <div className="space-y-2 flex-1">
                                                <div className="h-4 w-32 bg-orange-200/50 dark:bg-orange-800/50 rounded animate-pulse"></div>
                                                <div className="h-3 w-48 bg-orange-200/30 dark:bg-orange-800/30 rounded animate-pulse"></div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="h-5 w-24 bg-orange-200/50 dark:bg-orange-800/50 rounded animate-pulse ml-auto"></div>
                                            <div className="h-3 w-16 bg-orange-200/30 dark:bg-orange-800/30 rounded animate-pulse ml-auto"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : onlineSales.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <ShoppingBag24Regular className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>Nenhuma venda online ainda</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {onlineSales.slice(0, 10).map((sale) => (
                                    <div key={sale.id} className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-950/10 border border-orange-200/50 dark:border-orange-800/50 hover:bg-orange-100 dark:hover:bg-orange-950/20 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold shadow-lg shadow-orange-500/30">
                                                <ShoppingBag24Regular className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">
                                                    {sale.customer_name || "Cliente"} • {sale.receipt_number || `#${sale.id}`}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>{sale.sale_type === "online" ? "🌐 Online" : "🛵 Delivery"}</span>
                                                    <span>•</span>
                                                    <span>{new Date(sale.created_at).toLocaleString("pt-BR")}</span>
                                                    {sale.delivery_address && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="truncate max-w-[200px]">{sale.delivery_address}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-orange-600">{Number(sale.total || 0).toFixed(2)} MT</p>
                                            <p className="text-xs text-muted-foreground">{sale.items.length} itens</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Offline Sales Section */}
                <div className="fluent-card">
                    <div className="p-4 border-b border-border">
                        <h3 className="text-lg font-bold text-foreground">Vendas Local (Balcão)</h3>
                        <p className="text-sm text-muted-foreground">Vendas realizadas no PDV local</p>
                    </div>
                    <div className="p-4">
                        {salesLoading ? (
                            <div className="space-y-2">
                                {[1, 2].map((i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="w-10 h-10 rounded-full bg-secondary rounded animate-pulse"></div>
                                            <div className="space-y-2 flex-1">
                                                <div className="h-4 w-32 bg-secondary rounded animate-pulse"></div>
                                                <div className="h-3 w-24 bg-secondary/70 rounded animate-pulse"></div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="h-5 w-24 bg-secondary rounded animate-pulse ml-auto"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : offlineSales.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Receipt24Regular className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                <p className="text-sm">Nenhuma venda local</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {offlineSales.slice(0, 5).map((sale) => (
                                    <div key={sale.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                                                <Receipt24Regular className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">
                                                    {sale.customer_name || "Cliente"} • {sale.receipt_number || `#${sale.id}`}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(sale.created_at).toLocaleString("pt-BR")}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-primary">{Number(sale.total || 0).toFixed(2)} MT</p>
                                            <p className="text-xs text-muted-foreground">{sale.items.length} itens</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderProducts = () => {
        const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
        const activeProducts = products.filter(p => p.is_active);

        return (
            <div className="space-y-4">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="fluent-card p-4 text-center">
                        <div className="text-3xl font-black text-orange-600">{products.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Produtos Fastfood</p>
                        <p className="text-[10px] text-muted-foreground">Total configurados</p>
                    </div>
                    <div className="fluent-card p-4 text-center">
                        <div className="text-3xl font-black text-blue-600">{categories.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Categorias</p>
                        <p className="text-[10px] text-muted-foreground">Organize seu cardápio</p>
                    </div>
                    <div className="fluent-card p-4 text-center">
                        <div className="text-3xl font-black text-emerald-600">{activeProducts.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Ativos</p>
                        <p className="text-[10px] text-muted-foreground">Disponíveis para pedidos</p>
                    </div>
                </div>

                {/* Products List */}
                <div className="fluent-card">
                    <div className="p-4 border-b border-border">
                        <h3 className="text-lg font-bold text-foreground">Lista de Produtos</h3>
                        <p className="text-sm text-muted-foreground">Produtos marcados para o FastFood</p>
                    </div>
                    <div className="p-4">
                        {productsLoading ? (
                            <div className="space-y-2">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                                        <div className="w-16 h-16 rounded-lg bg-orange-200/50 dark:bg-orange-800/50 animate-pulse"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 w-32 bg-secondary rounded animate-pulse"></div>
                                            <div className="h-3 w-24 bg-secondary/70 rounded animate-pulse"></div>
                                        </div>
                                        <div className="h-6 w-20 bg-secondary rounded animate-pulse"></div>
                                    </div>
                                ))}
                            </div>
                        ) : products.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Box24Regular className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p className="font-medium mb-2">Nenhum produto FastFood configurado</p>
                                <p className="text-sm">Configure produtos na tela Produtos do SkyPDV</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                {products.map((product) => (
                                    <div key={product.id} className="fluent-card p-4 hover:bg-secondary/30 transition-colors">
                                        <div className="flex items-start gap-3">
                                            <div className="w-16 h-16 rounded-lg bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-4xl flex-shrink-0">
                                                {product.emoji || "📦"}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-foreground truncate">{product.name}</h4>
                                                {product.category && (
                                                    <p className="text-xs text-muted-foreground capitalize">{product.category}</p>
                                                )}
                                                <p className="text-lg font-black text-orange-600 mt-1">
                                                    {product.price.toFixed(2)} MT
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderSettings = () => (
        <div className="max-w-2xl space-y-6">
            <div className="fluent-card p-6 space-y-4">
                <h3 className="text-lg font-bold text-foreground">Detalhes do Restaurante</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Nome</label>
                        <p className="font-medium text-foreground">{restaurant?.name}</p>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Status Comercial</label>
                        <p className={`font-black ${restaurant?.is_open ? 'text-emerald-500' : 'text-red-500'}`}>
                            {restaurant?.is_open ? 'ABERTO' : 'FECHADO'}
                        </p>
                    </div>
                    <div className="space-y-1 flex items-center gap-2">
                        <Phone24Regular className="w-5 h-5 text-orange-500" />
                        <span className="text-foreground">{restaurant?.phone || "Não informado"}</span>
                    </div>
                    <div className="space-y-1 flex items-center gap-2">
                        <Location24Regular className="w-5 h-5 text-orange-500" />
                        <span className="text-foreground">{restaurant?.address || "Sem endereço"}</span>
                    </div>
                </div>
            </div>

            <div className="fluent-card p-6 bg-orange-50 dark:bg-orange-950/10 border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-orange-500/10 text-orange-600">
                        <CheckmarkCircle24Regular className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="font-bold text-foreground">Sincronização Ativa</h4>
                        <p className="text-sm text-muted-foreground">Seus produtos do SkyPDV marcados como 'Fastfood' aparecem automaticamente no aplicativo.</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className={styles.root}>
            <NavDrawer
                selectedValue={activeView}
                open={isNavOpen}
                type={drawerType}
                className={styles.nav}
                onOpenChange={(_, data) => setIsNavOpen(data.open)}
                onNavItemSelect={(_, data) => {
                    setActiveView(data.value as FastfoodView);
                    if (isMobile) setIsNavOpen(false);
                }}
            >
                <NavDrawerHeader>
                    <Hamburger onClick={() => setIsNavOpen((v) => !v)} />
                </NavDrawerHeader>
                <NavDrawerBody>
                    <NavSectionHeader>Fastfood Admin</NavSectionHeader>
                    <NavItem value="dashboard" icon={<ChartMultiple24Regular />}>
                        Dashboard
                    </NavItem>
                    <NavItem value="orders" icon={<Receipt24Regular />}>
                        Pedidos
                    </NavItem>
                    <NavItem value="sales" icon={<Money24Regular />}>
                        Vendas
                    </NavItem>
                    <NavItem value="products" icon={<Box24Regular />}>
                        Produtos
                    </NavItem>
                    <NavItem value="settings" icon={<Settings24Regular />}>
                        Configurações
                    </NavItem>
                </NavDrawerBody>
            </NavDrawer>

            <div className={styles.content + " flex flex-col h-full overflow-hidden"}>
                {/* Fixed Header */}
                <div className="p-3 md:p-6 border-b border-border bg-background/80 backdrop-blur-md z-10">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            {(isMobile || !isNavOpen) && (
                                <Tooltip content="Abrir menu" relationship="label">
                                    <Hamburger
                                        onClick={() => setIsNavOpen(true)}
                                        {...restoreFocusTargetAttributes}
                                        aria-expanded={isNavOpen}
                                        className="md:hidden"
                                    />
                                </Tooltip>
                            )}
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                                    <Food24Regular className="w-5 h-5 md:w-6 md:h-6" />
                                </div>
                                <div>
                                    <h1 className="text-lg md:text-2xl font-bold text-foreground">Gestão Fastfood</h1>
                                    <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">{restaurant?.name || "Carregando..."}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={fetchDashboard}
                                className="fluent-button gap-2 px-3 justify-center h-10"
                                disabled={isLoading}
                            >
                                <ArrowSync24Regular className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
                                <span className="hidden sm:inline">Atualizar</span>
                            </button>
                            <button
                                onClick={handleToggleStatus}
                                className={`fluent-button font-bold h-10 px-4 ${restaurant?.is_open ? "bg-red-500 text-white hover:bg-red-600" : "bg-emerald-500 text-white hover:bg-emerald-600"}`}
                            >
                                {restaurant?.is_open ? "Fechar" : "Abrir"}
                            </button>
                            {!isNavOpen && !isMobile && (
                                <Tooltip content="Abrir menu" relationship="label">
                                    <Hamburger
                                        onClick={() => setIsNavOpen(true)}
                                        {...restoreFocusTargetAttributes}
                                        aria-expanded={isNavOpen}
                                    />
                                </Tooltip>
                            )}
                        </div>
                    </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 p-3 md:p-6 overflow-auto windows-scrollbar">
                    {activeView === "dashboard" && renderDashboard()}
                    {activeView === "orders" && renderOrders()}
                    {activeView === "sales" && renderSales()}
                    {activeView === "products" && renderProducts()}
                    {activeView === "settings" && renderSettings()}

                    {renderOrderDetailsSheet()}
                </div>
            </div>
        </div>
    );
}
