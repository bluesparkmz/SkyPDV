import { useState, useEffect } from "react";
import {
  ChartMultiple24Regular,
  Money24Regular,
  Receipt24Regular,
  CalendarLtr24Regular,
  Document24Regular,
  ArrowDownload24Regular,
  Eye24Regular,
  ChevronRight24Regular,
  Print24Regular,
  List24Regular,
  Home24Regular,
  DataTrending24Regular,
  Person24Regular,
} from "@fluentui/react-icons";
import type { DrawerProps } from "@fluentui/react-components";
import {
  Hamburger,
  NavDrawer,
  NavDrawerBody,
  NavDrawerHeader,
  NavDivider,
  NavItem,
  NavSectionHeader,
  makeStyles,
  tokens,
  Tooltip,
  useRestoreFocusTarget,
} from "@fluentui/react-components";
import { useSalesSummary, useSalesByDay, usePeriodicReport } from "@/hooks/useReports";
import { salesApi, Sale } from "@/services/api";
import { CustomerName } from "@/components/CustomerName";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSales } from "@/hooks/useSales";
import { cn } from "@/lib/utils";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useTerminalUsers } from "@/hooks/useTerminalUsers";
import { dashboardApi } from "@/services/api";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    display: "flex",
  },
  drawerContent: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    height: "100%",
  },
  footer: {
    marginTop: "auto",
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    paddingTop: tokens.spacingVerticalS,
  },
});

type ReportView = "dashboard" | "daily" | "all-sales";

