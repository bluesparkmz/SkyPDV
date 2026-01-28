import { useState, useEffect } from "react";
import { Add24Regular, Subtract24Regular } from "@fluentui/react-icons";
import { Product } from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { ProductImage } from "./ProductImage";

interface QuantityDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (product: Product, quantity: number) => void;
}

export function QuantityDialog({
  product,
  open,
  onOpenChange,
  onConfirm,
}: QuantityDialogProps) {
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (open) {
      setQuantity(1);
    }
  }, [open]);

  if (!product) return null;

  const handleConfirm = () => {
    if (quantity > 0) {
      onConfirm(product, quantity);
      onOpenChange(false);
    }
  };

  const maxStock = product.track_stock && product.inventory
    ? parseFloat(product.inventory.quantity)
    : Infinity;

  const handleIncrement = () => {
    if (quantity < maxStock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleInputChange = (value: string) => {
    const num = parseInt(value) || 0;
    if (num >= 0 && num <= maxStock) {
      setQuantity(num);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[320px]">
        <DialogHeader>
          <DialogTitle className="text-center">Adicionar ao Carrinho</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {/* Product Info */}
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <ProductImage
                emoji={product.emoji}
                image={product.image}
                alt={product.name}
                size="xl"
                productName={product.name}
                color="bg-primary/10"
                textColor="text-primary"
              />
            </div>
            <p className="font-medium text-foreground mt-2">{product.name}</p>
            <p className="text-sm text-primary font-semibold">
              {parseFloat(product.price).toFixed(2)} MT
            </p>
            {product.track_stock && product.inventory && (
              <p className="text-xs text-muted-foreground mt-1">
                Estoque: {parseFloat(product.inventory.quantity).toFixed(0)} un
              </p>
            )}
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={handleDecrement}
              disabled={quantity <= 1}
              className="h-10 w-10"
            >
              <Subtract24Regular className="w-5 h-5" />
            </Button>

            <input
              type="number"
              value={quantity}
              onChange={(e) => handleInputChange(e.target.value)}
              className="w-20 h-10 text-center text-xl font-bold bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              min={1}
              max={product.track_stock && product.inventory ? parseFloat(product.inventory.quantity) : undefined}
            />

            <Button
              variant="outline"
              size="icon"
              onClick={handleIncrement}
              disabled={product.track_stock && product.inventory ? quantity >= parseFloat(product.inventory.quantity) : false}
              className="h-10 w-10"
            >
              <Add24Regular className="w-5 h-5" />
            </Button>
          </div>

          {/* Total */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-xl font-bold text-primary">
              {(parseFloat(product.price) * quantity).toFixed(2)} MT
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1"
            onClick={handleConfirm}
            disabled={quantity < 1}
          >
            Adicionar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
