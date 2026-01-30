import { useState, useEffect } from "react";
import {
    Food24Regular,
    List24Regular,
    Settings24Regular,
    ArrowSync24Regular,
    Timer24Regular,
    CheckmarkCircle24Regular,
    DismissCircle24Regular,
    Person24Regular,
    Phone24Regular,
    MapPin24Regular,
} from "@fluentui/react-icons";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { fastfoodApi } from "@/services/fastfoodApi";
import { FastFoodOrder, Restaurant } from "../services/fastfoodApi";

export function FastfoodAdminScreen() {
    const [activeTab, setActiveTab] = useState<"orders" | "settings">("orders");
    const [orders, setOrders] = useState<FastFoodOrder[]>([]);
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchDashboard = async () => {
        try {
            setIsLoading(true);
            // Pega o primeiro restaurante do usuário gerenciado
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
        // Polling básico para pedidos a cada 30s
        const interval = setInterval(fetchDashboard, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleUpdateStatus = async (orderId: number, status: string) => {
        try {
            await fastfoodApi.updateOrderStatus(orderId, { status: status as any });
            toast.success(`Pedido #${orderId} atualizado para ${status}`);
            fetchDashboard();
        } catch (error) {
            toast.error("Erro ao atualizar pedido");
        }
    };

    const handleToggleStatus = async () => {
        if (!restaurant) return;
        try {
            const res = await fastfoodApi.toggleRestaurantStatus(restaurant.id);
            setRestaurant(prev => prev ? { ...prev, is_open: res.is_open } : null);
            toast.success(res.is_open ? "Restaurante Aberto" : "Restaurante Fechado");
        } catch (error) {
            toast.error("Erro ao alterar status");
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-border bg-background/80 backdrop-blur-md">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                            <Food24Regular className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold">Gestão Fastfood</h1>
                            <p className="text-sm text-muted-foreground">{restaurant?.name || "Carregando..."}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={fetchDashboard}
                            className="fluent-button gap-2"
                            disabled={isLoading}
                        >
                            <ArrowSync24Regular className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
                            <span className="hidden sm:inline">Atualizar</span>
                        </button>
                        <button
                            onClick={handleToggleStatus}
                            className={`fluent-button font-bold ${restaurant?.is_open ? "text-red-500" : "text-emerald-500"}`}
                        >
                            {restaurant?.is_open ? "Fechar Loja" : "Abrir Loja"}
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mt-6">
                    <button
                        onClick={() => setActiveTab("orders")}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === "orders" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        <List24Regular className="w-5 h-5" />
                        Pedidos Ativos
                    </button>
                    <button
                        onClick={() => setActiveTab("settings")}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === "settings" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        <Settings24Regular className="w-5 h-5" />
                        Configurações
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 md:p-6 overflow-auto windows-scrollbar">
                {activeTab === "orders" ? (
                    <div className="space-y-4">
                        {orders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                <Timer24Regular className="w-12 h-12 mb-4 opacity-20" />
                                <p>Nenhum pedido ativo no momento</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                {orders.map((order) => (
                                    <div key={order.id} className="fluent-card p-4 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg font-bold">#{order.id}</span>
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-100 text-orange-600">
                                                        {order.status}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                                    <Person24Regular className="w-4 h-4" />
                                                    <span>{order.customer_name}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-black text-primary">{(Number(order.total_amount) || 0).toFixed(2)} MT</p>
                                                <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleTimeString()}</p>
                                            </div>
                                        </div>

                                        <div className="bg-secondary/30 rounded-lg p-3 space-y-2">
                                            {order.items?.map((item, idx) => (
                                                <div key={idx} className="flex justify-between text-sm">
                                                    <span>{item.quantity}x {item.product_name}</span>
                                                    <span className="font-medium">{(Number(item.price) * item.quantity).toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex gap-2">
                                            {order.status === "pending" && (
                                                <button
                                                    onClick={() => handleUpdateStatus(order.id, "preparing")}
                                                    className="flex-1 fluent-button fluent-button-primary"
                                                >
                                                    Aceitar Pedido
                                                </button>
                                            )}
                                            {order.status === "preparing" && (
                                                <button
                                                    onClick={() => handleUpdateStatus(order.id, "ready")}
                                                    className="flex-1 fluent-button bg-emerald-500 text-white"
                                                >
                                                    Marcar como Pronto
                                                </button>
                                            )}
                                            {(order.status === "pending" || order.status === "preparing") && (
                                                <button
                                                    onClick={() => handleUpdateStatus(order.id, "cancelled")}
                                                    className="p-2 rounded-lg bg-red-100 text-red-600"
                                                >
                                                    <DismissCircle24Regular className="w-6 h-6" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="max-w-2xl space-y-6">
                        <div className="fluent-card p-6 space-y-4">
                            <h3 className="text-lg font-bold">Detalhes do Restaurante</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Nome</label>
                                    <p className="font-medium">{restaurant?.name}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Status Comercial</label>
                                    <p className={`font-black ${restaurant?.is_open ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {restaurant?.is_open ? 'ABERTO' : 'FECHADO'}
                                    </p>
                                </div>
                                <div className="space-y-1 flex items-center gap-2">
                                    <Phone24Regular className="w-5 h-5 text-primary" />
                                    <span>{restaurant?.phone || "Não informado"}</span>
                                </div>
                                <div className="space-y-1 flex items-center gap-2">
                                    <MapPin24Regular className="w-5 h-5 text-primary" />
                                    <span>{restaurant?.address || "Sem endereço"}</span>
                                </div>
                            </div>
                        </div>

                        <div className="fluent-card p-6 bg-primary/5 border-primary/20">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-full bg-primary/10 text-primary">
                                    <CheckmarkCircle24Regular className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold">Sincronização Ativa</h4>
                                    <p className="text-sm text-muted-foreground">Seus produtos do SkyPDV marcados como 'Fastfood' aparecem automaticamente no aplicativo.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
