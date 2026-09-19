import { useState, useEffect } from "react";
import {
  ArrowExit24Regular,
  Dismiss24Regular,
  Box24Regular,
  Warning24Regular,
} from "@fluentui/react-icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CartItem } from "@/types/product";
import { outflowsApi } from "@/services/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const PRODUCT_REASONS = [
  { value: "consumo_interno", label: "Consumo Interno / Uso Próprio" },
  { value: "cafetaria", label: "Cafetaria" },
  { value: "cozinha", label: "Cozinha" },
  { value: "perda", label: "Perda / Avaria / Desperdício" },
  { value: "outro", label: "Outro" },
];

interface CartOutflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  onSuccess: () => void;
}

export function CartOutflowDialog({
  open,
  onOpenChange,
  items,
  onSuccess,
}: CartOutflowDialogProps) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState(PRODUCT_REASONS[0].value);
  const [customReason, setCustomReason] = useState("");
  const [destination, setDestination] = useState("");
  const [storageLocation, setStorageLocation] = useState<"balcao" | "congelado" | "armazem">("balcao");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setReason(PRODUCT_REASONS[0].value);
    setCustomReason("");
    setDestination("");
    setStorageLocation("balcao");
    setNotes("");
    setError(null);
    setLoading(false);
  }, [open]);

  // Atualizar destino sugerido conforme o motivo
  const handleReasonChange = (newReason: string) => {
    setReason(newReason);
    if (newReason === "cafetaria") {
      setDestination("Cafetaria");
    } else if (newReason === "cozinha") {
      setDestination("Cozinha");
    } else if (newReason === "consumo_interno") {
      setDestination("Uso Próprio");
    } else if (newReason === "perda") {
      setDestination("Descarte");
    } else {
      setDestination("");
    }
  };

  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError("O carrinho está vazio.");
      return;
    }

    if (reason === "outro" && !customReason.trim()) {
      setError("Por favor, especifique o motivo da saída.");
      return;
    }

    setLoading(true);

    try {
      const finalNotes =
        reason === "outro" && customReason.trim()
          ? notes.trim()
            ? `${customReason.trim()} - ${notes.trim()}`
            : customReason.trim()
          : notes.trim() || undefined;

      // Registar saída para cada produto no carrinho
      await Promise.all(
        items.map((item) => {
          const productId = item.pdv_product_id || parseInt(item.id);
          return outflowsApi.create({
            outflow_type: "product",
            product_id: productId,
            quantity: item.quantity.toString(),
            storage_location: storageLocation,
            reason: reason,
            destination: destination.trim() || undefined,
            notes: finalNotes,
          });
        })
      );

      queryClient.invalidateQueries({ queryKey: ["outflows"] });
      queryClient.invalidateQueries({ queryKey: ["outflows-summary-today"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });

      toast.success(
        items.length === 1
          ? "Saída de produto registada com sucesso!"
          : `${items.length} produtos registados como saída com sucesso!`
      );

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Erro ao registar saída do carrinho:", err);
      setError(err?.message || "Erro ao registar saída de produtos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full p-0 overflow-hidden rounded-xl">
        <DialogHeader className="px-5 pt-5 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center">
                <ArrowExit24Regular className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">Registar como Saída</DialogTitle>
                <p className="text-[11px] text-muted-foreground">
                  Retirar itens do stock sem cobrar venda
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
              type="button"
            >
              <Dismiss24Regular className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-3.5">
          {/* Lista resumida de itens do carrinho */}
          <div className="rounded-lg bg-secondary/50 border border-border p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-foreground">Itens a Retirar</span>
              <span className="text-[11px] font-medium text-orange-600 dark:text-orange-400">
                {items.length} {items.length === 1 ? "produto" : "produtos"} ({totalQuantity.toFixed(items.some(i => i.allow_decimal_quantity) ? 2 : 0)} un.)
              </span>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1 windows-scrollbar text-xs">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Box24Regular className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate text-foreground font-medium">{item.name}</span>
                  </div>
                  <span className="font-semibold text-muted-foreground shrink-0 ml-2">
                    {item.allow_decimal_quantity ? `${item.quantity} un` : `${item.quantity}x`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Motivo */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Motivo da Saída *</label>
            <select
              value={reason}
              onChange={(e) => handleReasonChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              {PRODUCT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {reason === "outro" && (
              <input
                type="text"
                placeholder="Descreva o motivo (ex: cafetaria, amostra, comida funcionário)..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                maxLength={60}
                required
              />
            )}
          </div>

          {/* Destino e Local */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Destino <span className="text-muted-foreground/60">(opcional)</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Cozinha, Cafetaria..."
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                maxLength={80}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Local de Stock</label>
              <select
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value as typeof storageLocation)}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="balcao">Balcão</option>
                <option value="armazem">Armazém</option>
                <option value="congelado">Congelado</option>
              </select>
            </div>
          </div>

          {/* Observações */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Observações <span className="text-muted-foreground/60">(opcional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Retirado para uso matinal..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              <Warning24Regular className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-secondary text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || items.length === 0}
              className="flex-1 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <ArrowExit24Regular className="w-4 h-4" />
              )}
              Confirmar Saída
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
