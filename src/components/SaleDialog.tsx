import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateSale } from "@/hooks/useSales";
import { CartItem } from "@/types/product";
import { CreateSale, PaymentMethodValue, terminalApi } from "@/services/api";
import { useHardwarePlugin } from "@/hooks/useHardwarePlugin";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { LOCAL_PAYMENT_METHODS, getPaymentMethodLabel, mapToApiPaymentMethod } from "@/lib/paymentMethods";
import { formatSaleReceipt } from "@/lib/receiptFormat";

interface SaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  subtotal: number;
  onSuccess: () => void;
}

export function SaleDialog({ open, onOpenChange, items, subtotal, onSuccess }: SaleDialogProps) {
  const createSale = useCreateSale();
  const { data: terminal } = useQuery({
    queryKey: ["terminal"],
    queryFn: terminalApi.get,
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodValue>("cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [changeStatus, setChangeStatus] = useState<"given" | "not_given">("given");
  const [showShutdownWarning, setShowShutdownWarning] = useState(false);
  const { isConnected: hardwareConnected, isConnecting: isConnectingHardware, printReceipt, openCashDrawer } =
    useHardwarePlugin();

  // Os produtos já vêm com IVA incluído no preço
  // Total = soma dos preços (já com IVA), arredondado a 2 casas decimais para evitar imprecisão de float (ex: 444 * 0.1)
  const total = Math.round(items.reduce((acc, item) => acc + item.price * item.quantity, 0) * 100) / 100;
  // Subtotal = valor sem IVA (total / 1.16)
  const calculatedSubtotal = Math.round((total / 1.16) * 100) / 100;
  // IVA = diferença entre total e subtotal
  const taxAmount = Math.round((total - calculatedSubtotal) * 100) / 100;
  const paidNumber = parseFloat(amountPaid || "0") || 0;
  const changeAmount = Math.max(0, Math.round((paidNumber - total) * 100) / 100);
  const isCash = paymentMethod === "cash";
  const isAmountSufficient = !isNaN(paidNumber) && paidNumber >= total - 0.005;

  useEffect(() => {
    if (open) {
      setPaymentMethod("cash");
      setAmountPaid(total.toFixed(2));
    }
  }, [open, total]);

  useEffect(() => {
    if (changeAmount <= 0 && changeStatus !== "given") {
      setChangeStatus("given");
    }
  }, [changeAmount, changeStatus]);

  const handleSubmit = async () => {
    if (!amountPaid || !isAmountSufficient) {
      return;
    }

    const saleData: CreateSale = {
      items: items.map(item => ({
        product_id: parseInt(item.id),
        quantity: item.quantity.toString(),
        unit_price: item.price.toString(),
      })),
      payment_method: mapToApiPaymentMethod(paymentMethod) as any,
      amount_paid: amountPaid,
      change_status: changeStatus,
      sale_type: "local",
      notes: paymentMethod !== "cash" ? `Método: ${getPaymentMethodLabel(paymentMethod)}` : undefined,
    };

    try {
      const sale = await createSale.mutateAsync(saleData);

      // Recibo via plugin local (WebSocket) — tenta conectar se necessário
      try {
        const receiptContent = formatSaleReceipt(sale, { terminal });
        const printResult = await printReceipt(receiptContent);
        if (printResult && !printResult.success) {
          toast.error(`Falha na impressão: ${printResult.error || "Nenhuma impressora configurada"}`, {
            duration: 6000,
          });
        } else if (printResult?.success) {
          toast.success("Recibo impresso com sucesso!");
        }

        if (paymentMethod === "cash") {
          const drawerResult = await openCashDrawer();
          if (drawerResult && !drawerResult.success) {
            toast.warning(`Aviso da gaveta: ${drawerResult.error || "Falha ao acionar gaveta"}`);
          }
        }
      } catch (error: any) {
        console.error("Erro ao usar hardware:", error);
        toast.error(`Erro ao comunicar com impressora: ${error?.message || error}`, { duration: 6000 });
      }

      onSuccess();
      onOpenChange(false);
      // Reset form
      setAmountPaid("");
      setPaymentMethod("cash");
      setChangeStatus("given");
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Finalizar Venda</span>
            {hardwareConnected ? (
              <span className="text-xs text-emerald-500 flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Hardware Conectado
              </span>
            ) : isConnectingHardware ? (
              <span className="text-xs text-yellow-500 flex items-center gap-1">
                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                Conectando...
              </span>
            ) : (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-2 h-2 bg-muted-foreground rounded-full"></span>
                Hardware Offline
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Confirme os detalhes da venda antes de finalizar
            {!hardwareConnected && !isConnectingHardware && (
              <span className="block mt-1 text-xs text-muted-foreground">
                Sem plugin: ao finalizar tentaremos conectar e imprimir o recibo na impressora configurada.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Summary */}
          <div className="space-y-2 p-4 bg-secondary/50 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">{calculatedSubtotal.toFixed(2)} MT</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">IVA (16%):</span>
              <span className="font-medium">{taxAmount.toFixed(2)} MT</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
              <span>Total:</span>
              <span className="text-primary">{total.toFixed(2)} MT</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="payment">Método de Pagamento</Label>
            <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
              <SelectTrigger id="payment">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCAL_PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount Paid */}
          <div className="space-y-2">
            <Label htmlFor="amount">Valor Pago</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              placeholder="0.00"
            />
            {changeAmount > 0 && (
              <p className="text-sm text-muted-foreground">
                Troco: {changeAmount.toFixed(2)} MT
              </p>
            )}
          </div>


          {isCash && changeAmount > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <div>
                  <Label htmlFor="change_status">Troco nao entregue</Label>
                  <p className="text-xs text-muted-foreground">Ative se nao entregou o troco</p>
                </div>
                <Switch
                  id="change_status"
                  checked={changeStatus === "not_given"}
                  onCheckedChange={(checked) => setChangeStatus(checked ? "not_given" : "given")}
                />
              </div>
              {changeStatus === "given" && (
                <p className="text-xs text-muted-foreground">Troco entregue.</p>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!amountPaid || !isAmountSufficient || createSale.isPending}
          >
            {createSale.isPending ? "Processando..." : "Finalizar Venda"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
