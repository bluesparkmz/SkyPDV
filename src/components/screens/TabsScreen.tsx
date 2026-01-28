import { useState, useEffect } from "react";
import {
  PeopleTeam24Regular,
  Add24Regular,
  Checkmark24Regular,
  Dismiss24Regular,
  Edit24Regular,
  DocumentText24Regular,
  Money24Regular,
  Clock24Regular,
  Receipt24Regular,
  Phone24Regular,
  Calendar24Regular,
} from "@fluentui/react-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRestaurants, useTabs, useCreateTab } from "@/hooks/useFastFood";
import { Tab, TabCreate } from "@/services/fastfoodApi";
import { fastfoodApi } from "@/services/fastfoodApi";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export function TabsScreen() {
  const { data: restaurants = [] } = useRestaurants();
  const restaurantId = restaurants[0]?.id || 0;

  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<Tab | null>(null);
  const [newTab, setNewTab] = useState<TabCreate>({
    client_name: "",
    client_phone: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");

  // Buscar todas as contas (sem filtro de status) para que o usuário possa filtrar no frontend
  const { data: tabs = [], isLoading, refetch } = useTabs(restaurantId, undefined);
  const createTab = useCreateTab();

  const openTabsCount = tabs.filter(t => t.status === "open").length;
  const totalOpenBalance = tabs.filter(t => t.status === "open").reduce((acc, t) => acc + t.current_balance, 0);
  const totalTabs = tabs.length;

  // Filtrar contas por status
  const filteredTabs = tabs.filter((tab) => {
    if (statusFilter === "all") return true;
    return tab.status === statusFilter;
  });

  const handleCreateTab = async () => {
    if (!restaurantId || !newTab.client_name.trim()) {
      toast.error("Nome do cliente é obrigatório");
      return;
    }

    try {
      await createTab.mutateAsync({
        restaurantId,
        data: newTab,
      });
      setIsCreateModalOpen(false);
      setNewTab({ client_name: "", client_phone: "" });
      refetch();
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleCloseTab = async () => {
    if (!restaurantId || !selectedTab) return;

    try {
      // O backend espera TabUpdate com status e payment_method como query param
      await fastfoodApi.updateTab(
        restaurantId,
        selectedTab.id,
        { status: "closed" },
        paymentMethod
      );
      toast.success("Conta fechada com sucesso!");
      setIsCloseModalOpen(false);
      setSelectedTab(null);
      setPaymentMethod("cash");
      refetch();
    } catch (error: any) {
      toast.error(`Erro ao fechar conta: ${error.message}`);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "MZN",
    }).format(value);
  };

  if (!restaurantId) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <PeopleTeam24Regular className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Nenhum restaurante encontrado</h3>
          <p className="text-muted-foreground">
            Conecte um restaurante FastFood para gerenciar contas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Fixed Header */}
      <div className="p-3 md:p-6 border-b border-border bg-background/80 backdrop-blur-md z-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary flex items-center justify-center text-white">
              <PeopleTeam24Regular className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-foreground">Contas</h1>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Gerencie comandas e saldos</p>
            </div>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="gap-2 px-3 h-9 md:h-10"
          >
            <Add24Regular className="w-5 h-5" />
            <span className="hidden sm:inline">Nova Conta</span>
          </Button>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 p-3 md:p-6 overflow-auto windows-scrollbar">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="fluent-card p-3 md:p-4 bg-primary/5 border-l-4 border-l-primary">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase">Saldo em Aberto</p>
                <p className="text-sm md:text-xl font-bold text-primary">{totalOpenBalance.toFixed(2)} MT</p>
              </div>
              <Money24Regular className="w-4 h-4 md:w-5 md:h-5 text-primary opacity-50" />
            </div>
          </div>
          <div className="fluent-card p-3 md:p-4 bg-emerald-500/5 border-l-4 border-l-emerald-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase">Contas Abertas</p>
                <p className="text-sm md:text-xl font-bold text-emerald-600">{openTabsCount}</p>
              </div>
              <Receipt24Regular className="w-4 h-4 md:w-5 md:h-5 text-emerald-500 opacity-50" />
            </div>
          </div>
          <div className="fluent-card p-3 md:p-4 bg-secondary/50 border-l-4 border-l-muted-foreground hidden sm:block">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase">Total de Contas</p>
                <p className="text-sm md:text-xl font-bold text-foreground">{totalTabs}</p>
              </div>
              <PeopleTeam24Regular className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground opacity-50" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger className="w-[140px] md:w-[180px] h-9 md:h-10 text-xs md:text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="open">Abertas</SelectItem>
              <SelectItem value="closed">Fechadas</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-[10px] md:text-sm text-muted-foreground">
            {filteredTabs.length} encontrada{filteredTabs.length !== 1 ? "s" : ""}
          </div>
        </div>


        {/* Tabs List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">Carregando contas...</div>
            </div>
          ) : filteredTabs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <PeopleTeam24Regular className="w-16 h-16 mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma conta encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {statusFilter === "all"
                  ? "Crie uma nova conta para começar"
                  : statusFilter === "open"
                    ? "Não há contas abertas no momento"
                    : "Não há contas fechadas"}
              </p>
              {statusFilter === "all" && (
                <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
                  <Add24Regular className="w-4 h-4" />
                  Criar Primeira Conta
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
              {filteredTabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`fluent-card p-3 md:p-4 hover:shadow-md transition-shadow flex flex-col ${tab.status === "open"
                    ? "border-l-4 border-l-success"
                    : "border-l-4 border-l-muted-foreground"
                    }`}
                >
                  <div className="flex items-start justify-between mb-2 md:mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm md:text-lg mb-0.5 md:mb-1 truncate">{tab.client_name}</h3>
                      {tab.client_phone && (
                        <div className="flex items-center gap-1 text-[10px] md:text-sm text-muted-foreground">
                          <Phone24Regular className="w-3 h-3 md:w-4 md:h-4" />
                          {tab.client_phone}
                        </div>
                      )}
                    </div>
                    <Badge
                      variant={tab.status === "open" ? "default" : "secondary"}
                      className={`text-[9px] md:text-xs px-1.5 py-0 md:px-2 md:py-0.5 h-auto ${tab.status === "open"
                        ? "bg-success text-white"
                        : "bg-muted-foreground text-white"
                        }`}
                    >
                      {tab.status === "open" ? "Aberta" : "Fechada"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between mb-3 md:mb-4 bg-secondary/30 p-2 rounded-lg">
                    <div className="flex flex-col">
                      <span className="text-[10px] md:text-sm text-muted-foreground flex items-center gap-1">
                        <Money24Regular className="w-3 h-3 md:w-4 md:h-4" />
                        Saldo
                      </span>
                      <span className="font-bold text-base md:text-xl text-primary">
                        {formatCurrency(tab.current_balance)}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] md:text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar24Regular className="w-2.5 h-2.5 md:w-3 md:h-3" />
                        Desde
                      </span>
                      <span className="text-[10px] md:text-xs font-medium">
                        {new Date(tab.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-auto">
                    {tab.status === "open" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1 md:gap-2 text-[10px] md:text-sm h-8 md:h-9"
                        onClick={() => {
                          setSelectedTab(tab);
                          setIsCloseModalOpen(true);
                        }}
                      >
                        <Checkmark24Regular className="w-3 h-3 md:w-4 md:h-4" />
                        Fechar
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`flex-1 text-[10px] md:text-sm h-8 md:h-9 ${tab.status !== "open" ? "w-full" : ""}`}
                      onClick={async () => {
                        try {
                          const orders = await fastfoodApi.getTabOrders(restaurantId, tab.id);
                          toast.info(`Esta conta tem ${orders.length} pedido(s)`);
                        } catch (error: any) {
                          toast.error(`Erro ao buscar pedidos: ${error.message}`);
                        }
                      }}
                    >
                      Pedidos
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Tab Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Conta de Cliente</DialogTitle>
              <DialogDescription>
                Abra uma nova conta para um cliente. O saldo será atualizado conforme pedidos forem adicionados.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="client_name">Nome do Cliente *</Label>
                <Input
                  id="client_name"
                  value={newTab.client_name}
                  onChange={(e) =>
                    setNewTab({ ...newTab, client_name: e.target.value })
                  }
                  placeholder="Ex: João Silva"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_phone">Telefone (Opcional)</Label>
                <Input
                  id="client_phone"
                  value={newTab.client_phone || ""}
                  onChange={(e) =>
                    setNewTab({ ...newTab, client_phone: e.target.value })
                  }
                  placeholder="84..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateTab}
                disabled={!newTab.client_name.trim() || createTab.isPending}
              >
                {createTab.isPending ? "Criando..." : "Criar Conta"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Close Tab Modal */}
        <Dialog open={isCloseModalOpen} onOpenChange={setIsCloseModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Fechar Conta</DialogTitle>
              <DialogDescription>
                Fechar a conta de {selectedTab?.client_name}. O saldo atual é{" "}
                {selectedTab && formatCurrency(selectedTab.current_balance)}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="payment_method">Método de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                    <SelectItem value="skywallet">SkyWallet</SelectItem>
                    <SelectItem value="pos">Cartão (POS)</SelectItem>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCloseModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCloseTab} className="gap-2">
                <Checkmark24Regular className="w-4 h-4" />
                Fechar Conta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

