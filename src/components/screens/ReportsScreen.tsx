import { useState, useEffect, useMemo } from "react";
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
  Wrench24Regular,
  ArrowExit24Regular,
  Box24Regular,
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
import { useSalesSummary, useSalesByDay, usePeriodicReport, useCashRegisterHistory } from "@/hooks/useReports";
import {
  CashRegister,
  salesApi,
  Sale,
  serviceOrdersApi,
  outflowsApi,
  PDVServiceOrder,
  PDVOutflow,
  terminalApi,
} from "@/services/api";
import { useHardwarePlugin } from "@/hooks/useHardwarePlugin";
import { formatSaleReceipt } from "@/lib/receiptFormat";
import { toast } from "sonner";
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
import { useSales } from "@/hooks/useSales";
import { cn } from "@/lib/utils";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useTerminalUsers } from "@/hooks/useTerminalUsers";
import { dashboardApi } from "@/services/api";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWhatsappPrefs } from "@/hooks/useWhatsappPrefs";
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

type ReportView = "dashboard" | "daily" | "all-sales" | "cash-registers";

const OUTFLOW_REASON_LABELS: Record<string, string> = {
  consumo_interno: "Consumo interno",
  cafetaria: "Cafetaria",
  cozinha: "Cozinha",
  perda: "Perda / Avaria",
  despesa_diaria: "Despesa diária",
  outro: "Outro",
};

function toDateKey(iso: string) {
  try {
    return format(parseISO(iso), "yyyy-MM-dd");
  } catch {
    return (iso || "").slice(0, 10);
  }
}

function isProductOutflow(type: string | undefined | null) {
  return String(type || "").toLowerCase().includes("product");
}

