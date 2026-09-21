import { useEffect, useMemo, useState } from "react";
import {
  Add24Regular,
  ArrowDownload24Regular,
  ArrowExit24Regular,
  Box24Regular,
  CalendarDay24Regular,
  CalendarMonth24Regular,
  CalendarMultiple24Regular,
  CalendarWeekNumbers24Regular,
  Dismiss24Regular,
  Food24Regular,
  Money24Regular,
  Print24Regular,
  Receipt24Regular,
  Search24Regular,
  Warning24Regular,
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useIsMobile } from "@/hooks/use-mobile";
import { useHardwarePlugin } from "@/hooks/useHardwarePlugin";
import { OutflowDialog } from "@/components/OutflowDialog";
import {
  outflowsApi,
  productsApi,
  CreatePDVOutflow,
  PDVOutflow,
  Product,
} from "@/services/api";

// -------------------------------------------------------------------
// Types & Dictionaries
// -------------------------------------------------------------------
type OutflowView =
  | "period-today"
  | "period-week"
  | "period-month"
  | "period-all"
  | "type-product"
  | "type-cash"
  | "reason-cafetaria"
  | "reason-cozinha";

type PeriodFilter = "today" | "week" | "month" | "all";

const REASON_LABELS: Record<string, string> = {
  consumo_interno: "Consumo interno",
  cafetaria: "Cafetaria",
  cozinha: "Cozinha",
  perda: "Perda / Avaria",
  despesa_diaria: "Despesa diária",
  outro: "Outro",
};

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------
function getStartOf(period: PeriodFilter): Date | null {
  const now = new Date();
  if (period === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (period === "week") {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.getFullYear(), now.getMonth(), diff);
  }
  if (period === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return null;
}

function periodLabel(period: PeriodFilter): string {
  if (period === "today") return "Hoje";
  if (period === "week") return "Esta Semana";
  if (period === "month") return "Este Mês";
  return "Todos os Registos";
}

const fmt = (n: string | number | null | undefined, decimals = 2) => {
  const v = parseFloat(String(n ?? 0));
  return isNaN(v) ? "0.00" : v.toFixed(decimals);
};

function formatOutflowsThermalReceipt(
  outflows: PDVOutflow[],
  title: string,
  metrics: { productKg: number; productUnits: number; productValue: number; cashAmount: number; totalCount: number },
  productsById: Map<number, Product>
): string {
  const lines: string[] = [];
  lines.push("=".repeat(42));
  lines.push("      RELATORIO DE SAIDAS");
  lines.push("=".repeat(42));
  lines.push(`Filtro: ${title}`);
  lines.push(`Emitido: ${new Date().toLocaleString("pt-MZ")}`);
  lines.push("-".repeat(42));

  if (outflows.length === 0) {
    lines.push("Sem saidas neste filtro.");
  }

  outflows.forEach((outflow) => {
    const date = new Date(outflow.created_at).toLocaleString("pt-MZ", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    const isProduct = outflow.outflow_type === "product";
    const product = outflow.product_id ? productsById.get(outflow.product_id) : undefined;
    const description = isProduct
      ? outflow.product_name || outflow.title || "Produto"
      : outflow.title || "Saida de caixa";
    const reason = REASON_LABELS[outflow.reason] || outflow.reason || "Outro";
    lines.push(`${date} - ${isProduct ? "PRODUTO" : "CAIXA"}`);
    lines.push(description);
    lines.push(`Motivo: ${reason}`);
    if (isProduct) {
      const quantity = Number(outflow.quantity || 0);
      const isKg = Boolean(product?.allow_decimal_quantity);
      const productValue = quantity * Number(product?.price || 0);
      lines.push(`Quantidade: ${fmt(quantity, isKg ? 3 : 0)} ${isKg ? "Kg" : "un."}`);
      lines.push(`Valor: ${fmt(productValue)} MT`);
    } else {
      lines.push(`Valor: ${fmt(outflow.amount)} MT`);
    }
    lines.push("-".repeat(42));
  });

  lines.push(`Registos: ${metrics.totalCount}`);
  if (metrics.productKg > 0) lines.push(`Produtos por peso: ${fmt(metrics.productKg, 3)} Kg`);
  if (metrics.productUnits > 0) lines.push(`Produtos por unidade: ${fmt(metrics.productUnits, 0)} un.`);
  lines.push(`Valor dos produtos: ${fmt(metrics.productValue)} MT`);
  lines.push(`Despesas de caixa: ${fmt(metrics.cashAmount)} MT`);
  lines.push("=".repeat(42));
  lines.push("");
  return lines.join("\n");
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
export function OutflowsScreen() {
  const styles = useStyles();
  const isMobile = useIsMobile();
  const drawerType: Required<DrawerProps>["type"] = isMobile ? "overlay" : "inline";
  const [isNavOpen, setIsNavOpen] = useState(false);
  const restoreFocusTargetAttributes = useRestoreFocusTarget();
  const queryClient = useQueryClient();

  const [activeView, setActiveView] = useState<OutflowView>("period-today");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReason, setSelectedReason] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [cancelConfirmId, setCancelConfirmId] = useState<number | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isThermalPrinting, setIsThermalPrinting] = useState(false);
  const { printReceipt } = useHardwarePlugin();

  // Derive date range from the active view for PDF export
  const handlePrintPdf = async () => {
    try {
      setIsPdfLoading(true);
      const now = new Date();
      let startDate: string | undefined;
      let endDate: string | undefined;
      let outflowType: "product" | "cash" | undefined;

      if (activeView === "period-today") {
        const s = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        startDate = s.toISOString();
        endDate = now.toISOString();
      } else if (activeView === "period-week") {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const s = new Date(now.getFullYear(), now.getMonth(), diff);
        startDate = s.toISOString();
        endDate = now.toISOString();
      } else if (activeView === "period-month") {
        const s = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate = s.toISOString();
        endDate = now.toISOString();
      } else if (activeView === "type-product") {
        outflowType = "product";
      } else if (activeView === "type-cash") {
        outflowType = "cash";
      }
      // period-all, reason-* → no date filter (all records)

      const { blob, filename } = await outflowsApi.downloadPdf({
        outflow_type: outflowType,
        start_date: startDate,
        end_date: endDate,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "saidas.pdf";
      a.target = "_blank";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err: any) {
      const { toast } = await import("sonner");
      toast.error(err?.message || "Erro ao gerar PDF.");
    } finally {
      setIsPdfLoading(false);
    }
  };

  useEffect(() => {
    setIsNavOpen(!isMobile);
  }, [isMobile]);

  // Data fetching
  const {
    data: outflows = [],
    isLoading: loadingOutflows,
    refetch,
  } = useQuery({
    queryKey: ["outflows"],
    queryFn: () => outflowsApi.list({ limit: 500 }),
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => productsApi.list({ limit: 500 }),
  });

  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  );

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreatePDVOutflow) => outflowsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outflows"] });
      queryClient.invalidateQueries({ queryKey: ["outflows-summary-today"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["cashRegister"] });
      toast.success("Saída registada com sucesso!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao registar saída.");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => outflowsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outflows"] });
      queryClient.invalidateQueries({ queryKey: ["outflows-summary-today"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["cashRegister"] });
      setCancelConfirmId(null);
      toast.success("Saída cancelada e valores/stock revertidos!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao cancelar saída.");
    },
  });

  // ------------------------------------------------------------------
  // Filter logic based on activeView, search, and dropdowns
  // ------------------------------------------------------------------
  const filteredOutflows = useMemo(() => {
    let list = outflows;

    // View-based period filter
    if (activeView === "period-today") {
      const start = getStartOf("today");
      if (start) list = list.filter((o) => new Date(o.created_at) >= start);
    } else if (activeView === "period-week") {
      const start = getStartOf("week");
      if (start) list = list.filter((o) => new Date(o.created_at) >= start);
    } else if (activeView === "period-month") {
      const start = getStartOf("month");
      if (start) list = list.filter((o) => new Date(o.created_at) >= start);
    } else if (activeView === "type-product") {
      list = list.filter((o) => o.outflow_type === "product");
    } else if (activeView === "type-cash") {
      list = list.filter((o) => o.outflow_type === "cash");
    } else if (activeView === "reason-cafetaria") {
      list = list.filter((o) => o.reason === "cafetaria");
    } else if (activeView === "reason-cozinha") {
      list = list.filter((o) => o.reason === "cozinha");
    }

    // Reason filter
    if (selectedReason !== "all") {
      list = list.filter((o) => o.reason === selectedReason);
    }

    // Location filter
    if (selectedLocation !== "all") {
      list = list.filter((o) => o.storage_location === selectedLocation);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (o) =>
          o.title?.toLowerCase().includes(q) ||
          o.product_name?.toLowerCase().includes(q) ||
          o.reason?.toLowerCase().includes(q) ||
          o.destination?.toLowerCase().includes(q) ||
          o.created_by_name?.toLowerCase().includes(q) ||
          o.notes?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [outflows, activeView, selectedReason, selectedLocation, searchQuery]);

  // ------------------------------------------------------------------
  // KPI Metrics computed from current filtered view
  // ------------------------------------------------------------------
  const metrics = useMemo(() => {
    const productItems = filteredOutflows.filter((o) => o.outflow_type === "product");
    const cashItems = filteredOutflows.filter((o) => o.outflow_type === "cash");

    const totalProductKg = productItems.reduce((acc, outflow) => {
      const product = outflow.product_id ? productsById.get(outflow.product_id) : undefined;
      return product?.allow_decimal_quantity ? acc + Number(outflow.quantity || 0) : acc;
    }, 0);
    const totalProductUnits = productItems.reduce((acc, outflow) => {
      const product = outflow.product_id ? productsById.get(outflow.product_id) : undefined;
      return product?.allow_decimal_quantity ? acc : acc + Number(outflow.quantity || 0);
    }, 0);
    const totalCashAmount = cashItems.reduce(
      (acc, o) => acc + parseFloat(String(o.amount || 0)),
      0
    );
    const totalProductValue = productItems.reduce((acc, outflow) => {
      const product = outflow.product_id ? productsById.get(outflow.product_id) : undefined;
      return acc + Number(outflow.quantity || 0) * Number(product?.price || 0);
    }, 0);

    return {
      productCount: productItems.length,
      productKg: totalProductKg,
      productUnits: totalProductUnits,
      productValue: totalProductValue,
      cashCount: cashItems.length,
      cashAmount: totalCashAmount,
      totalCount: filteredOutflows.length,
    };
  }, [filteredOutflows, productsById]);

  const viewTitle = useMemo(() => {
    switch (activeView) {
      case "period-today":
        return "Hoje";
      case "period-week":
        return "Esta Semana";
      case "period-month":
        return "Este Mês";
      case "period-all":
        return "Todos os Registos";
      case "type-product":
        return "Saídas de Produtos";
      case "type-cash":
        return "Despesas de Caixa";
      case "reason-cafetaria":
        return "Saídas para Cafetaria";
      case "reason-cozinha":
        return "Saídas para Cozinha";
      default:
        return "Gestão de Saídas";
    }
  }, [activeView]);

  const handlePrintThermal = async () => {
    try {
      setIsThermalPrinting(true);
      const content = formatOutflowsThermalReceipt(filteredOutflows, viewTitle, metrics, productsById);
      const result = await printReceipt(content);
      if (!result.success) {
        toast.error(`Falha na impressão: ${result.error || "Nenhuma impressora configurada"}`);
        return;
      }
      toast.success("Relatório enviado para a impressora térmica.");
    } catch (error: any) {
      toast.error(`Erro ao imprimir: ${error?.message || error}`);
    } finally {
      setIsThermalPrinting(false);
    }
  };

  return (
    <>
      <div className={styles.root}>
        {/* ── Sidebar ────────────────────────────────────────────── */}
        <NavDrawer
          defaultSelectedValue="period-today"
          open={isNavOpen}
          type={drawerType}
          className={styles.nav}
          onOpenChange={(_, data) => setIsNavOpen(data.open)}
          selectedValue={activeView}
        >
          <NavDrawerHeader>
            <Hamburger
              {...restoreFocusTargetAttributes}
              onClick={() => setIsNavOpen(!isNavOpen)}
            />
          </NavDrawerHeader>
          <NavDrawerBody>
            <div className={styles.drawerContent}>
              {/* Period filters */}
              <NavSectionHeader>Saídas por Período</NavSectionHeader>
              <NavItem
                icon={<CalendarDay24Regular />}
                value="period-today"
                onClick={() => setActiveView("period-today")}
              >
                Hoje
              </NavItem>
              <NavItem
                icon={<CalendarWeekNumbers24Regular />}
                value="period-week"
                onClick={() => setActiveView("period-week")}
              >
                Esta Semana
              </NavItem>
              <NavItem
                icon={<CalendarMonth24Regular />}
                value="period-month"
                onClick={() => setActiveView("period-month")}
              >
                Este Mês
              </NavItem>
              <NavItem
                icon={<CalendarMultiple24Regular />}
                value="period-all"
                onClick={() => setActiveView("period-all")}
              >
                Todos ({outflows.length})
              </NavItem>

              {/* Type filters */}
              <NavSectionHeader>Por Tipo</NavSectionHeader>
              <NavItem
                icon={<Box24Regular />}
                value="type-product"
                onClick={() => setActiveView("type-product")}
              >
                Produtos ({outflows.filter((o) => o.outflow_type === "product").length})
              </NavItem>
              <NavItem
                icon={<Money24Regular />}
                value="type-cash"
                onClick={() => setActiveView("type-cash")}
              >
                Dinheiro ({outflows.filter((o) => o.outflow_type === "cash").length})
              </NavItem>

              {/* Quick destination filters */}
              <NavSectionHeader>Destinos Frequentes</NavSectionHeader>
              <NavItem
                icon={<Food24Regular />}
                value="reason-cafetaria"
                onClick={() => setActiveView("reason-cafetaria")}
              >
                Cafetaria ({outflows.filter((o) => o.reason === "cafetaria").length})
              </NavItem>
              <NavItem
                icon={<Food24Regular />}
                value="reason-cozinha"
                onClick={() => setActiveView("reason-cozinha")}
              >
                Cozinha ({outflows.filter((o) => o.reason === "cozinha").length})
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
                    aria-label="Abrir menu de saídas"
                  >
                    <Hamburger />
                  </button>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500 text-white md:h-10 md:w-10">
                    <ArrowExit24Regular className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-foreground md:text-2xl">
                      Gestão de Saídas
                    </h1>
                    <p className="hidden text-xs text-muted-foreground sm:block md:text-sm">
                      A mostrar: {viewTitle}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handlePrintPdf}
                    disabled={isPdfLoading}
                    className="fluent-button justify-center gap-2 px-3 border-orange-400 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 transition-colors"
                    title="Imprimir PDF das saídas actuais"
                  >
                    <ArrowDownload24Regular
                      className={`h-5 w-5 ${isPdfLoading ? "animate-pulse" : ""}`}
                    />
                    <span className="hidden sm:inline">{isPdfLoading ? "A gerar..." : "Imprimir PDF"}</span>
                  </button>

                  <button
                    onClick={handlePrintThermal}
                    disabled={isThermalPrinting}
                    className="fluent-button justify-center gap-2 px-3 border-orange-400 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 transition-colors"
                    title="Imprimir relatório em texto na impressora térmica"
                  >
                    <Print24Regular className={`h-5 w-5 ${isThermalPrinting ? "animate-pulse" : ""}`} />
                    <span className="hidden sm:inline">{isThermalPrinting ? "A imprimir..." : "Imprimir térmico"}</span>
                  </button>

                  <button
                    onClick={() => setDialogOpen(true)}
                    className="fluent-button bg-orange-500 hover:bg-orange-600 text-white justify-center gap-2 px-3 font-semibold transition-colors"
                  >
                    <Add24Regular className="h-5 w-5" />
                    <span className="hidden sm:inline">Nova Saída</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ── Body content ─────────────────────────────────────── */}
            <div className="windows-scrollbar flex-1 overflow-auto p-3 md:p-6">
              {/* Summary / KPI Cards */}
              <div className="mb-6 grid gap-3 md:grid-cols-3">
                {/* Card 1: Produtos */}
                <div className="fluent-card p-4 flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Box24Regular className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground md:text-sm">Produtos Retirados</p>
                    <p className="mt-1 text-xl font-bold text-foreground md:text-2xl">
                      {metrics.productValue.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MT
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {metrics.productCount} {metrics.productCount === 1 ? "saída" : "saídas"}
                    </p>
                  </div>
                </div>

                {/* Card 2: Dinheiro */}
                <div className="fluent-card p-4 flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Money24Regular className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground md:text-sm">Despesas de Caixa</p>
                    <p className="mt-1 text-xl font-bold text-foreground md:text-2xl">
                      {metrics.cashAmount.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MT
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {metrics.cashCount} {metrics.cashCount === 1 ? "saída" : "saídas"}
                    </p>
                  </div>
                </div>

                {/* Card 3: Total Geral */}
                <div className="fluent-card p-4 flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Receipt24Regular className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground md:text-sm">Total de Registos</p>
                    <p className="mt-1 text-xl font-bold text-foreground md:text-2xl">
                      {metrics.totalCount}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Filtro activo: {viewTitle}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Table with Filters ──────────────────────────────── */}
              <div className="fluent-card overflow-hidden">
                {/* Table Toolbar / Filters */}
                <div className="border-b border-border p-3 md:p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <ArrowExit24Regular className="h-4 w-4 text-orange-500" />
                      Registos — {viewTitle}
                    </h3>
                    <span className="rounded-full px-2 py-0.5 text-xs bg-muted text-muted-foreground font-medium">
                      {filteredOutflows.length} {filteredOutflows.length === 1 ? "item" : "itens"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Search */}
                    <div className="relative min-w-[180px] sm:w-56">
                      <Search24Regular className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Pesquisar saídas..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-secondary border border-border text-xs focus:outline-none focus:ring-1 focus:ring-orange-400"
                      />
                    </div>

                    {/* Filter by Reason */}
                    <select
                      value={selectedReason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-secondary border border-border text-xs focus:outline-none focus:ring-1 focus:ring-orange-400"
                    >
                      <option value="all">Todos os motivos</option>
                      <option value="consumo_interno">Consumo interno</option>
                      <option value="cafetaria">Cafetaria</option>
                      <option value="cozinha">Cozinha</option>
                      <option value="perda">Perda / Avaria</option>
                      <option value="despesa_diaria">Despesa diária</option>
                      <option value="outro">Outro</option>
                    </select>

                    {/* Filter by Stock Location */}
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-secondary border border-border text-xs focus:outline-none focus:ring-1 focus:ring-orange-400"
                    >
                      <option value="all">Todos os locais</option>
                      <option value="balcao">Balcão</option>
                      <option value="armazem">Armazém</option>
                      <option value="congelado">Congelado</option>
                    </select>
                  </div>
                </div>

                {/* Table Content */}
                {loadingOutflows ? (
                  <div className="flex h-48 items-center justify-center text-muted-foreground">
                    <p className="text-sm">A carregar registos de saídas...</p>
                  </div>
                ) : filteredOutflows.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground space-y-3">
                    <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto text-orange-500">
                      <ArrowExit24Regular className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium">Nenhuma saída registada para este filtro.</p>
                    <button
                      onClick={() => setDialogOpen(true)}
                      className="fluent-button bg-orange-500 hover:bg-orange-600 text-white inline-flex gap-2 px-4 font-semibold text-xs transition-colors"
                    >
                      <Add24Regular className="h-4 w-4" />
                      Registar Nova Saída
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-secondary/50">
                        <tr>
                          <th className="p-3 text-left text-xs font-semibold text-foreground">
                            ID / Tipo
                          </th>
                          <th className="p-3 text-left text-xs font-semibold text-foreground">
                            Data / Hora
                          </th>
                          <th className="p-3 text-left text-xs font-semibold text-foreground">
                            Motivo
                          </th>
                          <th className="p-3 text-left text-xs font-semibold text-foreground">
                            Item / Descrição
                          </th>
                          <th className="p-3 text-left text-xs font-semibold text-foreground">
                            Destino / Local
                          </th>
                          <th className="p-3 text-left text-xs font-semibold text-foreground">
                            Operador
                          </th>
                          <th className="p-3 text-right text-xs font-semibold text-foreground">
                            Qtd / Valor
                          </th>
                          <th className="p-3 text-center text-xs font-semibold text-foreground">
                            Ação
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOutflows.map((outflow) => {
                          const isProduct = outflow.outflow_type === "product";
                          const product = outflow.product_id ? productsById.get(outflow.product_id) : undefined;
                          const quantity = Number(outflow.quantity || 0);
                          const isKg = Boolean(product?.allow_decimal_quantity);
                          const productValue = quantity * Number(product?.price || 0);
                          return (
                            <tr
                              key={outflow.id}
                              className="border-t border-border transition-colors hover:bg-secondary/30 group"
                            >
                              {/* ID / Tipo */}
                              <td className="p-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                                    isProduct
                                      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  }`}
                                >
                                  {isProduct ? (
                                    <Box24Regular className="w-3.5 h-3.5" />
                                  ) : (
                                    <Money24Regular className="w-3.5 h-3.5" />
                                  )}
                                  #{outflow.id}
                                </span>
                              </td>

                              {/* Data / Hora */}
                              <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                                {new Date(outflow.created_at).toLocaleString("pt-MZ", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </td>

                              {/* Motivo */}
                              <td className="p-3">
                                <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-muted text-foreground border border-border">
                                  {REASON_LABELS[outflow.reason] || outflow.reason}
                                </span>
                              </td>

                              {/* Item / Descrição */}
                              <td className="p-3">
                                <div className="text-xs font-medium text-foreground">
                                  {outflow.product_name || outflow.title}
                                </div>
                                {outflow.notes && (
                                  <div className="text-[11px] text-muted-foreground truncate max-w-xs">
                                    {outflow.notes}
                                  </div>
                                )}
                              </td>

                              {/* Destino / Local */}
                              <td className="p-3 text-xs text-muted-foreground">
                                {outflow.destination ? (
                                  <span className="font-medium text-foreground/90">
                                    {outflow.destination}
                                  </span>
                                ) : (
                                  <span className="italic opacity-60">—</span>
                                )}
                                {outflow.storage_location && (
                                  <div className="text-[10px] opacity-70 uppercase tracking-wide">
                                    Local: {outflow.storage_location}
                                  </div>
                                )}
                              </td>

                              {/* Operador */}
                              <td className="p-3 text-xs text-muted-foreground">
                                {outflow.created_by_name || "Operador"}
                              </td>

                              {/* Qtd / Valor */}
                              <td className="p-3 text-right text-xs font-bold whitespace-nowrap">
                                {isProduct ? (
                                  <span className="text-blue-600 dark:text-blue-400">
                                    {fmt(quantity, isKg ? 3 : 0)} {isKg ? "Kg" : "un."}
                                    <span className="block text-[10px] text-muted-foreground">
                                      {productValue.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MT
                                    </span>
                                  </span>
                                ) : (
                                  <span className="text-emerald-600 dark:text-emerald-400">
                                    {parseFloat(String(outflow.amount || 0)).toLocaleString(
                                      "pt-MZ",
                                      {
                                        minimumFractionDigits: 2,
                                      }
                                    )}{" "}
                                    MT
                                  </span>
                                )}
                              </td>

                              {/* Ação */}
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => setCancelConfirmId(outflow.id)}
                                  className="fluent-button text-destructive hover:bg-destructive/10 border-transparent px-2 py-1 text-[11px] opacity-75 group-hover:opacity-100 transition-all"
                                  title="Anular saída e reverter valores/estoque"
                                >
                                  <Dismiss24Regular className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline ml-1">Anular</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>

                      {/* Total Row */}
                      <tfoot>
                        <tr className="border-t-2 border-border bg-secondary/30 text-xs font-bold">
                          <td colSpan={6} className="p-3 text-foreground">
                            TOTAL ({filteredOutflows.length} registos)
                          </td>
                          <td className="p-3 text-right text-foreground">
                            {metrics.productKg > 0 && <div>{fmt(metrics.productKg, 3)} Kg</div>}
                            {metrics.productUnits > 0 && <div>{fmt(metrics.productUnits, 0)} un.</div>}
                            <div className="text-blue-600 dark:text-blue-400">
                              Produtos: {metrics.productValue.toLocaleString("pt-MZ", {
                                minimumFractionDigits: 2,
                              })} MT
                            </div>
                            <div className="text-emerald-600 dark:text-emerald-400">
                              {metrics.cashAmount.toLocaleString("pt-MZ", {
                                minimumFractionDigits: 2,
                              })}{" "}
                              MT
                            </div>
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Dialogs ────────────────────────────────────────────── */}
      <OutflowDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={createMutation.mutateAsync}
        products={products}
      />

      {/* Cancel Confirmation Dialog */}
      {cancelConfirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-xl p-5 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                <Warning24Regular className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Anular esta saída?</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Esta ação reverterá automaticamente o stock de volta ao armazém/balcão ou
                  restaurará o saldo no caixa aberto.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCancelConfirmId(null)}
                className="flex-1 py-2 rounded-lg bg-secondary text-xs font-semibold hover:bg-secondary/80 transition-colors text-foreground"
              >
                Voltar
              </button>
              <button
                onClick={() => cancelMutation.mutate(cancelConfirmId)}
                disabled={cancelMutation.isPending}
                className="flex-1 py-2 rounded-lg bg-destructive text-white text-xs font-semibold hover:bg-destructive/90 transition-colors disabled:opacity-60"
              >
                {cancelMutation.isPending ? "A anular..." : "Sim, Anular Saída"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
