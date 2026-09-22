import { useEffect, useState } from "react";
import {
  CheckmarkCircle24Regular,
  Dismiss24Regular,
  Money24Regular,
  Payment24Regular,
  Person24Regular,
  Phone24Regular,
  Receipt24Regular,
  Wrench24Regular,
} from "@fluentui/react-icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreatePDVServiceOrder, PDVService } from "@/services/api";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";

interface ServiceOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSubmit: (data: CreatePDVServiceOrder) => Promise<void>;
  services: PDVService[];
  initialServiceId?: number | null;
}

export function ServiceOrderDialog({
  isOpen,
  onClose,
  onSuccess,
  onSubmit,
  services,
  initialServiceId,
}: ServiceOrderDialogProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<number | "">("");
  const [quantity, setQuantity] = useState("1");
  const [discountAmount, setDiscountAmount] = useState("0");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const { data: paymentMethods = [] } = usePaymentMethods();
  const [paymentMethodId, setPaymentMethodId] = useState<string>("");
  const [amountPaid, setAmountPaid] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialServiceId) {
      setSelectedServiceId(initialServiceId);
    } else if (services.length > 0) {
      setSelectedServiceId(services[0].id);
    } else {
      setSelectedServiceId("");
    }
    setQuantity("1");
    setDiscountAmount("0");
    setCustomerName("");
    setCustomerPhone("");
    setPaymentMethodId("");
    setAmountPaid("");
    setNotes("");
    setError(null);
  }, [isOpen, initialServiceId, services]);

  const selectedService = services.find((s) => s.id === Number(selectedServiceId));
  const servicePrice = selectedService ? parseFloat(selectedService.price) || 0 : 0;
  const numQty = parseFloat(quantity) || 0;
  const subtotal = servicePrice * numQty;
  const numDiscount = parseFloat(discountAmount) || 0;
  const total = Math.max(0, subtotal - numDiscount);
  const selectedPaymentMethod = paymentMethods.find((method) => String(method.id) === paymentMethodId);
  const isCash = /^(cash|dinheiro|dinheiro fisico|numerario)$/i.test(selectedPaymentMethod?.name || "");
  const numPaid = parseFloat(amountPaid) || (isCash ? 0 : total);
  const change = Math.max(0, numPaid - total);

  // Auto-fill amount paid when payment method is not cash
  useEffect(() => {
    if (!isCash && total > 0) {
      setAmountPaid(total.toFixed(2));
    }
  }, [isCash, total]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId) {
      setError("Selecione um serviço.");
      return;
    }
    if (numQty <= 0) {
      setError("A quantidade deve ser maior que zero.");
      return;
    }
    if (!paymentMethodId || !selectedPaymentMethod) {
      setError("Selecione um método de pagamento cadastrado pela empresa.");
      return;
    }
    if (isCash && numPaid < total) {
      setError("O valor pago não pode ser inferior ao total.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const combinedNotes = notes.trim()
        ? `${notes.trim()} (Método: ${selectedPaymentMethod?.name || ""})`
        : selectedPaymentMethod
        ? `Método: ${selectedPaymentMethod.name}`
        : undefined;

      await onSubmit({
        service_id: Number(selectedServiceId),
        quantity: numQty,
        discount_amount: numDiscount > 0 ? numDiscount : undefined,
        customer_name: customerName.trim() || undefined,
        customer_phone: customerPhone.trim() || undefined,
        payment_method_id: Number(paymentMethodId),
        amount_paid: numPaid,
        notes: combinedNotes,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Erro ao registar serviço prestado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Receipt24Regular className="w-5 h-5" />
            </div>
            <DialogTitle>Registar Serviço Prestado</DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 text-xs rounded-md bg-destructive/10 text-destructive border border-destructive/20">
              {error}
            </div>
          )}

          {/* Selecionar Serviço */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Wrench24Regular className="w-4 h-4 text-primary" />
              Serviço <span className="text-destructive">*</span>
            </label>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value ? Number(e.target.value) : "")}
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="" disabled>
                -- Selecione o serviço --
              </option>
              {services
                .filter((s) => s.is_active)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {parseFloat(s.price).toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MT
                  </option>
                ))}
            </select>
          </div>

          {/* Quantidade & Desconto */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Quantidade</label>
              <input
                type="number"
                step="1"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Desconto (MT)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Resumo do Valor */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground text-xs">
              <span>Subtotal</span>
              <span>{subtotal.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MT</span>
            </div>
            {numDiscount > 0 && (
              <div className="flex justify-between text-destructive text-xs">
                <span>Desconto</span>
                <span>-{numDiscount.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MT</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-foreground text-base pt-1 border-t border-border">
              <span>Total a Cobrar</span>
              <span className="text-emerald-600 dark:text-emerald-400">
                {total.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MT
              </span>
            </div>
          </div>

          {/* Dados do Cliente (Opcional) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Person24Regular className="w-3.5 h-3.5 text-muted-foreground" />
                Cliente (opcional)
              </label>
              <input
                type="text"
                placeholder="Nome do cliente"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Phone24Regular className="w-3.5 h-3.5 text-muted-foreground" />
                Telefone (opcional)
              </label>
              <input
                type="text"
                placeholder="84/82/87..."
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Método de Pagamento */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Payment24Regular className="w-4 h-4 text-primary" />
              Método de Pagamento <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {paymentMethods.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethodId(String(m.id))}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all text-center ${
                    paymentMethodId === String(m.id)
                      ? "bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary/20"
                      : "bg-card hover:bg-muted text-foreground border-input"
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
            {paymentMethods.length === 0 && (
              <p className="text-xs text-destructive">
                A empresa ainda não cadastrou métodos de pagamento. Cadastre-os em Configurações → Pagamentos.
              </p>
            )}
          </div>

          {/* Valor Pago e Troco (Para dinheiro) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Money24Regular className="w-3.5 h-3.5 text-muted-foreground" />
                Valor Entregue (MT)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder={total.toFixed(2)}
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Troco</label>
              <div className="px-3 py-2 text-sm rounded-md border border-input bg-muted font-bold text-foreground">
                {change.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MT
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Observações (opcional)</label>
            <textarea
              rows={2}
              placeholder="ex: Ranger matricula AB-12-CD, limpeza profunda..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium rounded-md border border-input hover:bg-accent text-foreground flex items-center gap-1.5 transition-colors"
            >
              <Dismiss24Regular className="w-4 h-4" />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || services.length === 0 || paymentMethods.length === 0}
              className="px-4 py-2 text-xs font-medium rounded-md bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <CheckmarkCircle24Regular className="w-4 h-4" />
              {loading ? "A processar..." : "Confirmar e Registar"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