export function ReportsScreen() {
  const styles = useStyles();
  const isMobile = useIsMobile();
  const drawerType: Required<DrawerProps>["type"] = isMobile ? "overlay" : "inline";
  const [isNavOpen, setIsNavOpen] = useState(false);
  const restoreFocusTargetAttributes = useRestoreFocusTarget();

  const todayKey = format(new Date(), "yyyy-MM-dd");
  const [activeView, setActiveView] = useState<ReportView>("daily");
  const [selectedDate, setSelectedDate] = useState<string | null>(todayKey);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isSaleDetailOpen, setIsSaleDetailOpen] = useState(false);
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [selectedCashierId, setSelectedCashierId] = useState<number | undefined>(undefined);
  const [operatorNameFilter, setOperatorNameFilter] = useState("");
  const { prefs: whatsappPrefs, setPrefs: setWhatsappPrefs, isReady: whatsappReady, saveToBackend } = useWhatsappPrefs();
  const [showWhatsappDialog, setShowWhatsappDialog] = useState(false);
  const [pendingExportType, setPendingExportType] = useState<"pdf" | "excel" | null>(null);
  const [pendingProductScope, setPendingProductScope] = useState<"all" | "beverages">("all");
  const [tempPhone, setTempPhone] = useState("");
  const [reprintingSaleId, setReprintingSaleId] = useState<number | null>(null);
  const { printReceipt } = useHardwarePlugin();
  const { data: terminal } = useQuery({
    queryKey: ["terminal"],
    queryFn: terminalApi.get,
  });

  useEffect(() => {
    // Sincronizar estado inicial e mudanças de redimensionamento
    // No desktop, o menu deve começar aberto. No mobile, fechado.
    setIsNavOpen(!isMobile);
  }, [isMobile]);

  // Verificar se é admin
  const isAdmin = useIsAdmin();
  const { data: terminalUsers = [] } = useTerminalUsers();
  const cashierNameByUserId = useMemo(() => {
    const map = new Map<number, string>();
    terminalUsers.forEach((u) => {
      if (typeof u.user_id === "number") {
        const preferredName =
          (u.user_name && u.user_name.trim()) ||
          (u.user_email && u.user_email.split("@")[0].trim()) ||
          `Vendedor ${u.user_id}`;
        map.set(u.user_id, preferredName);
      }
    });
    return map;
  }, [terminalUsers]);

  // Filtrar apenas caixas (cashier) para o seletor
  // Protege contra payloads incompletos (user_id nulo/indefinido) que quebram no toString().
  const cashiers = terminalUsers.filter(
    (u) => u.role === "cashier" && u.is_active && typeof u.user_id === "number" && Number.isFinite(u.user_id)
  );

  // Buscar relatórios diários
  const periodStartIso = useMemo(
    () => startOfDay(parseISO(startDate)).toISOString(),
    [startDate]
  );
  const periodEndIso = useMemo(
    () => endOfDay(parseISO(endDate)).toISOString(),
    [endDate]
  );

  const { data: dailySales = [], isLoading: dailyLoading } = useSalesByDay(periodStartIso, periodEndIso, selectedCashierId);

  // Buscar resumo geral
  const { data: summary, isLoading: summaryLoading } = useSalesSummary(periodStartIso, periodEndIso, selectedCashierId);

  // Buscar resumo do dia selecionado
  const { data: daySummary, isLoading: daySummaryLoading } = usePeriodicReport(
    "day",
    selectedDate || "",
    selectedCashierId
  );

  // Buscar todas as vendas (para a view "all-sales")
  const { data: allSales = [], isLoading: allSalesLoading } = useSales({
    start_date: periodStartIso,
    end_date: periodEndIso,
    limit: 1000,
    status: "completed",
    user_id: selectedCashierId,
  });

  const { data: cashRegisters = [], isLoading: cashRegistersLoading } = useCashRegisterHistory(
    startDate,
    endDate,
    selectedCashierId
  );

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

  const { data: periodServiceOrders = [], isLoading: servicesLoading } = useQuery({
    queryKey: ["reportServiceOrders", periodStartIso, periodEndIso],
    queryFn: () =>
      serviceOrdersApi.list({
        start_date: periodStartIso,
        end_date: periodEndIso,
        status: "completed",
        limit: 1000,
      }),
  });

  const { data: periodOutflows = [], isLoading: outflowsLoading } = useQuery({
    queryKey: ["reportOutflows", periodStartIso, periodEndIso],
    queryFn: () =>
      outflowsApi.list({
        start_date: periodStartIso,
        end_date: periodEndIso,
        limit: 1000,
      }),
  });

  const filteredServiceOrders = useMemo(() => {
    return periodServiceOrders.filter((order) => {
      if (order.status && order.status !== "completed") return false;
      if (selectedCashierId && order.created_by !== selectedCashierId) return false;
      return true;
    });
  }, [periodServiceOrders, selectedCashierId]);

  const filteredOutflows = useMemo(() => {
    return periodOutflows.filter((outflow) => {
      if (outflow.is_active === false) return false;
      if (selectedCashierId && outflow.created_by !== selectedCashierId) return false;
      return true;
    });
  }, [periodOutflows, selectedCashierId]);

  const dayServiceOrders = useMemo(
    () =>
      selectedDate
        ? filteredServiceOrders.filter((order) => toDateKey(order.created_at) === selectedDate)
        : [],
    [filteredServiceOrders, selectedDate]
  );

  const dayOutflows = useMemo(
    () =>
      selectedDate
        ? filteredOutflows.filter((outflow) => toDateKey(outflow.created_at) === selectedDate)
        : [],
    [filteredOutflows, selectedDate]
  );

  const dailyReportDays = useMemo(() => {
    const map = new Map<
      string,
      {
        period: string;
        sales_count: number;
        total_revenue: string;
        average_value: string;
        services_count: number;
        services_revenue: number;
        outflows_count: number;
      }
    >();

    dailySales.forEach((day) => {
      const key = toDateKey(day.period);
      map.set(key, {
        period: key,
        sales_count: day.sales_count || 0,
        total_revenue: day.total_revenue || "0",
        average_value: day.average_value || "0",
        services_count: 0,
        services_revenue: 0,
        outflows_count: 0,
      });
    });

    const ensureDay = (iso: string) => {
      const key = toDateKey(iso);
      if (!map.has(key)) {
        map.set(key, {
          period: key,
          sales_count: 0,
          total_revenue: "0",
          average_value: "0",
          services_count: 0,
          services_revenue: 0,
          outflows_count: 0,
        });
      }
      return map.get(key)!;
    };

    filteredServiceOrders.forEach((order) => {
      const day = ensureDay(order.created_at);
      day.services_count += 1;
      day.services_revenue += parseFloat(order.total || "0");
    });

    filteredOutflows.forEach((outflow) => {
      ensureDay(outflow.created_at).outflows_count += 1;
    });

    const today = format(new Date(), "yyyy-MM-dd");
    if (today >= startDate && today <= endDate) {
      ensureDay(`${today}T12:00:00`);
    }
    if (selectedDate && selectedDate >= startDate && selectedDate <= endDate) {
      ensureDay(`${selectedDate}T12:00:00`);
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.period).getTime() - new Date(a.period).getTime()
    );
  }, [dailySales, filteredServiceOrders, filteredOutflows, startDate, endDate, selectedDate]);

  const periodServiceTotals = useMemo(() => {
    const total_orders = filteredServiceOrders.length;
    const total_revenue = filteredServiceOrders.reduce(
      (sum, order) => sum + parseFloat(order.total || "0"),
      0
    );
    return { total_orders, total_revenue };
  }, [filteredServiceOrders]);

  const periodOutflowTotals = useMemo(() => {
    const productItems = filteredOutflows.filter((o) => isProductOutflow(o.outflow_type));
    const cashItems = filteredOutflows.filter((o) => !isProductOutflow(o.outflow_type));
    return {
      product_count: productItems.length,
      cash_count: cashItems.length,
      product_quantity: productItems.reduce((sum, o) => sum + parseFloat(o.quantity || "0"), 0),
      cash_amount: cashItems.reduce((sum, o) => sum + parseFloat(o.amount || "0"), 0),
    };
  }, [filteredOutflows]);

  // Calcular resumo de métodos de pagamento
  const getSalePaymentMethodLabel = (sale: Sale) => {
    const savedLabel = String(sale.notes || "").match(/M[eé]todo\s*:\s*([^\n)]+)/i)?.[1]?.trim();
    if (savedLabel) return savedLabel;
    const method = sale.payment_method || "cash";
    const labels: Record<string, string> = {
      cash: "Dinheiro", skywallet: "E-Mola", emola: "E-Mola", mpesa: "M-Pesa", card: "BCI-POS", mixed: "Misto",
    };
    return labels[method] || method;
  };

  const paymentMethodsSummary = (daySales.length > 0 ? daySales : allSales).reduce((acc, sale) => {
    const method = getSalePaymentMethodLabel(sale);
    if (!acc[method]) {
      acc[method] = { count: 0, total: 0 };
    }
    acc[method].count += 1;
    acc[method].total += parseFloat(sale.total);
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  // Dashboard is scoped to the selected period, not to the currently selected day.
  // Build this from the actual sales so custom methods (for example ABSA) appear too.
  const periodPaymentMethodsSummary = allSales.reduce((acc, sale) => {
    const method = getSalePaymentMethodLabel(sale);
    if (!acc[method]) acc[method] = { count: 0, total: 0 };
    acc[method].count += 1;
    acc[method].total += parseFloat(sale.total || "0");
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat("pt-MZ", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num) + " MT";
  };

  const formatQuantity = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (Number.isNaN(num)) return String(value);
    if (Number.isInteger(num)) return `${num.toFixed(0)}x`;
    return `${parseFloat(num.toFixed(3))} Kg`;
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const formatTime = (dateString: string) => {
    return format(parseISO(dateString), "HH:mm", { locale: ptBR });
  };

  const cashierTotals = useMemo(() => {
    const map = new Map<number | string, { name: string; total: number; count: number }>();
    allSales.forEach((sale) => {
      const id = sale.created_by ?? "desconhecido";
      const name = typeof id === "number" ? cashierNameByUserId.get(id) || `#${id}` : "Sem caixa";
      if (!map.has(id)) map.set(id, { name, total: 0, count: 0 });
      const entry = map.get(id)!;
      entry.total += parseFloat(sale.total);
      entry.count += 1;
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [allSales, cashierNameByUserId]);

  const monthlyTotals = useMemo(() => {
    const map = new Map<string, { label: string; total: number; count: number }>();
    allSales.forEach((sale) => {
      const d = parseISO(sale.created_at);
      const key = format(d, "yyyy-MM");
      const label = format(d, "MMM/yyyy", { locale: ptBR });
      if (!map.has(key)) map.set(key, { label, total: 0, count: 0 });
      const entry = map.get(key)!;
      entry.total += parseFloat(sale.total);
      entry.count += 1;
    });
    return Array.from(map.values()).sort((a, b) => (a.label < b.label ? 1 : -1));
  }, [allSales]);

  const yearlyTotals = useMemo(() => {
    const map = new Map<string, { label: string; total: number; count: number }>();
    allSales.forEach((sale) => {
      const d = parseISO(sale.created_at);
      const key = format(d, "yyyy");
      if (!map.has(key)) map.set(key, { label: key, total: 0, count: 0 });
      const entry = map.get(key)!;
      entry.total += parseFloat(sale.total);
      entry.count += 1;
    });
    return Array.from(map.values()).sort((a, b) => (a.label < b.label ? 1 : -1));
  }, [allSales]);

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: "Dinheiro",
      emola: "E-mola",
      skywallet: "E-mola",
      mpesa: "Mpesa",
      bci_pos: "BCI-POS",
      card: "BCI-POS",
      bim_pos: "BIM-POS",
      mozabanco: "MozaBanco",
      standerback: "StanderBack",
      mixed: "Misto",
    };
    return labels[method] || method;
  };

  const filteredCashRegisters = useMemo(() => {
    const query = operatorNameFilter.trim().toLowerCase();
    return cashRegisters.filter((register) => {
      const operatorName = cashierNameByUserId.get(register.user_id) || `#${register.user_id}`;
      if (!query) return true;
      return operatorName.toLowerCase().includes(query);
    });
  }, [cashRegisters, operatorNameFilter, cashierNameByUserId]);

  const handleDownloadReport = async (type: "pdf" | "excel") => {
    try {
      const { blob, filename: apiFilename } =
        type === "pdf"
          ? await dashboardApi.downloadSalesSummaryPdf(startDate, endDate, selectedCashierId)
          : await dashboardApi.downloadSalesSummaryExcel(startDate, endDate, selectedCashierId);

      const filename =
        apiFilename ||
        `relatorio-${type === "pdf" ? "pdf" : "excel"}-${startDate || "inicio"}-${endDate || "fim"}.${
          type === "pdf" ? "pdf" : "xlsx"
        }`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err?.message || `Erro ao baixar ${type === "pdf" ? "PDF" : "Excel"}`);
    }
  };

  const handleSelectDay = (date: string) => {
    setSelectedDate(date);
    setActiveView("daily");
  };

  const handleViewSaleDetails = (sale: Sale) => {
    setSelectedSale(sale);
    setIsSaleDetailOpen(true);
  };

  const handleReprintReceipt = async (sale: Sale) => {
    if (sale.status === "cancelled") {
      toast.error("Não é possível reimprimir uma venda cancelada.");
      return;
    }

    setReprintingSaleId(sale.id);
    try {
      let fullSale = sale;
      if (!sale.items?.length) {
        fullSale = await salesApi.get(sale.id);
      }

      const receiptContent = formatSaleReceipt(fullSale, { terminal });
      const printResult = await printReceipt(receiptContent);
      if (printResult && !printResult.success) {
        toast.error(`Falha na impressão: ${printResult.error || "Nenhuma impressora configurada"}`, {
          duration: 6000,
        });
      } else if (printResult?.success) {
        toast.success("Recibo reimpresso com sucesso!");
      }
    } catch (error: any) {
      console.error("Erro ao reimprimir recibo:", error);
      toast.error(`Erro ao reimprimir recibo: ${error?.message || error}`, { duration: 6000 });
    } finally {
      setReprintingSaleId(null);
    }
  };

  const handleExport = async (
    type: "pdf" | "excel",
    opts?: { skipPhoneCheck?: boolean; productScope?: "all" | "beverages" }
  ) => {
    try {
      const hasPhone = !!whatsappPrefs.phone?.trim();
      if (!hasPhone && !opts?.skipPhoneCheck) {
        setPendingExportType(type);
        setPendingProductScope(opts?.productScope || "all");
        setShowWhatsappDialog(true);
        return;
      }
      // Se estiver na view diária e tiver uma data selecionada, exporta apenas esse dia
      const isDailyView = activeView === "daily" && selectedDate;
      let exportStart: string | undefined = undefined;
      let exportEnd: string | undefined = undefined;
      if (isDailyView && selectedDate) {
        const s = startOfDay(parseISO(selectedDate));
        const e = endOfDay(parseISO(selectedDate));
        exportStart = s.toISOString();
        exportEnd = e.toISOString();
      } else {
        exportStart = startDate;
        exportEnd = endDate;
      }

      const phoneParam = whatsappPrefs.enabled && hasPhone ? whatsappPrefs.phone : undefined;
      const { blob, filename: apiFilename } =
        type === "pdf"
          ? await dashboardApi.downloadSalesSummaryPdf(
              exportStart!,
              exportEnd!,
              selectedCashierId,
              phoneParam,
              opts?.productScope
            )
          : await dashboardApi.downloadSalesSummaryExcel(exportStart!, exportEnd!, selectedCashierId, phoneParam);

      const todayStr = format(new Date(), 'dd-MM-yyyy');
      // Formata o período para o nome do arquivo
      const periodStr = isDailyView
        ? format(parseISO(selectedDate!), 'dd-MM-yyyy')
        : `${format(parseISO(startDate), 'dd-MM-yyyy')}_a_${format(parseISO(endDate), 'dd-MM-yyyy')}`;

      const ext = type === "pdf" ? "pdf" : "xlsx";
      const filename = `Relatório_${todayStr}_Ref_${periodStr}.${ext}`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      // placeholder para envio ao WhatsApp
    } catch (e: any) {
      console.error(e?.message || `Falha ao gerar o ${type === "pdf" ? "PDF" : "Excel"}`);
    }
  };

  const handleExportPDF = () => {
    handleExport("pdf", { productScope: "all" });
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
    } else if (period === "week") {
      start.setDate(end.getDate() - 7);
      setStartDate(format(start, "yyyy-MM-dd"));
      setEndDate(format(end, "yyyy-MM-dd"));
      setActiveView("daily");
    } else if (period === "month") {
      setStartDate(format(startOfMonth(start), "yyyy-MM-dd"));
      setEndDate(format(endOfMonth(end), "yyyy-MM-dd"));
      setActiveView("daily");
    }
  };

  useEffect(() => {
    if (activeView !== "daily" || selectedDate) return;
    setSelectedDate(format(new Date(), "yyyy-MM-dd"));
  }, [activeView, selectedDate]);

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
      description: "Vendas, serviços e saídas por dia",
    },
    {
      id: "all-sales" as ReportView,
      label: "Todas as Vendas",
      icon: Receipt24Regular,
      description: "Histórico completo",
    },
    {
      id: "cash-registers" as ReportView,
      label: "Caixas",
      icon: Money24Regular,
      description: "Caixas abertos e fechados",
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
          if (nextView === "daily" && !selectedDate) {
            setSelectedDate(format(new Date(), "yyyy-MM-dd"));
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
                    if (value === "all") {
                      setSelectedCashierId(undefined);
                      return;
                    }
                    const parsed = Number(value);
                    setSelectedCashierId(Number.isFinite(parsed) ? parsed : undefined);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todos os caixas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os caixas</SelectItem>
                    {cashiers.map((cashier) => (
                      <SelectItem key={cashier.id} value={String(cashier.user_id)}>
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
                  {activeView === "cash-registers" && "Relatorio de Caixas"}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {activeView === "dashboard" && ""}
                  {activeView === "daily" && "Visualize vendas, serviços e saídas por dia"}
                  {activeView === "all-sales" && "Histórico completo de vendas"}
                  {activeView === "cash-registers" && "Caixas abertos e fechados por operador"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(activeView === "daily" || activeView === "all-sales") && (
                <>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-8 w-[138px] text-xs"
                    aria-label="Data inicial"
                  />
                  <span className="text-muted-foreground text-xs">até</span>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-8 w-[138px] text-xs"
                    aria-label="Data final"
                  />
                  <div className="hidden sm:block w-px h-6 bg-border mx-1" />
                </>
              )}
              <Button variant="outline" onClick={() => handleQuickFilter("today")} size="sm">
                Hoje
              </Button>
              <Button variant="outline" onClick={() => handleQuickFilter("yesterday")} size="sm">
                Ontem
              </Button>
              <Button variant="outline" onClick={() => handleQuickFilter("week")} size="sm">
                7 Dias
              </Button>
              <Button variant="outline" onClick={() => handleQuickFilter("month")} size="sm">
                Mês
              </Button>
              <div className="hidden sm:block w-px h-6 bg-border mx-1" />
              <Button onClick={handleExportPDF} className="gap-2" variant="outline" title="Exportar Relatório PDF">
                <Print24Regular className="w-4 h-4" />
                PDF
              </Button>
              <Button
                onClick={() => handleExport("excel")}
                className="gap-2"
                variant="outline"
                title="Exportar Relatório Excel"
              >
                <Document24Regular className="w-4 h-4" />
                Excel
              </Button>
            </div>
          </div>

          {/* Content based on active view */}
          <div className="flex-1 overflow-y-auto">
            {activeView === "dashboard" && (
              <DashboardView
                summary={summary}
                summaryLoading={summaryLoading}
                formatCurrency={formatCurrency}
                serviceTotals={periodServiceTotals}
                outflowTotals={periodOutflowTotals}
                extrasLoading={servicesLoading || outflowsLoading}
                paymentMethodsSummary={periodPaymentMethodsSummary}
              />
            )}

            {activeView === "daily" && (
              <DailyReportsView
                dailySales={dailyReportDays}
                dailyLoading={dailyLoading || servicesLoading || outflowsLoading}
                selectedDate={selectedDate}
                daySummary={daySummary}
                daySummaryLoading={daySummaryLoading}
                daySales={daySales}
                daySalesLoading={daySalesLoading}
                dayServiceOrders={dayServiceOrders}
                dayServicesLoading={servicesLoading}
                dayOutflows={dayOutflows}
                dayOutflowsLoading={outflowsLoading}
                paymentMethodsSummary={paymentMethodsSummary}
                cashierNameByUserId={cashierNameByUserId}
                onSelectDay={handleSelectDay}
                onViewSale={handleViewSaleDetails}
                onReprintReceipt={handleReprintReceipt}
                reprintingSaleId={reprintingSaleId}
                startDate={startDate}
                endDate={endDate}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                formatTime={formatTime}
                formatQuantity={formatQuantity}
                getPaymentMethodLabel={getPaymentMethodLabel}
              />
            )}

            {activeView === "all-sales" && (
              <AllSalesView
                sales={allSales}
                isLoading={allSalesLoading}
                paymentMethodsSummary={paymentMethodsSummary}
                cashierTotals={cashierTotals}
                monthlyTotals={monthlyTotals}
                yearlyTotals={yearlyTotals}
                onViewSale={handleViewSaleDetails}
                onReprintReceipt={handleReprintReceipt}
                reprintingSaleId={reprintingSaleId}
                formatCurrency={formatCurrency}
                formatTime={formatTime}
                getPaymentMethodLabel={getPaymentMethodLabel}
              />
            )}

            {activeView === "cash-registers" && (
              <CashRegistersView
                registers={filteredCashRegisters}
                isLoading={cashRegistersLoading}
                formatCurrency={formatCurrency}
                cashierNameByUserId={cashierNameByUserId}
                operatorNameFilter={operatorNameFilter}
                onOperatorNameFilterChange={setOperatorNameFilter}
                isAdmin={isAdmin}
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
                              {formatQuantity(item.quantity)} {formatCurrency(item.unit_price || 0)}
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
              {selectedSale && selectedSale.status !== "cancelled" && (
                <Button
                  onClick={() => handleReprintReceipt(selectedSale)}
                  disabled={reprintingSaleId === selectedSale.id}
                  className="gap-2"
                >
                  <Print24Regular className="w-4 h-4" />
                  {reprintingSaleId === selectedSale.id ? "A imprimir..." : "Reimprimir Recibo"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showWhatsappDialog} onOpenChange={setShowWhatsappDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enviar para WhatsApp</DialogTitle>
              <DialogDescription>
                Informe o número de WhatsApp que deve receber o relatório. Você pode desativar esse envio nas
                configurações.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3">
              <Input
                placeholder="Ex.: +25884XXXXXXX"
                value={tempPhone}
                onChange={(e) => setTempPhone(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={whatsappPrefs.enabled}
                  onChange={(e) => setWhatsappPrefs({ enabled: e.target.checked })}
                />
                <span className="text-sm text-muted-foreground">Ativar envio automático para WhatsApp</span>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowWhatsappDialog(false);
                  if (pendingExportType) {
                    handleExport(pendingExportType, {
                      skipPhoneCheck: true,
                      productScope: pendingProductScope,
                    });
                  }
                }}
              >
                Imprimir sem WhatsApp
              </Button>
              <Button
              onClick={() => {
                  setWhatsappPrefs({ phone: tempPhone, enabled: true });
                  saveToBackend(tempPhone);
                  setShowWhatsappDialog(false);
                  if (pendingExportType) {
                    handleExport(pendingExportType, {
                      skipPhoneCheck: true,
                      productScope: pendingProductScope,
                    });
                  }
                }}
                disabled={!tempPhone.trim()}
              >
                Salvar e continuar
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
  formatCurrency,
  serviceTotals,
  outflowTotals,
  extrasLoading,
  paymentMethodsSummary,
}: {
  summary: any;
  summaryLoading: boolean;
  formatCurrency: (value: string | number) => string;
  serviceTotals: { total_orders: number; total_revenue: number };
  outflowTotals: { product_count: number; cash_count: number; product_quantity: number; cash_amount: number };
  extrasLoading: boolean;
  paymentMethodsSummary: Record<string, { count: number; total: number }>;
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="fluent-card p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Serviços Prestados</p>
            <h3 className="text-2xl font-bold mt-1">
              {extrasLoading ? "..." : formatCurrency(serviceTotals?.total_revenue || 0)}
            </h3>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
              <Wrench24Regular className="w-5 h-5" />
            </div>
            <span className="text-xs text-muted-foreground">
              {serviceTotals?.total_orders || 0} ordem(ns)
            </span>
          </div>
        </div>
        <div className="fluent-card p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Saídas de Dinheiro</p>
            <h3 className="text-2xl font-bold mt-1">
              {extrasLoading ? "..." : formatCurrency(outflowTotals?.cash_amount || 0)}
            </h3>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
              <ArrowExit24Regular className="w-5 h-5" />
            </div>
            <span className="text-xs text-muted-foreground">
              {outflowTotals?.cash_count || 0} saída(s) do caixa
            </span>
          </div>
        </div>
        <div className="fluent-card p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Saídas de Produto</p>
            <h3 className="text-2xl font-bold mt-1">
              {extrasLoading ? "..." : outflowTotals?.product_quantity || 0}
            </h3>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <Box24Regular className="w-5 h-5" />
            </div>
            <span className="text-xs text-muted-foreground">
              {outflowTotals?.product_count || 0} retirada(s)
            </span>
          </div>
        </div>
      </div>

      {/* Payment Methods Summary */}
      {summary && (
        <div className="fluent-card p-4">
          <h3 className="text-lg font-semibold mb-4">Resumo por Método de Pagamento</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(paymentMethodsSummary).map(([method, data]) => (
              <div key={method} className="p-3 rounded-lg bg-muted/30 border border-border">
                <p className="text-xs text-muted-foreground uppercase mb-1">{method}</p>
                <p className="text-lg font-bold">{formatCurrency(data.total)}</p>
                <p className="text-xs text-muted-foreground">{data.count} transação(ões)</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="fluent-card p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Serviços prestados</p>
            <h3 className="text-2xl font-bold mt-1">
              {extrasLoading ? "..." : formatCurrency(serviceTotals.total_revenue)}
            </h3>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
              <Wrench24Regular className="w-5 h-5" />
            </div>
            <span className="text-xs text-muted-foreground">
              {extrasLoading ? "..." : `${serviceTotals.total_orders} ordem(ns)`}
            </span>
          </div>
        </div>
        <div className="fluent-card p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Saídas de dinheiro</p>
            <h3 className="text-2xl font-bold mt-1">
              {extrasLoading ? "..." : formatCurrency(outflowTotals.cash_amount)}
            </h3>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
              <ArrowExit24Regular className="w-5 h-5" />
            </div>
            <span className="text-xs text-muted-foreground">
              {extrasLoading ? "..." : `${outflowTotals.cash_count} saída(s) do caixa`}
            </span>
          </div>
        </div>
        <div className="fluent-card p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Saídas de produto</p>
            <h3 className="text-2xl font-bold mt-1">
              {extrasLoading ? "..." : outflowTotals.product_quantity}
            </h3>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <Box24Regular className="w-5 h-5" />
            </div>
            <span className="text-xs text-muted-foreground">
              {extrasLoading ? "..." : `${outflowTotals.product_count} saída(s) de stock`}
            </span>
          </div>
        </div>
      </div>
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
  dayServiceOrders = [],
  dayServicesLoading = false,
  dayOutflows = [],
  dayOutflowsLoading = false,
  paymentMethodsSummary,
  cashierNameByUserId,
  onSelectDay,
  onViewSale,
  onReprintReceipt,
  reprintingSaleId,
  startDate,
  endDate,
  formatCurrency,
  formatDate,
  formatTime,
  formatQuantity,
  getPaymentMethodLabel,
}: {
  dailySales: Array<{
    period: string;
    sales_count: number;
    total_revenue: string;
    average_value: string;
    services_count: number;
    services_revenue: number;
    outflows_count: number;
  }>;
  dailyLoading: boolean;
  selectedDate: string | null;
  daySummary: any;
  daySummaryLoading: boolean;
  daySales: Sale[];
  daySalesLoading: boolean;
  dayServiceOrders: PDVServiceOrder[];
  dayServicesLoading: boolean;
  dayOutflows: PDVOutflow[];
  dayOutflowsLoading: boolean;
  paymentMethodsSummary: Record<string, { count: number; total: number }>;
  cashierNameByUserId: Map<number, string>;
  onSelectDay: (date: string) => void;
  onViewSale: (sale: Sale) => void;
  onReprintReceipt: (sale: Sale) => void;
  reprintingSaleId: number | null;
  startDate: string;
  endDate: string;
  formatCurrency: (value: string | number) => string;
  formatDate: (dateString: string) => string;
  formatTime: (dateString: string) => string;
  formatQuantity: (value: string | number) => string;
  getPaymentMethodLabel: (method: string) => string;
}) {
  const serviceRevenue = dayServiceOrders.reduce(
    (sum, order) => sum + parseFloat(order.total || "0"),
    0
  );
  const cashOutflows = dayOutflows.filter((o) => !isProductOutflow(o.outflow_type));
  const productOutflows = dayOutflows.filter((o) => isProductOutflow(o.outflow_type));
  const cashOutflowTotal = cashOutflows.reduce((sum, o) => sum + parseFloat(o.amount || "0"), 0);
  const productOutflowQty = productOutflows.reduce((sum, o) => sum + parseFloat(o.quantity || "0"), 0);
  const selectedDay = dailySales.find((day) => day.period === selectedDate);
  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
      <div className="lg:col-span-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto fluent-card p-2">
          <p className="text-xs text-muted-foreground px-2 pt-2 pb-3 border-b border-border mb-2">
            {format(parseISO(startDate), "dd/MM/yyyy", { locale: ptBR })}
            {" – "}
            {format(parseISO(endDate), "dd/MM/yyyy", { locale: ptBR })}
          </p>
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
                    {formatCurrency(
                      parseFloat(day.total_revenue || "0") + (day.services_revenue || 0)
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {day.services_count || 0} serviço(s) · {day.outflows_count || 0} saída(s)
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
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {daySummary?.total_sales ?? daySales.length} vendas
                      {selectedDay ? ` • ${selectedDay.services_count} serviço(s)` : ""}
                      {selectedDay ? ` • ${selectedDay.outflows_count} saída(s)` : ""}
                      {daySummary ? ` • Vendas: ${formatCurrency(daySummary.total_revenue)}` : ""}
                    </p>
                  )}
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

            {/* Lista de Vendas, Serviços e Saídas do Dia */}
            <div className="flex-1 overflow-y-auto space-y-4">
              <div className="fluent-card">
              <div className="p-4 border-b border-border">
                <h3 className="text-lg font-semibold">Vendas do Dia</h3>
              </div>
              {daySalesLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="text-muted-foreground">Carregando vendas...</div>
                </div>
              ) : daySales.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
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
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onViewSale(sale)}
                                className="gap-2"
                              >
                                <Eye24Regular className="w-4 h-4" />
                                Ver
                              </Button>
                              {sale.status !== "cancelled" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onReprintReceipt(sale)}
                                  disabled={reprintingSaleId === sale.id}
                                  className="gap-2"
                                  title="Reimprimir recibo térmico"
                                >
                                  <Print24Regular className="w-4 h-4" />
                                  {reprintingSaleId === sale.id ? "..." : "Reimprimir"}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              </div>

              <div className="fluent-card">
                <div className="p-4 border-b border-border flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Wrench24Regular className="w-5 h-5 text-indigo-500" />
                    <h3 className="text-lg font-semibold">Serviços prestados</h3>
                  </div>
                  <Badge variant="outline">
                    {dayServiceOrders.length} • {formatCurrency(serviceRevenue)}
                  </Badge>
                </div>
                {dayServicesLoading ? (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    Carregando serviços...
                  </div>
                ) : dayServiceOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-center">
                    <Wrench24Regular className="w-12 h-12 mb-2 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground">Nenhum serviço prestado neste dia</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Hora</TableHead>
                          <TableHead>Serviço</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Qtd</TableHead>
                          <TableHead>Método</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dayServiceOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">{formatTime(order.created_at)}</TableCell>
                            <TableCell>{order.service_name}</TableCell>
                            <TableCell>{order.customer_name || "Balcão"}</TableCell>
                            <TableCell>{formatQuantity(order.quantity || "1")}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{getPaymentMethodLabel(order.payment_method)}</Badge>
                            </TableCell>
                            <TableCell className="font-semibold text-primary">
                              {formatCurrency(order.total)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <div className="fluent-card">
                <div className="p-4 border-b border-border flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ArrowExit24Regular className="w-5 h-5 text-rose-500" />
                    <h3 className="text-lg font-semibold">Saídas do caixa</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Dinheiro: {formatCurrency(cashOutflowTotal)}</Badge>
                    <Badge variant="secondary">Produtos: {productOutflowQty} un.</Badge>
                  </div>
                </div>
                {dayOutflowsLoading ? (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    Carregando saídas...
                  </div>
                ) : dayOutflows.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-center">
                    <ArrowExit24Regular className="w-12 h-12 mb-2 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground">Nenhuma saída registada neste dia</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Hora</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Motivo</TableHead>
                          <TableHead>Destino</TableHead>
                          <TableHead>Qtd</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Operador</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dayOutflows.map((outflow) => {
                          const isProduct = isProductOutflow(outflow.outflow_type);
                          const operator =
                            outflow.created_by_name ||
                            (outflow.created_by
                              ? cashierNameByUserId.get(outflow.created_by) || `#${outflow.created_by}`
                              : "—");
                          return (
                            <TableRow key={outflow.id}>
                              <TableCell className="font-medium">{formatTime(outflow.created_at)}</TableCell>
                              <TableCell>
                                <Badge variant={isProduct ? "secondary" : "destructive"}>
                                  {isProduct ? "Produto" : "Dinheiro"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {isProduct
                                  ? outflow.product_name || outflow.title || "—"
                                  : outflow.title || "—"}
                              </TableCell>
                              <TableCell>
                                {OUTFLOW_REASON_LABELS[outflow.reason] || outflow.reason || "—"}
                              </TableCell>
                              <TableCell>{outflow.destination || "—"}</TableCell>
                              <TableCell>{isProduct ? formatQuantity(outflow.quantity || "0") : "—"}</TableCell>
                              <TableCell className="font-semibold text-primary">
                                {isProduct ? "—" : formatCurrency(outflow.amount || 0)}
                              </TableCell>
                              <TableCell>{operator}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
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
  cashierTotals,
  monthlyTotals,
  yearlyTotals,
  onViewSale,
  onReprintReceipt,
  reprintingSaleId,
  formatCurrency,
  formatTime,
  getPaymentMethodLabel,
}: any) {
  return (
    <div className="space-y-6">
      {/* Resumo por Caixa */}
      {cashierTotals?.length > 0 && (
        <div className="fluent-card p-4">
          <h3 className="text-lg font-semibold mb-4">Resumo por Caixa/Vendedor</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Caixa</TableHead>
                <TableHead>Vendas</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cashierTotals.map((c: any) => (
                <TableRow key={c.name}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.count}</TableCell>
                  <TableCell className="font-semibold text-primary">{formatCurrency(c.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Resumo Mensal / Anual */}
      {(monthlyTotals?.length || yearlyTotals?.length) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {monthlyTotals?.length > 0 && (
            <div className="fluent-card p-4">
              <h3 className="text-lg font-semibold mb-3">Resumo Mensal</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead>
                    <TableHead>Vendas</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyTotals.map((m: any) => (
                    <TableRow key={m.label}>
                      <TableCell className="font-medium">{m.label}</TableCell>
                      <TableCell>{m.count}</TableCell>
                      <TableCell className="font-semibold text-primary">{formatCurrency(m.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {yearlyTotals?.length > 0 && (
            <div className="fluent-card p-4">
              <h3 className="text-lg font-semibold mb-3">Resumo Anual</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ano</TableHead>
                    <TableHead>Vendas</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {yearlyTotals.map((y: any) => (
                    <TableRow key={y.label}>
                      <TableCell className="font-medium">{y.label}</TableCell>
                      <TableCell>{y.count}</TableCell>
                      <TableCell className="font-semibold text-primary">{formatCurrency(y.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

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
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewSale(sale)}
                          className="gap-2"
                        >
                          <Eye24Regular className="w-4 h-4" />
                          Ver
                        </Button>
                        {sale.status !== "cancelled" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onReprintReceipt(sale)}
                            disabled={reprintingSaleId === sale.id}
                            className="gap-2"
                            title="Reimprimir recibo térmico"
                          >
                            <Print24Regular className="w-4 h-4" />
                            {reprintingSaleId === sale.id ? "..." : "Reimprimir"}
                          </Button>
                        )}
                      </div>
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

function CashRegistersView({
  registers,
  isLoading,
  formatCurrency,
  cashierNameByUserId,
  operatorNameFilter,
  onOperatorNameFilterChange,
  isAdmin,
}: {
  registers: CashRegister[];
  isLoading: boolean;
  formatCurrency: (value: string | number) => string;
  cashierNameByUserId: Map<number, string>;
  operatorNameFilter: string;
  onOperatorNameFilterChange: (value: string) => void;
  isAdmin: boolean;
}) {
  const getRegisterTotal = (register: CashRegister) => {
    if (register.closing_amount) return register.closing_amount;
    if (register.expected_amount) return register.expected_amount;
    return (
      parseFloat(register.opening_amount || "0") +
      parseFloat(register.total_cash || "0") +
      parseFloat(register.total_card || "0") +
      parseFloat(register.total_skywallet || "0") +
      parseFloat(register.total_mpesa || "0")
    ).toFixed(2);
  };

  const openCount = registers.filter((register) => register.status === "open").length;
  const closedCount = registers.filter((register) => register.status === "closed").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="fluent-card p-4">
          <p className="text-xs text-muted-foreground uppercase mb-1">Total de Caixas</p>
          <p className="text-2xl font-bold">{registers.length}</p>
        </div>
        <div className="fluent-card p-4">
          <p className="text-xs text-muted-foreground uppercase mb-1">Caixas Abertos</p>
          <p className="text-2xl font-bold text-emerald-600">{openCount}</p>
        </div>
        <div className="fluent-card p-4">
          <p className="text-xs text-muted-foreground uppercase mb-1">Caixas Fechados</p>
          <p className="text-2xl font-bold text-muted-foreground">{closedCount}</p>
        </div>
      </div>

      <div className="fluent-card p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Lista de Caixas</h3>
            <p className="text-sm text-muted-foreground">
              Veja caixas abertos e fechados, por operador e periodo.
            </p>
          </div>
          {isAdmin && (
            <div className="w-full md:w-[280px]">
              <Input
                value={operatorNameFilter}
                onChange={(e) => onOperatorNameFilterChange(e.target.value)}
                placeholder="Filtrar por nome do operador"
              />
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            Carregando caixas...
          </div>
        ) : registers.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            Nenhum caixa encontrado com os filtros aplicados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operador</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Abertura</TableHead>
                  <TableHead>Fechamento</TableHead>
                  <TableHead>Total do Caixa</TableHead>
                  <TableHead>Total de Vendas</TableHead>
                  <TableHead>Vendas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registers.map((register) => {
                  const operatorName = cashierNameByUserId.get(register.user_id) || `Caixa ${register.user_id}`;
                  const openedAtDate = parseServerUtcDate(register.opened_at);
                  const closedAtDate = parseServerUtcDate(register.closed_at);
                  const registerDate = openedAtDate ? format(openedAtDate, "dd/MM/yyyy", { locale: ptBR }) : "-";
                  const openedAt = openedAtDate ? format(openedAtDate, "dd/MM/yyyy HH:mm", { locale: ptBR }) : "-";
                  const closedAt = register.closed_at
                    ? format(closedAtDate!, "dd/MM/yyyy HH:mm", { locale: ptBR })
                    : "-";
                  return (
                    <TableRow key={register.id}>
                      <TableCell className="font-medium">{operatorName}</TableCell>
                      <TableCell>
                        <Badge
                          variant={register.status === "open" ? "default" : "secondary"}
                          className={register.status === "open" ? "bg-emerald-600 text-white" : ""}
                        >
                          {register.status === "open" ? "Aberto" : "Fechado"}
                        </Badge>
                      </TableCell>
                      <TableCell>{registerDate}</TableCell>
                      <TableCell>{openedAt}</TableCell>
                      <TableCell>{closedAt}</TableCell>
                      <TableCell className="font-semibold text-primary">
                        {formatCurrency(getRegisterTotal(register))}
                      </TableCell>
                      <TableCell>{formatCurrency(register.total_sales)}</TableCell>
                      <TableCell>{register.sales_count}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
function parseServerUtcDate(value?: string | null) {
  if (!value) return null;
  return /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? new Date(value) : new Date(`${value}Z`);
}

