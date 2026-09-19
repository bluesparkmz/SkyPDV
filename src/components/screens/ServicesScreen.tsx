import { useEffect, useMemo, useState } from "react";
import {
  Add24Regular,
  ArrowClockwise24Regular,
  ArrowDownload24Regular,
  CalendarDay24Regular,
  CalendarWeekNumbers24Regular,
  CalendarMonth24Regular,
  CalendarMultiple24Regular,
  Delete24Regular,
  Edit24Regular,
  Money24Regular,
  Receipt24Regular,
  Search24Regular,
  Wrench24Regular,
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
  tokens,
  useRestoreFocusTarget,
} from "@fluentui/react-components";
import { toast } from "sonner";

import { ServiceDialog } from "@/components/ServiceDialog";
import { ServiceOrderDialog } from "@/components/ServiceOrderDialog";
import { getPaymentMethodLabel } from "@/lib/paymentMethods";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  CreatePDVService,
  CreatePDVServiceOrder,
  PDVService,
  PDVServiceOrder,
  PDVServiceSummary,
  serviceOrdersApi,
  servicesApi,
} from "@/services/api";

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------
type ServiceView = "orders-today" | "orders-week" | "orders-month" | "orders-all" | "catalog";

type PeriodFilter = "today" | "week" | "month" | "all";

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------
function getStartOf(period: PeriodFilter): Date | null {
  const now = new Date();
  if (period === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (period === "week") {
    const day = now.getDay(); // 0=Sun
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
    return new Date(now.getFullYear(), now.getMonth(), diff);
  }
  if (period === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return null;
}

function filterOrdersByPeriod(orders: PDVServiceOrder[], period: PeriodFilter): PDVServiceOrder[] {
  const start = getStartOf(period);
  if (!start) return orders;
  return orders.filter((o) => new Date(o.created_at) >= start);
}

function viewToPeriod(view: ServiceView): PeriodFilter | null {
  if (view === "orders-today") return "today";
  if (view === "orders-week") return "week";
  if (view === "orders-month") return "month";
  if (view === "orders-all") return "all";
  return null;
}

function periodLabel(period: PeriodFilter): string {
  if (period === "today") return "Hoje";
  if (period === "week") return "Esta Semana";
  if (period === "month") return "Este Mês";
  return "Todos os Registos";
}

// -------------------------------------------------------------------
// Styles
// -------------------------------------------------------------------
const useStyles = makeStyles({
  root: {
    overflow: "hidden",
    display: "flex",
    flex: 1,
    minHeight: 0,
  },
  nav: {
    minWidth: "220px",
  },
  content: {
    flex: 1,
    minWidth: 0,
    display: "flex",
  },
  drawerContent: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    height: "100%",
  },
});

// -------------------------------------------------------------------
// Component
// -------------------------------------------------------------------
export function ServicesScreen() {
  const styles = useStyles();
  const isMobile = useIsMobile();
  const drawerType: Required<DrawerProps>["type"] = isMobile ? "overlay" : "inline";
  const [isNavOpen, setIsNavOpen] = useState(false);
  const restoreFocusTargetAttributes = useRestoreFocusTarget();

  // Default view = today (priority)
  const [activeView, setActiveView] = useState<ServiceView>("orders-today");
  const [services, setServices] = useState<PDVService[]>([]);
  const [orders, setOrders] = useState<PDVServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCatalog, setSearchCatalog] = useState("");

  // Dialogs
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<PDVService | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [orderInitialServiceId, setOrderInitialServiceId] = useState<number | null>(null);

  useEffect(() => {
    setIsNavOpen(!isMobile);
  }, [isMobile]);

  const [exportingPdf, setExportingPdf] = useState(false);

  // ------------------------------------------------------------------
  // Data loading
  // ------------------------------------------------------------------
  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedServices, fetchedOrders] = await Promise.all([
        servicesApi.list(),
        serviceOrdersApi.list({ limit: 500 }),
      ]);
      setServices(fetchedServices || []);
      setOrders(fetchedOrders || []);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao carregar serviços.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ------------------------------------------------------------------
  // Filtered orders based on active period
  // ------------------------------------------------------------------
  const period = viewToPeriod(activeView);
  const filteredOrders = useMemo(() => {
    if (!period) return [];
    return filterOrdersByPeriod(orders, period);
  }, [orders, period]);

  // Summary computed from filtered orders
  const summary = useMemo(() => {
    const total_revenue = filteredOrders.reduce((acc, o) => acc + parseFloat(o.total), 0);
    const total_orders = filteredOrders.length;
    const average_order_value = total_orders > 0 ? total_revenue / total_orders : 0;
    return { total_revenue, total_orders, average_order_value };
  }, [filteredOrders]);

  // ------------------------------------------------------------------
  // Handlers
  // ------------------------------------------------------------------
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

  // ------------------------------------------------------------------
  // Download PDF (ReportLab)
  // ------------------------------------------------------------------
  const handleDownloadPdf = async () => {
    if (!period) return;
    try {
      setExportingPdf(true);
      const { blob, filename } = await serviceOrdersApi.downloadPdf(period);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || `servicos_${period}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      toast.success("PDF descarregado com sucesso!");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao descarregar PDF.");
    } finally {
      setExportingPdf(false);
    }
  };


  // ------------------------------------------------------------------
  // Catalog filter
  // ------------------------------------------------------------------
  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(searchCatalog.toLowerCase())
  );

  const isOrdersView = activeView !== "catalog";

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <>
      <div className={styles.root}>
        {/* ── Sidebar ────────────────────────────────────────────── */}
        <NavDrawer
          defaultSelectedValue="orders-today"
          open={isNavOpen}
          type={drawerType}
          className={styles.nav}
          onOpenChange={(_, data) => setIsNavOpen(data.open)}
          selectedValue={activeView}
        >
          <NavDrawerHeader>
            <Hamburger {...restoreFocusTargetAttributes} onClick={() => setIsNavOpen(!isNavOpen)} />
          </NavDrawerHeader>
          <NavDrawerBody>
            <div className={styles.drawerContent}>
              {/* Period filters */}
              <NavSectionHeader>Prestações por Período</NavSectionHeader>
              <NavItem
                icon={<CalendarDay24Regular />}
                value="orders-today"
                onClick={() => setActiveView("orders-today")}
              >
                Hoje
              </NavItem>
              <NavItem
                icon={<CalendarWeekNumbers24Regular />}
                value="orders-week"
                onClick={() => setActiveView("orders-week")}
              >
                Esta Semana
              </NavItem>
              <NavItem
                icon={<CalendarMonth24Regular />}
                value="orders-month"
                onClick={() => setActiveView("orders-month")}
              >
                Este Mês
              </NavItem>
              <NavItem
                icon={<CalendarMultiple24Regular />}
                value="orders-all"
                onClick={() => setActiveView("orders-all")}
              >
                Todos ({orders.length})
              </NavItem>

              {/* Catalog */}
              <NavSectionHeader>Configuração</NavSectionHeader>
              <NavItem
                icon={<Wrench24Regular />}
                value="catalog"
                onClick={() => setActiveView("catalog")}
              >
                Catálogo ({services.length})
              </NavItem>
            </div>
          </NavDrawerBody>
        </NavDrawer>

        {/* ── Main content ───────────────────────────────────────── */}
        <div className={styles.content}>
          <div className="flex h-full flex-1 flex-col overflow-hidden">
            {/* Header */}
            <div className="border-b border-border bg-background/80 px-3 py-3 backdrop-blur-md md:px-6 md:py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <button
                    className="fluent-button px-2 md:hidden"
                    onClick={() => setIsNavOpen(true)}
                    aria-label="Abrir menu de serviços"
                  >
                    <Hamburger />
                  </button>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white md:h-10 md:w-10">
                    <Wrench24Regular className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-foreground md:text-2xl">Serviços</h1>
                    <p className="hidden text-xs text-muted-foreground sm:block md:text-sm">
                      {isOrdersView && period
                        ? `A mostrar prestações: ${periodLabel(period)}`
                        : "Catálogo de serviços configurados"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={loadData}
                    disabled={loading}
                    className="fluent-button justify-center gap-2 px-3"
                    title="Actualizar dados"
                  >
                    <ArrowClockwise24Regular className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
                    <span className="hidden sm:inline">Actualizar</span>
                  </button>

                  {/* Download PDF — only visible on orders views */}
                  {isOrdersView && (
                    <button
                      onClick={handleDownloadPdf}
                      disabled={filteredOrders.length === 0 || exportingPdf}
                      className="fluent-button justify-center gap-2 px-3 disabled:opacity-50"
                      title="Descarregar relatório em PDF (ReportLab)"
                    >
                      <ArrowDownload24Regular className={`h-5 w-5 ${exportingPdf ? "animate-spin" : ""}`} />
                      <span className="hidden sm:inline">
                        {exportingPdf ? "A gerar PDF..." : "Download PDF"}
                      </span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setEditingService(null);
                      setIsServiceDialogOpen(true);
                    }}
                    className="fluent-button justify-center gap-2 px-3"
                  >
                    <Add24Regular className="h-5 w-5" />
                    <span className="hidden sm:inline">Novo Serviço</span>
                  </button>
                  <button
                    onClick={() => {
                      setOrderInitialServiceId(null);
                      setIsOrderDialogOpen(true);
                    }}
                    disabled={services.filter((s) => s.is_active).length === 0}
                    className="fluent-button fluent-button-primary justify-center gap-2 px-3 disabled:opacity-50"
                  >
                    <Receipt24Regular className="h-5 w-5" />
                    <span className="hidden sm:inline">Registar Prestação</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ── Tab content ──────────────────────────────────────── */}
            <div className="windows-scrollbar flex-1 overflow-auto p-3 md:p-6">
              {isOrdersView && period ? (
                <>
                  {/* Summary cards — computed from current period */}
                  <div className="mb-6 grid gap-3 md:grid-cols-3">
                    <div className="fluent-card p-4 flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <Money24Regular className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground md:text-sm">
                          Receita — {periodLabel(period)}
                        </p>
                        <p className="mt-1 text-xl font-bold text-foreground md:text-2xl">
                          {summary.total_revenue.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MT
                        </p>
                      </div>
                    </div>

                    <div className="fluent-card p-4 flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <Receipt24Regular className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground md:text-sm">Prestações</p>
                        <p className="mt-1 text-xl font-bold text-foreground md:text-2xl">
                          {summary.total_orders}
                        </p>
                      </div>
                    </div>

                    <div className="fluent-card p-4 flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                        <Wrench24Regular className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground md:text-sm">Preço Médio</p>
                        <p className="mt-1 text-xl font-bold text-foreground md:text-2xl">
                          {summary.average_order_value.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MT
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Orders table */}
                  <div className="fluent-card overflow-hidden">
                    <div className="border-b border-border px-4 py-3 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <Receipt24Regular className="h-4 w-4 text-primary" />
                        Prestações de Serviços — {periodLabel(period)}
                      </h3>
                      <span className="text-xs text-muted-foreground">{filteredOrders.length} registos</span>
                    </div>

                    {loading ? (
                      <div className="flex h-48 items-center justify-center text-muted-foreground">
                        <p className="text-sm">A carregar...</p>
                      </div>
                    ) : filteredOrders.length === 0 ? (
                      <div className="p-12 text-center text-muted-foreground space-y-3">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                          <Receipt24Regular className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-medium">
                          Nenhuma prestação registada para este período.
                        </p>
                        <button
                          onClick={() => setIsOrderDialogOpen(true)}
                          disabled={services.filter((s) => s.is_active).length === 0}
                          className="fluent-button fluent-button-primary inline-flex gap-2 px-4"
                        >
                          <Receipt24Regular className="h-4 w-4" />
                          Registar Agora
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-secondary/50">
                            <tr>
                              <th className="p-4 text-left text-sm font-semibold text-foreground">Recibo</th>
                              <th className="p-4 text-left text-sm font-semibold text-foreground">Data / Hora</th>
                              <th className="p-4 text-left text-sm font-semibold text-foreground">Serviço</th>
                              <th className="p-4 text-left text-sm font-semibold text-foreground">Qtd</th>
                              <th className="p-4 text-left text-sm font-semibold text-foreground">Cliente</th>
                              <th className="p-4 text-left text-sm font-semibold text-foreground">Pagamento</th>
                              <th className="p-4 text-right text-sm font-semibold text-foreground">Valor Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredOrders.map((ord) => (
                              <tr
                                key={ord.id}
                                className="border-t border-border transition-colors hover:bg-secondary/30"
                              >
                                <td className="p-4 font-mono text-sm text-muted-foreground">
                                  {ord.receipt_number || `#${ord.id}`}
                                </td>
                                <td className="p-4 text-sm text-muted-foreground whitespace-nowrap">
                                  {new Date(ord.created_at).toLocaleString("pt-MZ", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </td>
                                <td className="p-4">
                                  <span className="text-sm font-medium text-foreground">{ord.service_name}</span>
                                  {ord.notes && (
                                    <div className="text-xs text-muted-foreground">{ord.notes}</div>
                                  )}
                                </td>
                                <td className="p-4 text-sm text-foreground font-medium">{ord.quantity}</td>
                                <td className="p-4">
                                  {ord.customer_name ? (
                                    <div>
                                      <span className="text-sm font-medium text-foreground">{ord.customer_name}</span>
                                      {ord.customer_phone && (
                                        <div className="text-xs text-muted-foreground">{ord.customer_phone}</div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-sm text-muted-foreground italic">Balcão</span>
                                  )}
                                </td>
                                <td className="p-4">
                                  <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-muted text-foreground border border-border">
                                    {getPaymentMethodLabel(ord.payment_method)}
                                  </span>
                                </td>
                                <td className="p-4 text-right text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                  {parseFloat(ord.total).toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MT
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          {/* Total row */}
                          <tfoot>
                            <tr className="border-t-2 border-border bg-secondary/30">
                              <td colSpan={6} className="p-4 text-sm font-bold text-foreground">
                                TOTAL
                              </td>
                              <td className="p-4 text-right text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                {summary.total_revenue.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MT
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Catalog search */}
                  <div className="mb-4 flex flex-col items-stretch gap-2 md:mb-6 md:gap-3 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                      <Search24Regular className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground md:h-5 md:w-5" />
                      <input
                        type="text"
                        placeholder="Pesquisar serviço por nome..."
                        value={searchCatalog}
                        onChange={(e) => setSearchCatalog(e.target.value)}
                        className="w-full rounded-lg border border-border bg-card py-2 pr-4 pl-9 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 md:py-2.5 md:pl-10 md:text-sm"
                      />
                    </div>
                    <div className="text-xs text-muted-foreground self-center">
                      {filteredServices.length}{" "}
                      {filteredServices.length === 1 ? "serviço" : "serviços"} cadastrados
                    </div>
                  </div>

                  {/* Catalog grid */}
                  {loading ? (
                    <div className="flex h-48 items-center justify-center text-muted-foreground">
                      <p className="text-sm">A carregar...</p>
                    </div>
                  ) : filteredServices.length === 0 ? (
                    <div className="fluent-card p-12 text-center text-muted-foreground space-y-3">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                        <Wrench24Regular className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-medium">Nenhum serviço encontrado no catálogo.</p>
                      <button
                        onClick={() => {
                          setEditingService(null);
                          setIsServiceDialogOpen(true);
                        }}
                        className="fluent-button fluent-button-primary inline-flex gap-2 px-4"
                      >
                        <Add24Regular className="h-4 w-4" />
                        Cadastrar Primeiro Serviço
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredServices.map((svc) => (
                        <div
                          key={svc.id}
                          className={`fluent-card p-4 flex flex-col justify-between gap-4 transition-all ${
                            svc.is_active ? "hover:border-primary/50" : "opacity-60"
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
                                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                                title="Editar serviço"
                              >
                                <Edit24Regular className="h-4 w-4" />
                              </button>
                              {svc.is_active && (
                                <button
                                  onClick={() => handleDeactivateService(svc)}
                                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                  title="Desactivar serviço"
                                >
                                  <Delete24Regular className="h-4 w-4" />
                                </button>
                              )}
                            </div>

                            {svc.is_active && (
                              <button
                                onClick={() => {
                                  setOrderInitialServiceId(svc.id);
                                  setIsOrderDialogOpen(true);
                                }}
                                className="fluent-button fluent-button-primary gap-1.5 px-3 py-1.5 text-xs"
                              >
                                <Receipt24Regular className="h-3.5 w-3.5" />
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
          </div>
        </div>
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
    </>
  );
}
