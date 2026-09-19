import { useState, useMemo } from "react";
import {
  ArrowExit24Regular,
  Box24Regular,
  Money24Regular,
  Add24Regular,
  Dismiss24Regular,
  CalendarLtr24Regular,
  Search24Regular,
  Warning24Regular,
  CheckmarkCircle24Regular,
} from "@fluentui/react-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { outflowsApi, productsApi, CreatePDVOutflow, PDVOutflow } from "@/services/api";
import { OutflowDialog } from "@/components/OutflowDialog";
import { toast } from "sonner";

const fmt = (n: string | number | null | undefined, decimals = 2) => {
  const v = parseFloat(String(n ?? 0));
  return isNaN(v) ? "0.00" : v.toFixed(decimals);
};

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-MZ", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const REASON_LABELS: Record<string, string> = {
  consumo_interno: "Consumo interno",
  cafetaria: "Cafetaria",
  cozinha: "Cozinha",
  perda: "Perda / Avaria",
  sangria: "Sangria",
  compra: "Compra",
  pagamento: "Pagamento",
  outro: "Outro",
};

type TabType = "all" | "product" | "cash";

export function OutflowsScreen() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [cancelConfirm, setCancelConfirm] = useState<number | null>(null);

  // Today dates
  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, []);
  const todayEnd = useMemo(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
  }, []);

  const { data: outflows = [], isLoading } = useQuery({
    queryKey: ["outflows"],
    queryFn: () => outflowsApi.list({ limit: 200 }),
  });

  const { data: summary } = useQuery({
    queryKey: ["outflows-summary-today"],
    queryFn: () => outflowsApi.summary(todayStart, todayEnd),
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => productsApi.list({ limit: 500 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreatePDVOutflow) => outflowsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outflows"] });
      queryClient.invalidateQueries({ queryKey: ["outflows-summary-today"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["cashRegister"] });
      toast.success("Saida registada com sucesso!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao registar saida.");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => outflowsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outflows"] });
      queryClient.invalidateQueries({ queryKey: ["outflows-summary-today"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["cashRegister"] });
      setCancelConfirm(null);
      toast.success("Saida cancelada.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao cancelar saida.");
    },
  });

  const filtered = useMemo(() => {
    let list = outflows;
    if (activeTab !== "all") {
      list = list.filter((o) => o.outflow_type === activeTab);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.title?.toLowerCase().includes(q) ||
          o.reason?.toLowerCase().includes(q) ||
          o.destination?.toLowerCase().includes(q) ||
          o.product_name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [outflows, activeTab, search]);

  const tabs: { id: TabType; label: string; icon: React.FC<any>; color: string }[] = [
    { id: "all", label: "Todas", icon: ArrowExit24Regular, color: "text-orange-500" },
    { id: "product", label: "Produtos", icon: Box24Regular, color: "text-blue-500" },
    { id: "cash", label: "Dinheiro", icon: Money24Regular, color: "text-green-500" },
  ];

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/15 flex items-center justify-center">
              <ArrowExit24Regular className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground">Saidas</h1>
              <p className="text-xs text-muted-foreground">Gestao de retiradas e sangrias</p>
            </div>
          </div>
          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-colors"
          >
            <Add24Regular className="w-4 h-4" />
            Nova Saida
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Box24Regular className="w-4 h-4 text-blue-500" />
              <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">Produtos Hoje</span>
            </div>
            <p className="text-lg font-bold text-foreground">{summary?.product_count ?? 0}</p>
            <p className="text-xs text-muted-foreground">{fmt(summary?.product_quantity, 0)} un. retiradas</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Money24Regular className="w-4 h-4 text-green-500" />
              <span className="text-[11px] font-medium text-green-600 dark:text-green-400">Dinheiro Hoje</span>
            </div>
            <p className="text-lg font-bold text-foreground">{fmt(summary?.cash_amount)} MT</p>
            <p className="text-xs text-muted-foreground">{summary?.cash_count ?? 0} sangria(s)</p>
          </div>
        </div>

        {/* Tabs + Search */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-secondary rounded-lg p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeTab === t.id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <t.icon className={`w-3.5 h-3.5 ${activeTab === t.id ? t.color : ""}`} />
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex-1 relative">
            <Search24Regular className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Pesquisar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-lg bg-secondary border border-border text-xs focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 windows-scrollbar">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <span className="inline-block w-6 h-6 border-2 border-orange-400/30 border-t-orange-400 rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-orange-500/10 flex items-center justify-center mb-3">
              <ArrowExit24Regular className="w-7 h-7 text-orange-400" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Nenhuma saida registada</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Clique em "Nova Saida" para comecar</p>
          </div>
        )}

        {filtered.map((outflow) => (
          <OutflowCard
            key={outflow.id}
            outflow={outflow}
            onCancel={(id) => setCancelConfirm(id)}
          />
        ))}
      </div>

      {/* OutflowDialog */}
      <OutflowDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={createMutation.mutateAsync}
        products={products}
      />

      {/* Cancel confirmation */}
      {cancelConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-xl p-5 max-w-sm w-full mx-4 shadow-xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                <Warning24Regular className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Cancelar saida?</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Esta acao ira reverter o stock ou o levantamento de caixa. Nao pode ser desfeita.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCancelConfirm(null)}
                className="flex-1 py-2 rounded-lg bg-secondary text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={() => cancelMutation.mutate(cancelConfirm)}
                disabled={cancelMutation.isPending}
                className="flex-1 py-2 rounded-lg bg-destructive text-white text-sm font-semibold hover:bg-destructive/90 transition-colors disabled:opacity-60"
              >
                {cancelMutation.isPending ? "A cancelar..." : "Cancelar Saida"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OutflowCard({ outflow, onCancel }: { outflow: PDVOutflow; onCancel: (id: number) => void }) {
  const isProduct = outflow.outflow_type === "product";

  return (
    <div className="bg-card border border-border rounded-xl p-3.5 flex items-start gap-3 group hover:border-orange-300/50 transition-colors">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isProduct ? "bg-blue-500/10" : "bg-green-500/10"}`}>
        {isProduct
          ? <Box24Regular className="w-5 h-5 text-blue-500" />
          : <Money24Regular className="w-5 h-5 text-green-500" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{outflow.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              <span className="font-medium text-foreground/80">{REASON_LABELS[outflow.reason] || outflow.reason}</span>
              {outflow.destination ? ` → ${outflow.destination}` : ""}
              {outflow.notes ? ` • ${outflow.notes}` : ""}
            </p>
          </div>
          <div className="text-right shrink-0">
            {isProduct ? (
              <p className="text-sm font-bold text-blue-500">{fmt(outflow.quantity, 0)} un.</p>
            ) : (
              <p className="text-sm font-bold text-green-600">{fmt(outflow.amount)} MT</p>
            )}
          </div>
        </div>

        {outflow.product_name && (
          <div className="mt-1 flex items-center gap-1">
            <Box24Regular className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{outflow.product_name}</span>
          </div>
        )}

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1 text-muted-foreground/70">
            <CalendarLtr24Regular className="w-3 h-3" />
            <span className="text-[10px]">{fmtDate(outflow.created_at)}</span>
          </div>
          <button
            onClick={() => onCancel(outflow.id)}
            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-destructive hover:bg-destructive/10 transition-all"
          >
            <Dismiss24Regular className="w-3 h-3" />
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
