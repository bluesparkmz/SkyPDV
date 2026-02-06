import React, { useEffect, useMemo, useState, FormEvent } from "react";
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
    BuildingShop24Regular,
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

type FastfoodView = "dashboard" | "orders" | "sales" | "products" | "ads" | "settings";

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
    const [dateFilter, setDateFilter] = useState<string>("");
    const [products, setProducts] = useState<FastFoodProduct[]>([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [ads, setAds] = useState<any[]>([]);
    const [adsLoading, setAdsLoading] = useState(false);
    const [isAdSheetOpen, setIsAdSheetOpen] = useState(false);
    const [adForm, setAdForm] = useState({
        name: "",
        description: "",
        days: 7,
        price: "" as string | number,
        link: "",
    });
    const [isCreatingAd, setIsCreatingAd] = useState(false);
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

        if (activeView === "ads" && restaurant) {
            const fetchAds = async () => {
                try {
                    setAdsLoading(true);
                    const restaurantAds = await fastfoodApi.getRestaurantAds(restaurant.id);
                    setAds(restaurantAds);
                } catch (error) {
                    toast.error("Erro ao carregar anúncios");
                } finally {
                    setAdsLoading(false);
                }
            };
            fetchAds();
        }
    }, [activeView, restaurant]);

    // Real-time notification handler
    useEffect(() => {
        const handleNewOrder = (event: any) => {
            const data = event.detail;
            const orderId = data.data?.reference_id || data.data?.order_id || data.order_id;
            console.log("Real-time: New order received!", data, "Order ID:", orderId);

            // Play notification sound
            try {
                const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
                audio.play().catch(e => console.warn("Could not play notification sound:", e));
            } catch (e) {
                console.warn("Audio error:", e);
            }

            toast.info("Novo pedido recebido!", {
                description: `Pedido #${orderId || 'FastFood'}`,
                action: {
                    label: "Ver Pedidos",
                    onClick: () => setActiveView("orders")
                }
            });

            // Refresh data to get the new order
            fetchDashboard();
        };

        const handleOrderStatusUpdate = (event: any) => {
            const data = event.detail;
            const orderId = data.data?.reference_id || data.data?.order_id || data.order_id;
            const newStatus = data.new_status || data.data?.notification_type?.replace('order_', '');

            console.log("Real-time: Order status update!", { orderId, newStatus, data });

            if (orderId && newStatus) {
                // Update the order in the local state without full refresh
                setOrders(prevOrders => {
                    const orderIndex = prevOrders.findIndex(o => o.id === Number(orderId));
                    if (orderIndex !== -1) {
                        const updatedOrders = [...prevOrders];
                        updatedOrders[orderIndex] = {
                            ...updatedOrders[orderIndex],
                            status: newStatus
                        };
                        return updatedOrders;
                    }
                    // If order not found, refresh to get it
                    fetchDashboard();
                    return prevOrders;
                });

                // Show toast notification
                toast.success(`Pedido #${orderId} atualizado para: ${newStatus}`, {
                    duration: 3000
                });
            } else {
                // Fallback: refresh if we can't identify the order
                fetchDashboard();
            }
        };

        const handleGenericNotification = (event: any) => {
            const data = event.detail;
            const notificationType = data.data?.notification_type || data.data?.type || data.tipo || '';

            // Only refresh if it's an order-related notification
            if (notificationType?.startsWith('order_') || data.data?.reference_type === 'FastFoodOrder') {
                console.log("Real-time: Order-related notification received, refreshing...");
                fetchDashboard();
            }
        };

        window.addEventListener('fastfood-new-order' as any, handleNewOrder);
        window.addEventListener('fastfood-order-status-update' as any, handleOrderStatusUpdate);
        window.addEventListener('fastfood-order-update' as any, handleGenericNotification);
        window.addEventListener('new-notification' as any, handleGenericNotification);

        return () => {
            window.removeEventListener('fastfood-new-order' as any, handleNewOrder);
            window.removeEventListener('fastfood-order-status-update' as any, handleOrderStatusUpdate);
            window.removeEventListener('fastfood-order-update' as any, handleGenericNotification);
            window.removeEventListener('new-notification' as any, handleGenericNotification);
        };
    }, []);

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

    const handleDeleteAd = async (adId: number) => {
        if (!confirm("Tem certeza que deseja deletar este anúncio?")) return;
        try {
            await fastfoodApi.deleteAd(adId);
            toast.success("Anúncio deletado");
            if (restaurant) {
                const restaurantAds = await fastfoodApi.getRestaurantAds(restaurant.id);
                setAds(restaurantAds);
            }
        } catch (error) {
            toast.error("Erro ao deletar anúncio");
        }
    };

    const handleRenewAd = async (adId: number, days: number) => {
        try {
            await fastfoodApi.renewAd(adId, days);
            toast.success(`Anúncio renovado por ${days} dias`);
            if (restaurant) {
                const restaurantAds = await fastfoodApi.getRestaurantAds(restaurant.id);
                setAds(restaurantAds);
            }
        } catch (error) {
            toast.error("Erro ao renovar anúncio");
        }
    };

    const handleCreateAd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!restaurant) return;

        try {
            setIsCreatingAd(true);
            const formData = new FormData();
            formData.append("restaurant_id", String(restaurant.id));
            formData.append("name", adForm.name);
            formData.append("description", adForm.description);
            formData.append("days", String(adForm.days));
            if (adForm.price) formData.append("price", String(adForm.price));
            if (adForm.link) formData.append("link", adForm.link);

            const fileInput = document.getElementById("ad-image") as HTMLInputElement;
            if (fileInput?.files?.[0]) {
                formData.append("image", fileInput.files[0]);
            }

            await fastfoodApi.createRestaurantAd(formData);
            toast.success("Anúncio criado com sucesso!");
            setIsAdSheetOpen(false);
            setAdForm({ name: "", description: "", days: 7, price: "", link: "" });

            // Refresh ads
            const restaurantAds = await fastfoodApi.getRestaurantAds(restaurant.id);
            setAds(restaurantAds);
        } catch (error: any) {
            toast.error(error.message || "Erro ao criar anúncio");
        } finally {
            setIsCreatingAd(false);
        }
    };

    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            const matchesSearch =
                !searchQuery ||
                order.id.toString().includes(searchQuery.toLowerCase()) ||
                order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase());

            const orderDateStr = new Date(order.created_at).toISOString().split('T')[0];
            const matchesDate = !dateFilter || orderDateStr === dateFilter;

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

    const renderAds = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-black text-foreground">Anúncios e Promoções</h3>
                    <p className="text-sm text-muted-foreground">Promova seu restaurante no app Fastfood</p>
                </div>
                <Button
                    className="bg-orange-500 hover:bg-orange-600 font-bold gap-2"
                    onClick={() => {
                        if (restaurant) {
                            setAdForm(prev => ({
                                ...prev,
                                name: `Promover ${restaurant.name}`,
                                description: restaurant.category
                                    ? `O melhor de ${restaurant.category} em ${restaurant.neighborhood || 'sua região'}! Aproveite nossas ofertas.`
                                    : `Peça o melhor do ${restaurant.name} agora mesmo pelo Fastfood!`,
                                link: `https://fastfood.skyvenda.com/${restaurant.slug}`,
                            }));
                        }
                        setIsAdSheetOpen(true);
                    }}
                >
                    <ArrowTrendingLines24Regular className="w-5 h-5" />
                    Promover Restaurante
                </Button>
            </div>

            {adsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="fluent-card p-4 space-y-3">
                            <div className="h-32 bg-secondary/50 rounded-lg animate-pulse" />
                            <div className="h-6 bg-secondary w-3/4 animate-pulse" />
                            <div className="h-4 bg-secondary w-1/2 animate-pulse" />
                        </div>
                    ))}
                </div>
            ) : ads.length === 0 ? (
                <div className="fluent-card p-12 text-center text-muted-foreground">
                    <ArrowTrendingLines24Regular className="w-16 h-16 mx-auto mb-4 opacity-10" />
                    <h4 className="text-lg font-bold mb-2">Sem Anúncios Ativos</h4>
                    <p className="max-w-md mx-auto mb-6">Aumente sua visibilidade e receba mais pedidos aparecendo nos destaques do nosso aplicativo.</p>
                    <Button variant="outline" onClick={() => {
                        if (restaurant) {
                            setAdForm(prev => ({
                                ...prev,
                                name: `Promover ${restaurant.name}`,
                                description: restaurant.category
                                    ? `O melhor de ${restaurant.category} em ${restaurant.neighborhood || 'sua região'}! Aproveite nossas ofertas.`
                                    : `Peça o melhor do ${restaurant.name} agora mesmo pelo Fastfood!`,
                                link: `https://fastfood.skyvenda.com/${restaurant.slug}`,
                            }));
                        }
                        setIsAdSheetOpen(true);
                    }}>Criar meu primeiro anúncio</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ads.map(ad => (
                        <div key={ad.id} className="fluent-card overflow-hidden group border-transparent hover:border-orange-500 transition-all">
                            <div className="relative h-40 bg-secondary/30">
                                {ad.photo ? (
                                    <img src={ad.photo} alt={ad.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center opacity-20">
                                        <Food24Regular className="w-12 h-12" />
                                    </div>
                                )}
                                <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase shadow-lg ${ad.status === 'approved' ? 'bg-emerald-500 text-white' :
                                    ad.status === 'pending' ? 'bg-yellow-500 text-white' :
                                        'bg-red-500 text-white'
                                    }`}>
                                    {ad.status === 'approved' && ad.days_remaining && ad.days_remaining <= 0 ? 'Expirado' : ad.status}
                                </div>
                            </div>
                            <div className="p-4 space-y-3">
                                <div>
                                    <h4 className="font-bold text-foreground truncate">{ad.name}</h4>
                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{ad.description}</p>
                                </div>

                                <div className="flex justify-between items-center text-sm pt-2 border-t border-border">
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <Timer24Regular className="w-4 h-4" />
                                        <span className="text-xs">
                                            {ad.days_remaining != null
                                                ? `${ad.days_remaining} dias restantes`
                                                : 'Duração não definida'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 font-bold text-orange-600">
                                        <ArrowSync24Regular className="w-4 h-4" />
                                        <span>{ad.clicks || 0} cliques</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 text-xs"
                                        onClick={() => handleRenewAd(ad.id, 7)}
                                    >
                                        Renovar (7d)
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-500 hover:text-red-600 border-red-100 hover:bg-red-50"
                                        onClick={() => handleDeleteAd(ad.id)}
                                    >
                                        <DismissCircle24Regular className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Sheet open={isAdSheetOpen} onOpenChange={setIsAdSheetOpen}>
                <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle className="text-2xl font-black">Promover Restaurante</SheetTitle>
                        <SheetDescription>Seu anúncio aparecerá nos destaques do aplicativo Fastfood.</SheetDescription>
                    </SheetHeader>

                    <form onSubmit={handleCreateAd} className="mt-8 space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Nome da Campanha</label>
                            <Input
                                required
                                value={adForm.name}
                                onChange={e => setAdForm({ ...adForm, name: e.target.value })}
                                placeholder="Ex: Promoção de Verão"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Descrição</label>
                            <textarea
                                required
                                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={adForm.description}
                                onChange={e => setAdForm({ ...adForm, description: e.target.value })}
                                placeholder="Descreva sua promoção em poucas palavras..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Duração (Dias)</label>
                                <Input
                                    type="number"
                                    required
                                    min={1}
                                    value={adForm.days}
                                    onChange={e => setAdForm({ ...adForm, days: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Preço Destaque (Opt)</label>
                                <Input
                                    type="number"
                                    value={adForm.price || ""}
                                    onChange={e => setAdForm({ ...adForm, price: e.target.value })}
                                    placeholder="MT"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Link Adicional (Opt)</label>
                            <Input
                                value={adForm.link}
                                onChange={e => setAdForm({ ...adForm, link: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Imagem do Anúncio</label>
                            <Input id="ad-image" type="file" accept="image/*" className="cursor-pointer" />
                            <p className="text-[10px] text-muted-foreground italic">Se não selecionar, usaremos sua foto de capa.</p>
                        </div>

                        <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                            <div className="flex justify-between items-center text-orange-800 dark:text-orange-400">
                                <span className="font-bold">Total Estimado:</span>
                                <span className="text-xl font-black">{(Number(adForm.days) * 115).toFixed(2)} MT</span>
                            </div>
                            <p className="text-[10px] text-orange-600 mt-1">* Sujeito a taxas de serviço e promoções vigentes.</p>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-orange-500 hover:bg-orange-600 h-12 text-md font-bold"
                            disabled={isCreatingAd}
                        >
                            {isCreatingAd ? "Criando Anúncio..." : "Confirmar e Promover"}
                        </Button>
                    </form>
                </SheetContent>
            </Sheet>
        </div>
    );

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

    const [settingsForm, setSettingsForm] = useState<any>({});
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);

    useEffect(() => {
        if (restaurant) {
            setSettingsForm({
                name: restaurant.name,
                phone: restaurant.phone,
                address: restaurant.address,
                province: (restaurant as any).province,
                district: (restaurant as any).district,
                neighborhood: (restaurant as any).neighborhood,
                avenue: (restaurant as any).avenue,
                location_google_maps: (restaurant as any).location_google_maps,
                opening_time: (restaurant as any).opening_time,
                closing_time: (restaurant as any).closing_time,
                min_delivery_value: (restaurant as any).min_delivery_value,
                latitude: (restaurant as any).latitude,
                longitude: (restaurant as any).longitude,
            });
        }
    }, [restaurant]);

    const handleSettingsChange = (key: string, value: any) => {
        setSettingsForm(prev => ({ ...prev, [key]: value }));
    };

    const handleUpdateLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocalização não é suportada pelo navegador.");
            return;
        }

        setIsUpdatingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setSettingsForm(prev => ({
                    ...prev,
                    latitude,
                    longitude,
                }));
                toast.success("Localização do restaurante atualizada. Clique em salvar para aplicar.");
                setIsUpdatingLocation(false);
            },
            () => {
                toast.error("Erro ao obter localização. Verifique as permissões do navegador.");
                setIsUpdatingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!restaurant) return;

        try {
            setSettingsLoading(true);
            const formData = new FormData();
            Object.keys(settingsForm).forEach(key => {
                if (settingsForm[key] !== null && settingsForm[key] !== undefined) {
                    formData.append(key, settingsForm[key]);
                }
            });

            // Handle file uploads (basic implementation)
            const coverInput = document.getElementById('cover-image') as HTMLInputElement;
            if (coverInput?.files?.[0]) {
                formData.append('cover_image', coverInput.files[0]);
            }

            await fastfoodApi.updateRestaurant(restaurant.id, formData);
            toast.success("Configurações atualizadas com sucesso!");
            fetchDashboard(); // Refresh data
        } catch (error) {
            toast.error("Erro ao atualizar configurações");
        } finally {
            setSettingsLoading(false);
        }
    };

    const renderSettings = () => (
        <div className="max-w-4xl space-y-6 pb-20">
            <div className="fluent-card p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-border pb-4">
                    <div>
                        <h3 className="text-xl font-bold text-foreground">Configurações do Restaurante</h3>
                        <p className="text-sm text-muted-foreground">Gerencie informações visíveis no aplicativo</p>
                    </div>
                    <Button onClick={handleSaveSettings} disabled={settingsLoading} className="bg-orange-500 hover:bg-orange-600 font-bold">
                        {settingsLoading ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                </div>

                <form onSubmit={handleSaveSettings} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h4 className="font-semibold text-lg flex items-center gap-2"><BuildingShop24Regular className="text-orange-500" /> Informações Básicas</h4>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nome do Restaurante</label>
                                <Input
                                    value={settingsForm.name || ''}
                                    onChange={e => handleSettingsChange('name', e.target.value)}
                                    placeholder="Ex: Restaurante Saboroso"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Telefone de Contato</label>
                                <Input
                                    value={settingsForm.phone || ''}
                                    onChange={e => handleSettingsChange('phone', e.target.value)}
                                    placeholder="Ex: +258 84 123 4567"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Abertura</label>
                                    <Input
                                        type="time"
                                        value={settingsForm.opening_time || ''}
                                        onChange={e => handleSettingsChange('opening_time', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Fecho</label>
                                    <Input
                                        type="time"
                                        value={settingsForm.closing_time || ''}
                                        onChange={e => handleSettingsChange('closing_time', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Taxa Mínima de Entrega (MT)</label>
                                <Input
                                    type="number"
                                    value={settingsForm.min_delivery_value || ''}
                                    onChange={e => handleSettingsChange('min_delivery_value', e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-semibold text-lg flex items-center gap-2"><Location24Regular className="text-orange-500" /> Localização</h4>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Província</label>
                                    <Input
                                        value={settingsForm.province || ''}
                                        onChange={e => handleSettingsChange('province', e.target.value)}
                                        placeholder="Ex: Maputo Cidade"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Distrito</label>
                                    <Input
                                        value={settingsForm.district || ''}
                                        onChange={e => handleSettingsChange('district', e.target.value)}
                                        placeholder="Ex: Kampfumo"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Bairro</label>
                                <Input
                                    value={settingsForm.neighborhood || ''}
                                    onChange={e => handleSettingsChange('neighborhood', e.target.value)}
                                    placeholder="Ex: Polana Cimento"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Avenida / Rua / Endereço</label>
                                <Input
                                    value={settingsForm.address || settingsForm.avenue || ''}
                                    onChange={e => {
                                        handleSettingsChange('address', e.target.value);
                                        handleSettingsChange('avenue', e.target.value);
                                    }}
                                    placeholder="Ex: Av. Julius Nyerere, nº 123"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Link Google Maps</label>
                                <Input
                                    value={settingsForm.location_google_maps || ''}
                                    onChange={e => handleSettingsChange('location_google_maps', e.target.value)}
                                    placeholder="https://maps.goo..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Coordenadas (Latitude / Longitude)</label>
                                <div className="text-xs text-muted-foreground">
                                    {settingsForm.latitude != null && settingsForm.longitude != null
                                        ? `${settingsForm.latitude}, ${settingsForm.longitude}`
                                        : "Ainda não definido"}
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleUpdateLocation}
                                    disabled={settingsLoading || isUpdatingLocation}
                                    className="mt-1"
                                >
                                    {isUpdatingLocation ? "Capturando localização..." : "Atualizar localização"}
                                </Button>
                                <p className="text-[11px] text-muted-foreground">
                                    Use este botão apenas quando estiver fisicamente no restaurante. A localização será a do dispositivo.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border">
                        <h4 className="font-semibold text-lg flex items-center gap-2 mb-4"><Box24Regular className="text-orange-500" /> Mídia</h4>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Imagem de Capa</label>
                            <Input id="cover-image" type="file" accept="image/*" className="cursor-pointer" />
                            <p className="text-xs text-muted-foreground">Recomendado: 800x400px ou maior.</p>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border mt-6">
                        <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg flex items-start gap-3">
                            <div className="mt-1 p-1 bg-orange-500 rounded-full text-white">
                                <CheckmarkCircle24Regular className="w-4 h-4" />
                            </div>
                            <div>
                                <h5 className="font-bold text-orange-800 dark:text-orange-400">Sincronização Automática</h5>
                                <p className="text-sm text-orange-700/80 dark:text-orange-400/80">
                                    Você pode controlar o Status (Aberto/Fechado) usando o botão no topo da página.
                                    Produtos marcados como 'Fastfood' no inventário do SkyPDV aparecerão automaticamente.
                                </p>
                            </div>
                        </div>
                    </div>
                </form>
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
                    <NavItem value="ads" icon={<ArrowTrendingLines24Regular />}>
                        Anúncios
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
                    {activeView === "ads" && renderAds()}
                    {activeView === "settings" && renderSettings()}

                    {renderOrderDetailsSheet()}
                </div>
            </div>
        </div>
    );
}
