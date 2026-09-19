import { useEffect, useState } from "react";
import {
  Add24Regular,
  ArrowClockwise24Regular,
  Calendar24Regular,
  CheckmarkCircle24Regular,
  Delete24Regular,
  DismissCircle24Regular,
  Edit24Regular,
  Filter24Regular,
  Money24Regular,
  Payment24Regular,
  Person24Regular,
  Receipt24Regular,
  Search24Regular,
  Wrench24Regular,
} from "@fluentui/react-icons";
import { toast } from "sonner";

import { ServiceDialog } from "@/components/ServiceDialog";
import { ServiceOrderDialog } from "@/components/ServiceOrderDialog";
import {
  CreatePDVService,
  CreatePDVServiceOrder,
  PDVService,
  PDVServiceOrder,
  PDVServiceSummary,
  serviceOrdersApi,
  servicesApi,
} from "@/services/api";

type TabType = "orders" | "catalog";

export function ServicesScreen() {
  const [activeTab, setActiveTab] = useState<TabType>("orders");
  const [services, setServices] = useState<PDVService[]>([]);
  const [orders, setOrders] = useState<PDVServiceOrder[]>([]);
  const [summary, setSummary] = useState<PDVServiceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchCatalog, setSearchCatalog] = useState("");

  // Dialogs state
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<PDVService | null>(null);

  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [orderInitialServiceId, setOrderInitialServiceId] = useState<number | null>(null);

  // Carregar dados
  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedServices, fetchedOrders, fetchedSummary] = await Promise.all([
        servicesApi.list(),
        serviceOrdersApi.list({ limit: 100 }),
        serviceOrdersApi.getSummary().catch(() => null),
      ]);
      setServices(fetchedServices || []);
      setOrders(fetchedOrders || []);
      setSummary(fetchedSummary);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao carregar serviços.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers para Serviço (Catálogo)
  const handleSaveService = async (data: { name: string; price: number }) => {
    try {
      if (editingService) {
        await servicesApi.update(editingService.id, data);
        toast.success("Serviço actualizado com sucesso!");
      } else {
        await servicesApi.create(data as CreatePDVService);
        toast.success("Serviço criado com sucesso!");
      }
      setEditingService(null);
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao gravar serviço.");
      throw err;
    }
  };

  const handleDeactivateService = async (service: PDVService) => {
    if (!confirm(`Tem a certeza que deseja desactivar o serviço "${service.name}"?`)) return;
    try {
      await servicesApi.delete(service.id);
      toast.success("Serviço desactivado.");
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao desactivar serviço.");
    }
  };

  // Handler para Registar Serviço Prestado
  const handleCreateOrder = async (data: CreatePDVServiceOrder) => {
    try {
      await serviceOrdersApi.create(data);
      toast.success("Serviço prestado registado com sucesso no caixa!");
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao registar serviço prestado.");
      throw err;
    }
  };

  // Filtrar serviços no catálogo
  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(searchCatalog.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden">
      {/* Header Superior */}
      <div className="p-4 md:p-6 border-b border-border bg-card/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Wrench24Regular className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
                Controlo de Serviços
              </h1>
              <p className="text-xs text-muted-foreground">
                Catálogo de serviços e registo de prestações de serviço com crédito no caixa
              </p>
            </div>
          </div>
        </div>

        {/* Acções Principais */}
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-lg border border-input bg-background hover:bg-muted text-foreground transition-colors"
            title="Actualizar dados"
          >
            <ArrowClockwise24Regular className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => {
              setEditingService(null);
              setIsServiceDialogOpen(true);
            }}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-input bg-background hover:bg-muted text-foreground flex items-center gap-1.5 transition-colors"
          >
            <Add24Regular className="w-4 h-4 text-primary" />
            Novo Serviço
          </button>

          <button
            onClick={() => {
              setOrderInitialServiceId(null);
              setIsOrderDialogOpen(true);
            }}
            disabled={services.filter((s) => s.is_active).length === 0}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
          >
            <Receipt24Regular className="w-4 h-4" />
            Registar Serviço Prestado
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 md:px-6 pt-3 border-b border-border bg-card/20 flex gap-4">
        <button
          onClick={() => setActiveTab("orders")}
          className={`pb-3 text-xs md:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "orders"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Receipt24Regular className="w-4 h-4" />
          Serviços Prestados & Receita
        </button>
        <button
          onClick={() => setActiveTab("catalog")}
          className={`pb-3 text-xs md:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "catalog"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Wrench24Regular className="w-4 h-4" />
          Catálogo ({services.length})
        </button>
      </div>

      {/* Conteúdo da Tab */}
      <div className="flex-1 overflow-auto p-4 md:p-6 windows-scrollbar space-y-6">
        {activeTab === "orders" ? (
          <>
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-border bg-card shadow-sm flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Money24Regular className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Receita Total de Serviços</div>
                  <div className="text-xl md:text-2xl font-bold text-foreground">
                    {summary
                      ? parseFloat(summary.total_revenue).toLocaleString("pt-MZ", { minimumFractionDigits: 2 })
                      : "0,00"}{" "}
                    MT
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card shadow-sm flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Receipt24Regular className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Serviços Prestados</div>
                  <div className="text-xl md:text-2xl font-bold text-foreground">
                    {summary ? summary.total_orders : orders.length}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card shadow-sm flex items-center gap-3">
                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Wrench24Regular className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Preço Médio por Serviço</div>
                  <div className="text-xl md:text-2xl font-bold text-foreground">
                    {summary
                      ? parseFloat(summary.average_order_value).toLocaleString("pt-MZ", { minimumFractionDigits: 2 })
                      : "0,00"}{" "}
                    MT
                  </div>
                </div>
              </div>
            </div>

            {/* Tabela de Serviços Prestados */}
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Receipt24Regular className="w-4 h-4 text-primary" />
                  Histórico de Prestações de Serviços
                </h3>
                <span className="text-xs text-muted-foreground">{orders.length} registos</span>
              </div>

              {orders.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground space-y-3">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                    <Receipt24Regular className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium">Ainda não foi registado nenhum serviço prestado.</p>
                  <button
                    onClick={() => setIsOrderDialogOpen(true)}
                    disabled={services.filter((s) => s.is_active).length === 0}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Receipt24Regular className="w-4 h-4" />
                    Registar o Primeiro Serviço
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                      <tr>
                        <th className="p-3">Recibo</th>
                        <th className="p-3">Data / Hora</th>
                        <th className="p-3">Serviço Prestado</th>
                        <th className="p-3">Qtd</th>
                        <th className="p-3">Cliente</th>
                        <th className="p-3">Pagamento</th>
                        <th className="p-3 text-right">Valor Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {orders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-mono text-muted-foreground">{ord.receipt_number || `#${ord.id}`}</td>
                          <td className="p-3 text-muted-foreground whitespace-nowrap">
                            {new Date(ord.created_at).toLocaleString("pt-MZ", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-foreground">{ord.service_name}</span>
                            {ord.notes && <div className="text-[11px] text-muted-foreground">{ord.notes}</div>}
                          </td>
                          <td className="p-3 text-foreground font-medium">{ord.quantity}</td>
                          <td className="p-3">
                            {ord.customer_name ? (
                              <div>
                                <span className="font-medium text-foreground">{ord.customer_name}</span>
                                {ord.customer_phone && (
                                  <div className="text-[11px] text-muted-foreground">{ord.customer_phone}</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic">Balcão</span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase bg-muted text-foreground border border-border">
                              {ord.payment_method}
                            </span>
                          </td>
                          <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            {parseFloat(ord.total).toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MT
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Catálogo de Serviços */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search24Regular className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Pesquisar serviço por nome..."
                  value={searchCatalog}
                  onChange={(e) => setSearchCatalog(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs md:text-sm rounded-lg border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="text-xs text-muted-foreground">
                {filteredServices.length} {filteredServices.length === 1 ? "serviço" : "serviços"} cadastrados
              </div>
            </div>

            {filteredServices.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground rounded-xl border border-dashed border-border space-y-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                  <Wrench24Regular className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium">Nenhum serviço encontrado no catálogo.</p>
                <button
                  onClick={() => {
                    setEditingService(null);
                    setIsServiceDialogOpen(true);
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5 transition-colors"
                >
                  <Add24Regular className="w-4 h-4" />
                  Cadastrar Primeiro Serviço
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredServices.map((svc) => (
                  <div
                    key={svc.id}
                    className={`p-4 rounded-xl border bg-card shadow-sm flex flex-col justify-between gap-4 transition-all ${
                      svc.is_active ? "border-border hover:border-primary/50" : "border-border/50 opacity-60"
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-foreground text-sm leading-tight">{svc.name}</h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            svc.is_active
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {svc.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                      <div className="text-xl font-extrabold text-primary">
                        {parseFloat(svc.price).toLocaleString("pt-MZ", { minimumFractionDigits: 2 })}{" "}
                        <span className="text-xs font-normal text-muted-foreground">MT</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingService(svc);
                            setIsServiceDialogOpen(true);
                          }}
                          className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Editar serviço"
                        >
                          <Edit24Regular className="w-4 h-4" />
                        </button>
                        {svc.is_active && (
                          <button
                            onClick={() => handleDeactivateService(svc)}
                            className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            title="Desactivar serviço"
                          >
                            <Delete24Regular className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {svc.is_active && (
                        <button
                          onClick={() => {
                            setOrderInitialServiceId(svc.id);
                            setIsOrderDialogOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-sm transition-colors"
                        >
                          <Receipt24Regular className="w-3.5 h-3.5" />
                          Prestar Serviço
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Dialogs */}
      <ServiceDialog
        isOpen={isServiceDialogOpen}
        onClose={() => {
          setIsServiceDialogOpen(false);
          setEditingService(null);
        }}
        onSave={handleSaveService}
        service={editingService}
      />

      <ServiceOrderDialog
        isOpen={isOrderDialogOpen}
        onClose={() => setIsOrderDialogOpen(false)}
        onSuccess={loadData}
        onSubmit={handleCreateOrder}
        services={services}
        initialServiceId={orderInitialServiceId}
      />
    </div>
  );
}
