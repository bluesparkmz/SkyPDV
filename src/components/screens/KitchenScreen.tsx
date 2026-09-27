import { useEffect, useRef, useState } from "react";
import {
  Food24Regular,
  Add24Regular,
  Delete24Regular,
  Print24Regular,
  Dismiss24Regular,
  Checkmark24Regular,
  Clock24Regular,
  PersonClock24Regular,
  Timer24Regular,
} from "@fluentui/react-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { terminalApi } from "@/services/api";
import { useHardwarePlugin } from "@/hooks/useHardwarePlugin";
import { toast } from "sonner";
import {
  KitchenOrder,
  createKitchenOrder,
  listKitchenOrders,
  updateKitchenOrderStatus,
  deleteKitchenOrder,
  purgeOldKitchenOrders,
} from "@/lib/kitchenDB";

// ─── formato do ticket térmico ─────────────────────────────────────────────
function formatKitchenOrderTicket(order: KitchenOrder, terminalName: string): string {
  const formatMozDate = (iso: string) => {
    const normalized = iso.trim().replace(" ", "T");
    const date = new Date(/(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized) ? normalized : `${normalized}Z`);
    return date.toLocaleString("pt-MZ", { timeZone: "Africa/Maputo" });
  };

  const lines: string[] = [];
  lines.push("=".repeat(42));
  lines.push(`   ${terminalName.toUpperCase()}`);
  lines.push("   ** PEDIDO COZINHA **");
  lines.push("=".repeat(42));
  lines.push(`Data   : ${formatMozDate(order.createdAt)}`);
  lines.push(`Ticket : #${order.ticketNumber}`);
  lines.push(`Mesa/Cliente: ${order.tableOrClient}`);
  lines.push("-".repeat(42));
  lines.push("ITENS:");
  lines.push("-".repeat(42));
  order.items.forEach((item, i) => {
    lines.push(`${i + 1}. ${item}`);
  });
  if (order.notes) {
    lines.push("-".repeat(42));
    lines.push(`OBS: ${order.notes}`);
  }
  lines.push("=".repeat(42));
  lines.push("");
  lines.push("");
  return lines.join("\n");
}

// ─── status helpers ────────────────────────────────────────────────────────
const STATUS_LABEL: Record<KitchenOrder["status"], string> = {
  pending: "Pendente",
  preparing: "Em preparo",
  done: "Pronto",
};

const STATUS_COLOR: Record<KitchenOrder["status"], string> = {
  pending: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  preparing: "bg-blue-500/15 text-blue-700 border-blue-500/30",
  done: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
};

const CARD_BORDER: Record<KitchenOrder["status"], string> = {
  pending: "border-l-amber-500",
  preparing: "border-l-blue-500",
  done: "border-l-emerald-500",
};

