import { useState, useEffect } from "react";
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
import { Product } from "@/services/api";
import { inventoryApi } from "@/services/api";
import { toast } from "sonner";
import { Add24Regular, Subtract24Regular } from "@fluentui/react-icons";

interface SupplyProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSuccess?: () => void;
}

export function SupplyProductDialog({
  open,
  onOpenChange,
  product,
  onSuccess,
}: SupplyProductDialogProps) {
  const [quantity, setQuantity] = useState("0");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && product) {
      setQuantity("0");
    }
  }, [open, product]);

  if (!product) return null;

  const currentStock = product.inventory ? parseFloat(product.inventory.quantity) : 0;
  const quantityNum = parseFloat(quantity) || 0;
  const newStock = currentStock + quantityNum;

  const handleIncrement = () => {
    const current = parseFloat(quantity) || 0;
    setQuantity((current + 1).toString());
  };

  const handleDecrement = () => {
    const current = parseFloat(quantity) || 0;
    if (current > 0) {
      setQuantity((current - 1).toString());
    }
  };

  const handleInputChange = (value: string) => {
    // Permite apenas números e ponto decimal
    const cleaned = value.replace(/[^0-9.]/g, "");
    if (cleaned === "" || cleaned === ".") {
      setQuantity("0");
      return;
    }
    const num = parseFloat(cleaned);
    if (!isNaN(num) && num >= 0) {
      setQuantity(cleaned);
    }
  };

  const handleSubmit = async () => {
    if (quantityNum <= 0) {
      toast.error("A quantidade deve ser maior que zero");
      return;
    }

    if (!product.track_stock) {
      toast.error("Este produto não possui controle de estoque");
      return;
    }

    setIsLoading(true);
    try {
      await inventoryApi.adjust({
        product_id: product.id,
        quantity: quantityNum.toString(),
        movement_type: "in", // Entrada de estoque
        storage_location: "balcao", // Local padrão
        notes: "Fornecimento manual",
      });

      toast.success(`Estoque atualizado! ${quantityNum} unidade(s) adicionada(s)`);
      setQuantity("0");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar estoque");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Fornecer Produto</DialogTitle>
          <DialogDescription>
            Adicione quantidade ao estoque existente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Product Info */}
          <div className="p-4 bg-secondary/50 rounded-lg">
            <p className="font-semibold text-foreground mb-1">{product.name}</p>
            <p className="text-sm text-muted-foreground">
              Estoque atual: <span className="font-medium text-foreground">{currentStock.toFixed(0)} un</span>
            </p>
          </div>

          {/* Quantity Input */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade a Adicionar</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleDecrement}
                disabled={quantityNum <= 0}
                className="h-10 w-10 shrink-0"
              >
                <Subtract24Regular className="w-5 h-5" />
              </Button>

              <Input
                id="quantity"
                type="text"
                value={quantity}
                onChange={(e) => handleInputChange(e.target.value)}
                className="text-center text-lg font-semibold"
                placeholder="0"
              />

              <Button
                variant="outline"
                size="icon"
                onClick={handleIncrement}
                className="h-10 w-10 shrink-0"
              >
                <Add24Regular className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Preview */}
          {quantityNum > 0 && (
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Estoque atual:</span>
                <span className="font-medium">{currentStock.toFixed(0)} un</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">Quantidade a adicionar:</span>
                <span className="font-medium text-primary">+{quantityNum.toFixed(0)} un</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-primary/20">
                <span className="font-semibold">Novo estoque:</span>
                <span className="font-bold text-primary text-lg">{newStock.toFixed(0)} un</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={quantityNum <= 0 || isLoading}>
            {isLoading ? "Adicionando..." : "Adicionar ao Estoque"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