export function ReportsScreen() {
  const styles = useStyles();
  const isMobile = useIsMobile();
  const drawerType: Required<DrawerProps>["type"] = isMobile ? "overlay" : "inline";
  const [isNavOpen, setIsNavOpen] = useState(false);
  const restoreFocusTargetAttributes = useRestoreFocusTarget();

  const [activeView, setActiveView] = useState<ReportView>("dashboard");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isSaleDetailOpen, setIsSaleDetailOpen] = useState(false);
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [selectedCashierId, setSelectedCashierId] = useState<number | undefined>(undefined);

  useEffect(() => {
    // Sincronizar estado inicial e mudanças de redimensionamento
    // No desktop, o menu deve começar aberto. No mobile, fechado.
    setIsNavOpen(!isMobile);
  }, [isMobile]);

  // Verificar se é admin
  const isAdmin = useIsAdmin();
  const { data: terminalUsers = [] } = useTerminalUsers();

  // Filtrar apenas caixas (cashier) para o seletor
  const cashiers = terminalUsers.filter(u => u.role === "cashier" && u.is_active);

  // Buscar relatórios diários
  const { data: dailySales = [], isLoading: dailyLoading } = useSalesByDay(startDate, endDate, selectedCashierId);

  // Buscar resumo geral
  const { data: summary, isLoading: summaryLoading } = useSalesSummary(startDate, endDate, selectedCashierId);

  // Buscar resumo do dia selecionado
  const { data: daySummary, isLoading: daySummaryLoading } = usePeriodicReport(
    "day",
    selectedDate || "",
    selectedCashierId
  );

  // Buscar todas as vendas (para a view "all-sales")
  const { data: allSales = [], isLoading: allSalesLoading } = useSales({
    start_date: startDate,
    end_date: endDate,
    limit: 1000,
    status: "completed",
    user_id: selectedCashierId,
  });

  // Buscar vendas do dia selecionado
  const { data: daySales = [], isLoading: daySalesLoading } = useQuery({
    queryKey: ["daySales", selectedDate, selectedCashierId],
    queryFn: async () => {
      if (!selectedDate) return [];
      const start = startOfDay(new Date(selectedDate));
      const end = endOfDay(new Date(selectedDate));
      return salesApi.list({
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        status: "completed",
        limit: 1000,
        user_id: selectedCashierId,
      });
    },
    enabled: !!selectedDate && activeView === "daily",
  });

  // Calcular resumo de métodos de pagamento
  const paymentMethodsSummary = (daySales.length > 0 ? daySales : allSales).reduce((acc, sale) => {
    const method = sale.payment_method || "cash";
    if (!acc[method]) {
      acc[method] = { count: 0, total: 0 };
    }
    acc[method].count += 1;
    acc[method].total += parseFloat(sale.total);
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat("pt-MZ", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num) + " MT";
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const formatTime = (dateString: string) => {
    return format(parseISO(dateString), "HH:mm", { locale: ptBR });
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: "Dinheiro",
      card: "Cartão",
      skywallet: "SkyWallet",
      mpesa: "M-Pesa",
      mixed: "Misto",
    };
    return labels[method] || method;
  };

  const handleSelectDay = (date: string) => {
    setSelectedDate(date);
    setActiveView("daily");
  };

  const handleViewSaleDetails = (sale: Sale) => {
    setSelectedSale(sale);
    setIsSaleDetailOpen(true);
  };

  const handleExportPDF = async () => {
    try {
      // Se estiver na view diária e tiver uma data selecionada, exporta apenas esse dia
      const isDailyView = activeView === "daily" && selectedDate;
      const exportStart = isDailyView ? selectedDate : startDate;
      const exportEnd = isDailyView ? selectedDate : endDate;

      const { blob, filename: apiFilename } = await dashboardApi.downloadSalesSummaryPdf(
        exportStart!,
        exportEnd!,
        selectedCashierId
      );

      const todayStr = format(new Date(), 'dd-MM-yyyy');
      // Formata o período para o nome do arquivo
      const periodStr = isDailyView
        ? format(parseISO(selectedDate!), 'dd-MM-yyyy')
        : `${format(parseISO(startDate), 'dd-MM-yyyy')}_a_${format(parseISO(endDate), 'dd-MM-yyyy')}`;

      const filename = `Relatório_${todayStr}_Ref_${periodStr}.pdf`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(e?.message || "Falha ao gerar o PDF");
    }
  };

  const handleQuickFilter = (period: 'today' | 'yesterday' | 'week' | 'month') => {
    const end = new Date();
    const start = new Date();

    if (period === 'today') {
      setStartDate(format(start, 'yyyy-MM-dd'));
      setEndDate(format(end, 'yyyy-MM-dd'));
      setSelectedDate(format(start, 'yyyy-MM-dd'));
      setActiveView("daily");
    } else if (period === 'yesterday') {
      start.setDate(end.getDate() - 1);
      end.setDate(end.getDate() - 1);
      setStartDate(format(start, 'yyyy-MM-dd'));
      setEndDate(format(end, 'yyyy-MM-dd'));
      setSelectedDate(format(start, 'yyyy-MM-dd'));
      setActiveView("daily");
    } else if (period === 'week') {
      start.setDate(end.getDate() - 7);
      setStartDate(format(start, 'yyyy-MM-dd'));
      setEndDate(format(end, 'yyyy-MM-dd'));
    } else if (period === 'month') {
      setStartDate(format(startOfMonth(start), 'yyyy-MM-dd'));
      setEndDate(format(endOfMonth(end), 'yyyy-MM-dd'));
    }
  };

  // Auto-selecionar hoje se não houver seleção
  useEffect(() => {
    if (!selectedDate && dailySales.length > 0 && activeView === "daily") {
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayReport = dailySales.find(d => d.period === today);
      if (todayReport) {
        setSelectedDate(today);
      } else if (dailySales.length > 0) {
        // Selecionar a data mais recente (primeira após ordenação)
        const sortedSales = [...dailySales].sort((a: any, b: any) => {
          return new Date(b.period).getTime() - new Date(a.period).getTime();
        });
        setSelectedDate(sortedSales[0].period);
      }
    }
  }, [dailySales, selectedDate, activeView]);

  const sidebarItems = [
    {
      id: "dashboard" as ReportView,
      label: "Dashboard",
      icon: DataTrending24Regular,
      description: "Visão geral e resumo",
    },
    {
      id: "daily" as ReportView,
      label: "Relatórios Diários",
      icon: CalendarLtr24Regular,
      description: "Vendas por dia",
    },
    {
      id: "all-sales" as ReportView,
      label: "Todas as Vendas",
      icon: Receipt24Regular,
      description: "Histórico completo",
    },
  ];

  return (
    <div className={styles.root}>
      <NavDrawer
        selectedValue={activeView}
        open={isNavOpen}
        type={drawerType}
        className={styles.nav}
        onOpenChange={(_, data) => setIsNavOpen(data.open)}
        onNavItemSelect={(_, data) => {
          const nextView = data.value as ReportView;
          setActiveView(nextView);
          if (isMobile) setIsNavOpen(false); // Fecha o menu no mobile após selecionar
          if (nextView === "daily" && !selectedDate && dailySales.length > 0) {
            const sortedSales = [...dailySales].sort((a: any, b: any) => {
              return new Date(b.period).getTime() - new Date(a.period).getTime();
            });
            setSelectedDate(sortedSales[0].period);
          }
        }}
      >
        <NavDrawerHeader>
          <Hamburger onClick={() => setIsNavOpen((v) => !v)} />
        </NavDrawerHeader>
        <NavDrawerBody className={styles.drawerContent}>
          <NavSectionHeader>Relatórios</NavSectionHeader>
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavItem key={item.id} value={item.id} icon={<Icon />}>
                {item.label}
              </NavItem>
            );
          })}

          <div className={styles.footer}>
            <NavDivider />
            {isAdmin && cashiers.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Person24Regular className="w-3 h-3" />
                  Filtrar por Caixa
                </label>
                <Select
                  value={selectedCashierId?.toString() || "all"}
                  onValueChange={(value) => {
                    setSelectedCashierId(value === "all" ? undefined : parseInt(value));
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todos os caixas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os caixas</SelectItem>
                    {cashiers.map((cashier) => (
                      <SelectItem key={cashier.id} value={cashier.user_id.toString()}>
                        {cashier.user_name || cashier.user_email || `Caixa ${cashier.user_id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {!isMobile && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase">Período</div>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Data Inicial</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Data Final</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => handleQuickFilter('today')} className="h-7 text-xs">
                    Hoje
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleQuickFilter('week')} className="h-7 text-xs">
                    7 Dias
                  </Button>
                </div>
              </div>
            )}
          </div>
        </NavDrawerBody>
      </NavDrawer>

      <div className={styles.content}>
        <div className="flex-1 flex flex-col overflow-hidden p-4 md:p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              {(isMobile || !isNavOpen) && (
                <Tooltip content="Abrir menu" relationship="label">
                  <Hamburger
                    onClick={() => setIsNavOpen(true)}
                    {...restoreFocusTargetAttributes}
                    aria-expanded={isNavOpen}
                  />
                </Tooltip>
              )}
              <div>
                <h1 className="text-lg md:text-xl font-bold tracking-tight">
                  {activeView === "dashboard" && "Dashboard de Relatórios"}
                  {activeView === "daily" && "Relatórios Diários"}
                  {activeView === "all-sales" && "Todas as Vendas"}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {activeView === "dashboard" && ""}
                  {activeView === "daily" && "Visualize vendas por dia"}
                  {activeView === "all-sales" && "Histórico completo de vendas"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => handleQuickFilter('today')} size="sm">Hoje</Button>
              <Button variant="outline" onClick={() => handleQuickFilter('yesterday')} size="sm">Ontem</Button>
              <Button variant="outline" onClick={() => handleQuickFilter('week')} size="sm">7 Dias</Button>
              <Button variant="outline" onClick={() => handleQuickFilter('month')} size="sm">Mês</Button>
              {(selectedDate || activeView === "all-sales") && (
                <Button onClick={handleExportPDF} className="gap-2">
                  <Print24Regular className="w-4 h-4" />
                  Imprimir
                </Button>
              )}
            </div>
          </div>

          {/* Content based on active view */}
          <div className="flex-1 overflow-y-auto">
            {activeView === "dashboard" && (
              <DashboardView summary={summary} summaryLoading={summaryLoading} formatCurrency={formatCurrency} />
            )}

            {activeView === "daily" && (
              <DailyReportsView
                dailySales={dailySales}
                dailyLoading={dailyLoading}
                selectedDate={selectedDate}
                daySummary={daySummary}
                daySummaryLoading={daySummaryLoading}
                daySales={daySales}
                daySalesLoading={daySalesLoading}
                paymentMethodsSummary={paymentMethodsSummary}
                onSelectDay={handleSelectDay}
                onViewSale={handleViewSaleDetails}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                formatTime={formatTime}
                getPaymentMethodLabel={getPaymentMethodLabel}
              />
            )}

            {activeView === "all-sales" && (
              <AllSalesView
                sales={allSales}
                isLoading={allSalesLoading}
                paymentMethodsSummary={paymentMethodsSummary}
                onViewSale={handleViewSaleDetails}
                formatCurrency={formatCurrency}
                formatTime={formatTime}
                getPaymentMethodLabel={getPaymentMethodLabel}
              />
            )}
          </div>

        </div>

        {/* Dialog de Detalhes da Venda */}
        <Dialog open={isSaleDetailOpen} onOpenChange={setIsSaleDetailOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes da Venda</DialogTitle>
              <DialogDescription>
                Recibo #{selectedSale?.receipt_number || selectedSale?.id} • {selectedSale && formatTime(selectedSale.created_at)}
              </DialogDescription>
            </DialogHeader>

            {selectedSale && (
              <div className="space-y-6 py-4">
                {/* Informações da Venda */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground uppercase mb-1">Total</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(selectedSale.total)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground uppercase mb-1">Método de Pagamento</p>
                    <p className="text-lg font-semibold">
                      {getPaymentMethodLabel(selectedSale.payment_method)}
                    </p>
                  </div>
                </div>

                {/* Cliente */}
                {(selectedSale.customer_name || selectedSale.customer_phone) && (
                  <div className="p-3 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground uppercase mb-2">Cliente</p>
                    {selectedSale.customer_name && (
                      <p className="font-semibold">
                        <CustomerName sale={selectedSale} />
                      </p>
                    )}
                    {selectedSale.customer_phone && (
                      <p className="text-sm text-muted-foreground">{selectedSale.customer_phone}</p>
                    )}
                  </div>
                )}

                {/* Produtos */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <List24Regular className="w-4 h-4" />
                    Produtos da Venda
                  </h4>
                  <div className="space-y-2">
                    {selectedSale.items && selectedSale.items.length > 0 ? (
                      selectedSale.items.map((item: any, index: number) => (
                        <div
                          key={index}
                          className="p-3 rounded-lg border border-border flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{item.product_name || `Produto #${item.product_id}`}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.quantity} x {formatCurrency(item.unit_price || 0)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {formatCurrency(item.subtotal || (parseFloat(item.unit_price || 0) * parseFloat(item.quantity)))}
                            </p>
                            {item.discount_amount && parseFloat(item.discount_amount) > 0 && (
                              <p className="text-xs text-muted-foreground">
                                Desconto: {formatCurrency(item.discount_amount)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum item encontrado
                      </p>
                    )}
                  </div>
                </div>

                {/* Totais */}
                <div className="space-y-2 pt-4 border-t border-border">
                  {selectedSale.discount_amount && parseFloat(selectedSale.discount_amount) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Desconto:</span>
                      <span className="font-medium text-red-500">
                        -{formatCurrency(selectedSale.discount_amount)}
                      </span>
                    </div>
                  )}
                  {selectedSale.tax_amount && parseFloat(selectedSale.tax_amount) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Imposto (IVA):</span>
                      <span className="font-medium">{formatCurrency(selectedSale.tax_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                    <span>Total:</span>
                    <span className="text-primary">{formatCurrency(selectedSale.total)}</span>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSaleDetailOpen(false)}>
                Fechar
              </Button>
              <Button onClick={handleExportPDF} className="gap-2">
                <Print24Regular className="w-4 h-4" />
                Imprimir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Dashboard View Component
function DashboardView({
  summary,
  summaryLoading,
  formatCurrency
}: {
  summary: any;
  summaryLoading: boolean;
  formatCurrency: (value: string | number) => string;
}) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="fluent-card p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Receita Total</p>
            <h3 className="text-2xl font-bold mt-1">
              {summaryLoading ? "..." : formatCurrency(summary?.total_revenue || 0)}
            </h3>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Money24Regular className="w-5 h-5" />
            </div>
            <span className="text-xs text-muted-foreground">Vendas confirmadas</span>
          </div>
        </div>

        <div className="fluent-card p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ticket Médio</p>
            <h3 className="text-2xl font-bold mt-1">
              {summaryLoading ? "..." : formatCurrency(summary?.average_sale_value || 0)}
            </h3>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <ChartMultiple24Regular className="w-5 h-5" />
            </div>
            <span className="text-xs text-muted-foreground">Por transação</span>
          </div>
        </div>

        <div className="fluent-card p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total de Vendas</p>
            <h3 className="text-2xl font-bold mt-1">
              {summaryLoading ? "..." : summary?.total_sales || 0}
            </h3>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <Receipt24Regular className="w-5 h-5" />
            </div>
            <span className="text-xs text-muted-foreground">Pedidos realizados</span>
          </div>
        </div>

        <div className="fluent-card p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Lucro Bruto Est.</p>
            <h3 className="text-2xl font-bold mt-1">
              {summaryLoading ? "..." : formatCurrency(summary?.gross_profit || 0)}
            </h3>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
              <DataTrending24Regular className="w-5 h-5" />
            </div>
            <span className="text-xs text-muted-foreground">Baseado no custo</span>
          </div>
        </div>
      </div>

      {/* Payment Methods Summary */}
      {summary && (
        <div className="fluent-card p-4">
          <h3 className="text-lg font-semibold mb-4">Resumo por Método de Pagamento</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {summary.cash_sales && parseFloat(summary.cash_sales) > 0 && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <p className="text-xs text-muted-foreground uppercase mb-1">Dinheiro</p>
                <p className="text-lg font-bold">{formatCurrency(summary.cash_sales)}</p>
              </div>
            )}
            {summary.card_sales && parseFloat(summary.card_sales) > 0 && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <p className="text-xs text-muted-foreground uppercase mb-1">Cartão</p>
                <p className="text-lg font-bold">{formatCurrency(summary.card_sales)}</p>
              </div>
            )}
            {summary.skywallet_sales && parseFloat(summary.skywallet_sales) > 0 && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <p className="text-xs text-muted-foreground uppercase mb-1">SkyWallet</p>
                <p className="text-lg font-bold">{formatCurrency(summary.skywallet_sales)}</p>
              </div>
            )}
            {summary.mpesa_sales && parseFloat(summary.mpesa_sales) > 0 && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <p className="text-xs text-muted-foreground uppercase mb-1">M-Pesa</p>
                <p className="text-lg font-bold">{formatCurrency(summary.mpesa_sales)}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Daily Reports View Component
function DailyReportsView({
  dailySales,
  dailyLoading,
  selectedDate,
  daySummary,
  daySummaryLoading,
  daySales,
  daySalesLoading,
  paymentMethodsSummary,
  onSelectDay,
  onViewSale,
  formatCurrency,
  formatDate,
  formatTime,
  getPaymentMethodLabel,
}: any) {
  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
      {/* Lista de Relatórios Diários */}
      <div className="lg:col-span-1 flex flex-col overflow-hidden">
        <div className="fluent-card p-4 mb-4">
          <h2 className="text-lg font-semibold mb-4">Relatórios Diários</h2>
        </div>

        <div className="flex-1 overflow-y-auto fluent-card p-2">
          {dailyLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">Carregando...</div>
            </div>
          ) : dailySales.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <CalendarLtr24Regular className="w-12 h-12 mb-2 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">Nenhum relatório encontrado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {[...dailySales].sort((a: any, b: any) => {
                // Ordenar por data: mais recente primeiro
                return new Date(b.period).getTime() - new Date(a.period).getTime();
              }).map((day: any) => (
                <button
                  key={day.period}
                  onClick={() => onSelectDay(day.period)}
                  className={`w-full p-3 rounded-lg border transition-all text-left ${selectedDate === day.period
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">
                      {format(parseISO(day.period), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                    <Badge variant={selectedDate === day.period ? "default" : "secondary"}>
                      {day.sales_count} vendas
                    </Badge>
                  </div>
                  <div className="text-lg font-bold text-primary">
                    {formatCurrency(day.total_revenue)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Ticket médio: {formatCurrency(day.average_value)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detalhes do Dia Selecionado */}
      <div className="lg:col-span-2 flex flex-col overflow-hidden">
        {!selectedDate ? (
          <div className="flex-1 flex items-center justify-center fluent-card">
            <div className="text-center">
              <CalendarLtr24Regular className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Selecione um dia</h3>
              <p className="text-muted-foreground">Escolha um relatório diário para ver os detalhes</p>
            </div>
          </div>
        ) : (
          <>
            {/* Resumo do Dia */}
            <div className="fluent-card p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">{formatDate(selectedDate)}</h2>
                  {daySummaryLoading ? (
                    <p className="text-sm text-muted-foreground">Carregando...</p>
                  ) : daySummary ? (
                    <p className="text-sm text-muted-foreground">
                      {daySummary.total_sales} vendas • Total: {formatCurrency(daySummary.total_revenue)}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Resumo de Métodos de Pagamento */}
              {Object.keys(paymentMethodsSummary).length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border">
                  {Object.entries(paymentMethodsSummary).map(([method, data]: any) => (
                    <div key={method} className="p-3 rounded-lg bg-muted/30 border border-border">
                      <p className="text-xs text-muted-foreground uppercase mb-1">
                        {getPaymentMethodLabel(method)}
                      </p>
                      <p className="text-lg font-bold">{formatCurrency(data.total)}</p>
                      <p className="text-xs text-muted-foreground">{data.count} transação(ões)</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lista de Vendas do Dia */}
            <div className="flex-1 overflow-y-auto fluent-card">
              <div className="p-4 border-b border-border">
                <h3 className="text-lg font-semibold">Vendas do Dia</h3>
              </div>
              {daySalesLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-muted-foreground">Carregando vendas...</div>
                </div>
              ) : daySales.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Receipt24Regular className="w-12 h-12 mb-2 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">Nenhuma venda registrada neste dia</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hora</TableHead>
                        <TableHead>Nº Recibo</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {daySales.map((sale: Sale) => (
                        <TableRow key={sale.id}>
                          <TableCell className="font-medium">
                            {formatTime(sale.created_at)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">#{sale.receipt_number || sale.id}</Badge>
                          </TableCell>
                          <TableCell>
                            <CustomerName sale={sale} />
                          </TableCell>
                          <TableCell>
                            {sale.items?.length || 0} item(s)
                          </TableCell>
                          <TableCell className="font-semibold text-primary">
                            {formatCurrency(sale.total)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {getPaymentMethodLabel(sale.payment_method)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewSale(sale)}
                              className="gap-2"
                            >
                              <Eye24Regular className="w-4 h-4" />
                              Ver
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// All Sales View Component
function AllSalesView({
  sales,
  isLoading,
  paymentMethodsSummary,
  onViewSale,
  formatCurrency,
  formatTime,
  getPaymentMethodLabel,
}: any) {
  return (
    <div className="space-y-6">
      {/* Resumo de Métodos de Pagamento */}
      {Object.keys(paymentMethodsSummary).length > 0 && (
        <div className="fluent-card p-4">
          <h3 className="text-lg font-semibold mb-4">Resumo por Método de Pagamento</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(paymentMethodsSummary).map(([method, data]: any) => (
              <div key={method} className="p-3 rounded-lg bg-muted/30 border border-border">
                <p className="text-xs text-muted-foreground uppercase mb-1">
                  {getPaymentMethodLabel(method)}
                </p>
                <p className="text-lg font-bold">{formatCurrency(data.total)}</p>
                <p className="text-xs text-muted-foreground">{data.count} transação(ões)</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Todas as Vendas */}
      <div className="fluent-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold">Todas as Vendas</h3>
          <Badge variant="outline" className="font-normal">
            {sales.length} venda(s) encontrada(s)
          </Badge>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Carregando vendas...</div>
          </div>
        ) : sales.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Receipt24Regular className="w-12 h-12 mb-2 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">Nenhuma venda encontrada no período</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Nº Recibo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale: Sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">
                      {format(parseISO(sale.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">#{sale.receipt_number || sale.id}</Badge>
                    </TableCell>
                    <TableCell>
                      <CustomerName sale={sale} />
                    </TableCell>
                    <TableCell>
                      {sale.items?.length || 0} item(s)
                    </TableCell>
                    <TableCell className="font-semibold text-primary">
                      {formatCurrency(sale.total)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {getPaymentMethodLabel(sale.payment_method)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewSale(sale)}
                        className="gap-2"
                      >
                        <Eye24Regular className="w-4 h-4" />
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
