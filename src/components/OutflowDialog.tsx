import { useEffect, useState } from "react";
import {
  Box24Regular,
  Money24Regular,
  Dismiss24Regular,
  ArrowExit24Regular,
  Warning24Regular,
} from "@fluentui/react-icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreatePDVOutflow, Product, OutflowType } from "@/services/api";

const PRODUCT_REASONS = [
  { value: "consumo_interno", label: "Consumo Interno / Uso Próprio" },
  { value: "cafetaria", label: "Cafetaria" },
  { value: "cozinha", label: "Cozinha" },
  { value: "perda", label: "Perda / Avaria / Desperdício" },
  { value: "outro", label: "Outro" },
];

const CASH_REASONS = [
  { value: "despesa_diaria", label: "Despesa Diária" },
  { value: "outro", label: "Outro" },
];

interface OutflowDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePDVOutflow) => Promise<void>;
  products: Product[];
}

export function OutflowDialog({ isOpen, onClose, onSubmit, products }: OutflowDialogProps) {
  const [outflowType, setOutflowType] = useState<OutflowType>("product");
  const [productId, setProductId] = useState<number | "">("");
  const [quantity, setQuantity] = useState("1");
  const [storageLocation, setStorageLocation] = useState<"balcao" | "congelado" | "armazem">("balcao");
  const [reason, setReason] = useState(PRODUCT_REASONS[0].value);
  const [customReason, setCustomReason] = useState("");
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentReasons = outflowType === "product" ? PRODUCT_REASONS : CASH_REASONS;

  useEffect(() => {
    if (!isOpen) return;
    setOutflowType("product");
    setProductId("");
    setQuantity("1");
    setStorageLocation("balcao");
    setReason(PRODUCT_REASONS[0].value);
    setCustomReason("");
    setDestination("");
    setAmount("");
    setNotes("");
    setError(null);
    setLoading(false);
  }, [isOpen]);

  useEffect(() => {
    setReason(outflowType === "product" ? PRODUCT_REASONS[0].value : CASH_REASONS[0].value);
    setCustomReason("");
  }, [outflowType]);

  const selectedProduct = products.find((p) => p.id === productId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (reason === "outro" && !customReason.trim()) {
      setError("Por favor, descreva o motivo da saída.");
      return;
    }
    if (outflowType === "product") {
      if (!productId) { setError("Selecione um produto."); return; }
      const qty = parseFloat(quantity);
      if (isNaN(qty) || qty <= 0) { setError("Quantidade inválida."); return; }
    } else {
      const amt = parseFloat(amount);
      if (isNaN(amt) || amt <= 0) { setError("Valor inválido."); return; }
    }

    setLoading(true);
    try {
      const finalNotes = reason === "outro" && customReason.trim()
        ? (notes.trim() ? `${customReason.trim()} - ${notes.trim()}` : customReason.trim())
        : (notes.trim() || undefined);

      const payload: CreatePDVOutflow = {
        outflow_type: outflowType,
        reason: reason,
        destination: destination.trim() || undefined,
        notes: finalNotes,
      };
      if (outflowType === "product") {
        payload.product_id = productId as number;
        payload.quantity = quantity;
        payload.storage_location = storageLocation;
      } else {
        payload.amount = amount;
      }
      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Erro ao registar saída.");
    } finally {
      setLoading(false);
    }
  };

  const activeProducts = products.filter((p) => p.is_active);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full p-0 overflow-hidden rounded-xl">
        <DialogHeader className="px-5 pt-5 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center">
                <ArrowExit24Regular className="w-5 h-5 text-orange-500" />
              </div>
              <DialogTitle className="text-base font-semibold">Nova Saida</DialogTitle>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" type="button">
              <Dismiss24Regular className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4">
          {/* Tipo */}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setOutflowType("product")}
              className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${outflowType === "product" ? "border-orange-500 bg-orange-500/10 text-orange-600" : "border-border bg-secondary/40 text-muted-foreground hover:border-orange-300"}`}>
              <Box24Regular className="w-5 h-5 shrink-0" />
              <div className="text-left">
                <p className="text-xs font-semibold">Produto</p>
                <p className="text-[10px] opacity-70">Retirada de stock</p>
              </div>
            </button>
            <button type="button" onClick={() => setOutflowType("cash")}
              className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${outflowType === "cash" ? "border-orange-500 bg-orange-500/10 text-orange-600" : "border-border bg-secondary/40 text-muted-foreground hover:border-orange-300"}`}>
              <Money24Regular className="w-5 h-5 shrink-0" />
              <div className="text-left">
                <p className="text-xs font-semibold">Dinheiro</p>
                <p className="text-[10px] opacity-70">Sangria de caixa</p>
              </div>
            </button>
          </div>

          {outflowType === "product" && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Produto *</label>
                <select value={productId} onChange={(e) => setProductId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" required>
                  <option value="">Selecionar produto...</option>
                  {activeProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}{p.inventory ? ` (stock: ${parseFloat(p.inventory.quantity).toFixed(0)})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Quantidade *</label>
                  <input type="number" min="0.01" step={selectedProduct?.allow_decimal_quantity ? "0.01" : "1"}
                    value={quantity} onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Local</label>
                  <select value={storageLocation} onChange={(e) => setStorageLocation(e.target.value as typeof storageLocation)}
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                    <option value="balcao">Balcao</option>
                    <option value="armazem">Armazem</option>
                    <option value="congelado">Congelado</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {outflowType === "cash" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Valor (MT) *</label>
              <input type="number" min="0.01" step="0.01" placeholder="0.00" value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" required />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Motivo *</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
              {currentReasons.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {reason === "outro" && (
              <input type="text" placeholder="Descreva o motivo (ex: cafetaria, comida funcionário)..." value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" maxLength={60} required />
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Destino <span className="text-muted-foreground/60">(opcional)</span>
            </label>
            <input type="text"
              placeholder={outflowType === "product" ? "Ex: Cafetaria, Cozinha..." : "Ex: Dono, Caixa pequena..."}
              value={destination} onChange={(e) => setDestination(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" maxLength={120} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Notas <span className="text-muted-foreground/60">(opcional)</span>
            </label>
            <textarea rows={2} placeholder="Observacoes adicionais..." value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <Warning24Regular className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-secondary text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {loading
                ? <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <ArrowExit24Regular className="w-4 h-4" />}
              Registar Saida
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