// ─── componente ───────────────────────────────────────────────────────────
export function KitchenScreen() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<KitchenOrder["status"] | "all">("all");

  // form state
  const [tableOrClient, setTableOrClient] = useState("");
  const [itemInput, setItemInput] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const itemInputRef = useRef<HTMLInputElement>(null);

  const { data: terminal } = useQuery({ queryKey: ["terminal"], queryFn: terminalApi.get });
  const { printReceipt } = useHardwarePlugin();

  const terminalName = terminal?.name || "COZINHA";

  // carregar pedidos
  const reload = async () => {
    try {
      await purgeOldKitchenOrders();
      const data = await listKitchenOrders();
      // mais recentes primeiro
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(data);
    } catch (e) {
      console.error("Erro ao carregar pedidos:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // refresh automático a cada 15 segundos
    const interval = setInterval(reload, 15_000);
    return () => clearInterval(interval);
  }, []);

  // ── adicionar item à lista do formulário ──────────────────────────────
  const addItem = () => {
    const val = itemInput.trim();
    if (!val) return;
    setItems((prev) => [...prev, val]);
    setItemInput("");
    itemInputRef.current?.focus();
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setTableOrClient("");
    setItemInput("");
    setItems([]);
    setNotes("");
  };

  // ── criar e imprimir pedido ───────────────────────────────────────────
  const handleCreate = async () => {
    if (!tableOrClient.trim()) {
      toast.error("Insira o nome do cliente ou número da mesa.");
      return;
    }
    // aceitar item em digitação mesmo sem pressionar Enter
    const finalItems = itemInput.trim()
      ? [...items, itemInput.trim()]
      : [...items];

    if (finalItems.length === 0) {
      toast.error("Adicione pelo menos um item ao pedido.");
      return;
    }

    setSubmitting(true);
    try {
      const order = await createKitchenOrder({
        tableOrClient: tableOrClient.trim(),
        items: finalItems,
        notes: notes.trim(),
      });

      // imprimir
      const ticket = formatKitchenOrderTicket(order, terminalName);
      const result = await printReceipt(ticket);
      if (result && !result.success) {
        toast.warning(`Pedido criado mas falha na impressão: ${result.error || "sem impressora"}`, { duration: 6000 });
      } else {
        toast.success(`Ticket #${order.ticketNumber} enviado para a cozinha!`);
      }

      await reload();
      setIsNewOpen(false);
      resetForm();
    } catch (e: any) {
      toast.error(`Erro ao criar pedido: ${e?.message || e}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ── re-imprimir pedido existente ──────────────────────────────────────
  const handleReprint = async (order: KitchenOrder) => {
    const ticket = formatKitchenOrderTicket(order, terminalName);
    const result = await printReceipt(ticket);
    if (result && !result.success) {
      toast.error(`Falha na impressão: ${result.error}`, { duration: 6000 });
    } else {
      toast.success("Ticket re-impresso!");
    }
  };

  // ── mudar status ──────────────────────────────────────────────────────
  const handleStatusChange = async (id: string, status: KitchenOrder["status"]) => {
    try {
      await updateKitchenOrderStatus(id, status);
      await reload();
    } catch (e: any) {
      toast.error(`Erro ao actualizar: ${e?.message || e}`);
    }
  };

  // ── apagar pedido ─────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      await deleteKitchenOrder(id);
      await reload();
      toast.success("Pedido removido.");
    } catch (e: any) {
      toast.error(`Erro ao remover: ${e?.message || e}`);
    }
  };

  // ── filtrar ───────────────────────────────────────────────────────────
  const displayed = filterStatus === "all"
    ? orders
    : orders.filter((o) => o.status === filterStatus);

  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    preparing: orders.filter((o) => o.status === "preparing").length,
    done: orders.filter((o) => o.status === "done").length,
  };

  const formatTime = (iso: string) => {
    const normalized = iso.trim().replace(" ", "T");
    const date = new Date(/(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized) ? normalized : `${normalized}Z`);
    return date.toLocaleString("pt-MZ", {
      timeZone: "Africa/Maputo",
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    });
  };

  const getElapsed = (iso: string) => {
    const diff = Date.now() - new Date(iso.endsWith("Z") ? iso : iso + "Z").getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "agora";
    if (mins < 60) return `${mins}min`;
    return `${Math.floor(mins / 60)}h${mins % 60 > 0 ? `${mins % 60}min` : ""}`;
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="p-3 md:p-6 border-b border-border bg-background/80 backdrop-blur-md z-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white">
              <Food24Regular className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-foreground">Cozinha</h1>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
                Pedidos locais — guardados por 24h no browser
              </p>
            </div>
          </div>
          <Button
            id="kitchen-new-order-btn"
            onClick={() => { resetForm(); setIsNewOpen(true); }}
            className="gap-2 px-3 h-9 md:h-10 bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Add24Regular className="w-5 h-5" />
            <span className="hidden sm:inline">Novo Pedido</span>
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="px-3 md:px-6 py-3 flex gap-2 flex-wrap border-b border-border bg-background/60">
        {(["all", "pending", "preparing", "done"] as const).map((s) => {
          const labels: Record<string, string> = {
            all: "Todos",
            pending: "Pendente",
            preparing: "Em preparo",
            done: "Pronto",
          };
          const active = filterStatus === s;
          return (
            <button
              key={s}
              id={`kitchen-filter-${s}`}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                active
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-background border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              {labels[s]}{" "}
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${active ? "bg-white/20" : "bg-secondary"}`}>
                {counts[s]}
              </span>
            </button>
          );
        })}
        <button
          id="kitchen-refresh-btn"
          onClick={reload}
          className="ml-auto px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:bg-secondary transition-colors"
        >
          Actualizar
        </button>
      </div>

      {/* Lista de pedidos */}
      <div className="flex-1 p-3 md:p-6 overflow-auto windows-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            A carregar pedidos...
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Food24Regular className="w-12 h-12 mb-3 text-muted-foreground opacity-40" />
            <p className="font-semibold text-muted-foreground">Sem pedidos</p>
            <p className="text-xs text-muted-foreground mt-1">
              {filterStatus === "all" ? "Crie um novo pedido para a cozinha." : `Nenhum pedido "${STATUS_LABEL[filterStatus as KitchenOrder["status"]]}".`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {displayed.map((order) => (
              <div
                key={order.id}
                className={`fluent-card p-0 overflow-hidden border-l-4 flex flex-col ${CARD_BORDER[order.status]}`}
              >
                {/* card header */}
                <div className="px-3 pt-3 pb-2 flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-orange-600">
                        #{order.ticketNumber}
                      </span>
                      <Badge
                        className={`text-[10px] px-1.5 py-0.5 h-4 rounded-md border font-semibold ${STATUS_COLOR[order.status]}`}
                        variant="outline"
                      >
                        {STATUS_LABEL[order.status]}
                      </Badge>
                    </div>
                    <p className="font-bold text-sm truncate">{order.tableOrClient}</p>
                    <div className="flex items-center gap-1 mt-0.5 text-[10px] text-muted-foreground">
                      <Clock24Regular className="w-3 h-3" />
                      {formatTime(order.createdAt)}
                      <span className="ml-1 font-semibold text-orange-600">
                        {getElapsed(order.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* itens */}
                <div className="px-3 pb-2 flex-1">
                  <div className="bg-muted/40 rounded-lg px-2 py-1.5 space-y-0.5">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs">
                        <span className="text-orange-500 font-bold shrink-0">{i + 1}.</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  {order.notes && (
                    <p className="text-[10px] text-muted-foreground mt-1.5 italic">
                      Obs: {order.notes}
                    </p>
                  )}
                </div>

                {/* acções */}
                <div className="border-t border-border px-2 py-1.5 grid grid-cols-2 gap-1">
                  {/* mudar status */}
                  {order.status === "pending" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] gap-1 text-blue-600 border-blue-300 hover:bg-blue-50"
                      onClick={() => handleStatusChange(order.id, "preparing")}
                    >
                      <Timer24Regular className="w-3 h-3" />
                      Em preparo
                    </Button>
                  )}
                  {order.status === "preparing" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] gap-1 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                      onClick={() => handleStatusChange(order.id, "done")}
                    >
                      <Checkmark24Regular className="w-3 h-3" />
                      Pronto
                    </Button>
                  )}
                  {order.status === "done" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] gap-1 text-muted-foreground"
                      onClick={() => handleStatusChange(order.id, "pending")}
                    >
                      <PersonClock24Regular className="w-3 h-3" />
                      Reabrir
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-[10px] gap-1"
                    onClick={() => handleReprint(order)}
                    title="Re-imprimir ticket"
                  >
                    <Print24Regular className="w-3 h-3" />
                    Reimprimir
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-[10px] gap-1 text-destructive col-span-2"
                    onClick={() => handleDelete(order.id)}
                  >
                    <Delete24Regular className="w-3 h-3" />
                    Remover
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Diálogo: novo pedido ─────────────────────────────────────────── */}
      <Dialog open={isNewOpen} onOpenChange={(open) => { setIsNewOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Food24Regular className="w-5 h-5 text-orange-500" />
              Novo Pedido Cozinha
            </DialogTitle>
            <DialogDescription>
              Preencha o pedido e clique em Enviar. O ticket será impresso automaticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* mesa / cliente */}
            <div className="space-y-1.5">
              <Label htmlFor="kitchen-table">Mesa / Cliente *</Label>
              <Input
                id="kitchen-table"
                value={tableOrClient}
                onChange={(e) => setTableOrClient(e.target.value)}
                placeholder="Ex: Mesa 4, João Silva, Delivery..."
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && itemInputRef.current?.focus()}
              />
            </div>

            {/* itens */}
            <div className="space-y-1.5">
              <Label htmlFor="kitchen-item">Itens do pedido *</Label>
              <div className="flex gap-2">
                <Input
                  id="kitchen-item"
                  ref={itemInputRef}
                  value={itemInput}
                  onChange={(e) => setItemInput(e.target.value)}
                  placeholder="Ex: 2x Frango grelhado com arroz..."
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={addItem}
                  className="shrink-0"
                  title="Adicionar item (Enter)"
                >
                  <Add24Regular className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Pressione Enter ou clique + para adicionar cada item
              </p>

              {/* lista de itens adicionados */}
              {items.length > 0 && (
                <div className="border border-border rounded-lg divide-y divide-border overflow-hidden mt-2">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-muted/20 text-sm">
                      <span>
                        <span className="text-orange-500 font-bold mr-1.5">{i + 1}.</span>
                        {item}
                      </span>
                      <button
                        onClick={() => removeItem(i)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Dismiss24Regular className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* observações */}
            <div className="space-y-1.5">
              <Label htmlFor="kitchen-notes">Observações (opcional)</Label>
              <Input
                id="kitchen-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Sem pimenta, urgente..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsNewOpen(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button
              id="kitchen-submit-btn"
              onClick={handleCreate}
              disabled={submitting}
              className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
            >
              <Print24Regular className="w-4 h-4" />
              {submitting ? "A enviar..." : "Enviar & Imprimir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
