import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateSale } from "@/hooks/useSales";
import { CartItem } from "@/types/product";
import { CreateSale } from "@/services/api";
import { useHardwarePlugin } from "@/hooks/useHardwarePlugin";
import { toast } from "sonner";

interface SaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  subtotal: number;
  onSuccess: () => void;
}

export function SaleDialog({ open, onOpenChange, items, subtotal, onSuccess }: SaleDialogProps) {
  const createSale = useCreateSale();
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "skywallet" | "mpesa" | "mixed">("cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const { isConnected: hardwareConnected, isConnecting: isConnectingHardware, printReceipt, openCashDrawer } = useHardwarePlugin();

  // Os produtos já vêm com IVA incluído no preço
  // Total = soma dos preços (já com IVA)
  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  // Subtotal = valor sem IVA (total / 1.16)
  const calculatedSubtotal = total / 1.16;
  // IVA = diferença entre total e subtotal
  const taxAmount = total - calculatedSubtotal;
  const changeAmount = parseFloat(amountPaid || "0") - total;

  const formatReceipt = (saleData: CreateSale, receiptNumber?: string): string => {
    const date = new Date().toLocaleString('pt-MZ');
    const lines: string[] = [];
    
    lines.push('='.repeat(42));
    lines.push('        SKYPDV - SISTEMA DE VENDAS');
    lines.push('='.repeat(42));
    lines.push(`Data: ${date}`);
    if (receiptNumber) {
      lines.push(`Recibo: #${receiptNumber}`);
    }
    lines.push('-'.repeat(42));
    
    if (customerName) {
      lines.push(`Cliente: ${customerName}`);
    }
    if (customerPhone) {
      lines.push(`Telefone: ${customerPhone}`);
    }
    lines.push('-'.repeat(42));
    lines.push('PRODUTOS:');
    lines.push('-'.repeat(42));
    
    items.forEach(item => {
      const itemTotal = (item.price * item.quantity).toFixed(2);
      lines.push(`${item.name}`);
      lines.push(`  ${item.quantity}x ${item.price.toFixed(2)} MT = ${itemTotal} MT`);
    });
    
    lines.push('-'.repeat(42));
    lines.push(`Subtotal: ${calculatedSubtotal.toFixed(2)} MT`);
    lines.push(`IVA (16%): ${taxAmount.toFixed(2)} MT`);
    lines.push('='.repeat(42));
    lines.push(`TOTAL: ${total.toFixed(2)} MT`);
    lines.push('='.repeat(42));
    lines.push(`Pagamento: ${getPaymentMethodLabel(paymentMethod)}`);
    lines.push(`Valor Pago: ${parseFloat(amountPaid || "0").toFixed(2)} MT`);
    if (changeAmount > 0) {
      lines.push(`Troco: ${changeAmount.toFixed(2)} MT`);
    }
    lines.push('='.repeat(42));
    lines.push('        OBRIGADO PELA PREFERENCIA!');
    lines.push('='.repeat(42));
    lines.push('');
    lines.push('');
    
    return lines.join('\n');
  };

  const getPaymentMethodLabel = (method: string): string => {
    const labels: Record<string, string> = {
      cash: "Dinheiro",
      card: "Cartão",
      skywallet: "SkyWallet",
      mpesa: "M-Pesa",
      mixed: "Misto",
    };
    return labels[method] || method;
  };

  const handleSubmit = async () => {
    if (!amountPaid || parseFloat(amountPaid) < total) {
      return;
    }

    const saleData: CreateSale = {
      items: items.map(item => ({
        product_id: parseInt(item.id),
        quantity: item.quantity.toString(),
        unit_price: item.price.toString(),
      })),
      payment_method: paymentMethod,
      amount_paid: amountPaid,
      customer_name: customerName || undefined,
      customer_phone: customerPhone || undefined,
      notes: notes || undefined,
      sale_type: "local",
    };

    try {
      const sale = await createSale.mutateAsync(saleData);
      
      // Tentar imprimir recibo e abrir gaveta via plugin
      if (hardwareConnected) {
        try {
          // Formatar e imprimir recibo
          const receiptContent = formatReceipt(saleData, sale.receipt_number || sale.id.toString());
          await printReceipt(receiptContent);
          
          // Abrir gaveta se pagamento for em dinheiro
          if (paymentMethod === "cash") {
            await openCashDrawer();
          }
        } catch (error: any) {
          console.error("Erro ao usar hardware:", error);
          // Não bloquear a venda se houver erro no hardware
        }
      }
      
      onSuccess();
      onOpenChange(false);
      // Reset form
      setAmountPaid("");
      setCustomerName("");
      setCustomerPhone("");
      setNotes("");
      setPaymentMethod("cash");
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
                ⚠ Plugin não conectado - Recibo não será impresso automaticamente
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
                <SelectItem value="cash">Dinheiro</SelectItem>
                <SelectItem value="card">Cartão</SelectItem>
                <SelectItem value="skywallet">SkyWallet</SelectItem>
                <SelectItem value="mpesa">M-Pesa</SelectItem>
                <SelectItem value="mixed">Misto</SelectItem>
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

          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="customerName">Nome do Cliente (opcional)</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nome"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Telefone (opcional)</Label>
              <Input
                id="customerPhone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="841234567"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionais..."
              rows={2}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!amountPaid || parseFloat(amountPaid) < total || createSale.isPending}
          >
            {createSale.isPending ? "Processando..." : "Finalizar Venda"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

