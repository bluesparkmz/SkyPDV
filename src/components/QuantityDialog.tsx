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
  const [quantity, setQuantity] = useState<number>(1);
  const [weightInput, setWeightInput] = useState<string>("1");
  const [amountValue, setAmountValue] = useState<string>("");
  const [mode, setMode] = useState<"weight" | "amount">("weight");

  const isDecimal = Boolean(product?.allow_decimal_quantity);
  const unitPrice = product ? parseFloat(product.price) || 0 : 0;

  /** Format Kg: remove trailing zeros (0.500 → 0.5, 8.000 → 8) */
  const fmtKg = (n: number) => parseFloat(n.toFixed(3)).toString();

  const maxStock = product?.track_stock && product.inventory
    ? parseFloat(product.inventory.quantity)
    : Infinity;

  useEffect(() => {
    if (open && product) {
      const initialQty = 1;
      setQuantity(initialQty);
      setWeightInput(initialQty.toString());
      setAmountValue((initialQty * unitPrice).toFixed(2));
      setMode("weight");
    }
  }, [open, product, isDecimal, unitPrice]);

  if (!product) return null;

  const handleConfirm = () => {
    if (quantity > 0) {
      onConfirm(product, quantity);
      onOpenChange(false);
    }
  };

  const handleWeightChange = (valStr: string) => {
    const normalized = valStr.replace(",", ".");

    if (isDecimal) {
      if (normalized !== "" && !/^\d*\.?\d*$/.test(normalized)) {
        return;
      }
    } else {
      if (normalized !== "" && !/^\d*$/.test(normalized)) {
        return;
      }
    }

    setWeightInput(normalized);

    if (normalized === "" || normalized === ".") {
      setQuantity(0);
      setAmountValue("");
      return;
    }

    const val = parseFloat(normalized);
    if (!isNaN(val) && val >= 0) {
      if (maxStock !== Infinity && val > maxStock) {
        setQuantity(maxStock);
        setAmountValue((maxStock * unitPrice).toFixed(2));
      } else {
        setQuantity(val);
        setAmountValue((val * unitPrice).toFixed(2));
      }
    }
  };

  const handleAmountChange = (amtStr: string) => {
    const normalized = amtStr.replace(",", ".");
    if (normalized !== "" && !/^\d*\.?\d*$/.test(normalized)) {
      return;
    }
    setAmountValue(normalized);

    if (normalized === "" || normalized === ".") {
      setQuantity(0);
      setWeightInput("");
      return;
    }
    const amt = parseFloat(normalized);
    if (!isNaN(amt) && amt >= 0 && unitPrice > 0) {
      const calculatedWeight = parseFloat((amt / unitPrice).toFixed(3));
      const boundedWeight = Math.min(calculatedWeight, maxStock);
      setQuantity(boundedWeight);
      setWeightInput(fmtKg(boundedWeight));
    }
  };

  const handleIncrement = () => {
    const step = isDecimal ? (quantity < 1 ? 0.1 : 1) : 1;
    if (quantity + step <= maxStock) {
      const next = parseFloat((quantity + step).toFixed(3));
      setQuantity(next);
      setWeightInput(fmtKg(next));
      setAmountValue((next * unitPrice).toFixed(2));
    }
  };

  const handleDecrement = () => {
    const step = isDecimal ? (quantity <= 1 ? 0.1 : 1) : 1;
    const minLimit = isDecimal ? 0.05 : 1;
    if (quantity - step >= minLimit - 0.001) {
      const next = parseFloat(Math.max(minLimit, quantity - step).toFixed(3));
      setQuantity(next);
      setWeightInput(fmtKg(next));
      setAmountValue((next * unitPrice).toFixed(2));
    } else if (isDecimal && quantity > minLimit) {
      setQuantity(minLimit);
      setWeightInput(fmtKg(minLimit));
      setAmountValue((minLimit * unitPrice).toFixed(2));
    }
  };

  const handleQuickWeight = (val: number) => {
    const bounded = Math.min(val, maxStock);
    setQuantity(bounded);
    setWeightInput(fmtKg(bounded));
    setAmountValue((bounded * unitPrice).toFixed(2));
  };

  const handleQuickAmount = (val: number) => {
    setMode("amount");
    handleAmountChange(val.toString());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px] p-5">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-center text-base font-bold">Adicionar ao Carrinho</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3">
          {/* Product Header */}
          <div className="text-center">
            <div className="flex justify-center mb-1">
              <ProductImage
                emoji={product.emoji}
                image={product.image}
                alt={product.name}
                size="lg"
                productName={product.name}
                color="bg-primary/10"
                textColor="text-primary"
              />
            </div>
            <p className="font-semibold text-foreground text-sm">{product.name}</p>
            <p className="text-xs text-primary font-bold">
              {unitPrice.toFixed(2)} MT {isDecimal ? "/ Kg" : "cada"}
            </p>
            {product.track_stock && product.inventory && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Estoque: {isDecimal ? `${parseFloat(product.inventory.quantity).toFixed(3)} Kg` : `${parseFloat(product.inventory.quantity).toFixed(0)} un`}
              </p>
            )}
          </div>

          {/* Mode Switcher for decimal/weight products */}
          {isDecimal && (
            <div className="grid grid-cols-2 w-full p-1 bg-secondary/50 rounded-lg border border-border text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMode("weight")}
                className={`py-1.5 rounded-md transition-all ${
                  mode === "weight"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                ⚖️ Por Peso (Kg)
              </button>
              <button
                type="button"
                onClick={() => setMode("amount")}
                className={`py-1.5 rounded-md transition-all ${
                  mode === "amount"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                💵 Por Valor (MT)
              </button>
            </div>
          )}

          {/* Main Controls */}
          {(!isDecimal || mode === "weight") ? (
            <div className="w-full flex flex-col items-center gap-2">
              <div className="flex items-center justify-center gap-2 w-full">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleDecrement}
                  disabled={quantity <= (isDecimal ? 0.05 : 1)}
                  className="h-10 w-10 shrink-0"
                >
                  <Subtract24Regular className="w-5 h-5" />
                </Button>

                <div className="relative flex-1 max-w-[140px]">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={weightInput}
                    onChange={(e) => handleWeightChange(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && quantity > 0) {
                        e.preventDefault();
                        handleConfirm();
                      }
                    }}
                    placeholder={isDecimal ? "0.00" : "1"}
                    autoFocus
                    className="w-full h-11 text-center text-xl font-bold bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary pr-7"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                    {isDecimal ? "Kg" : "un"}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleIncrement}
                  disabled={quantity >= maxStock}
                  className="h-10 w-10 shrink-0"
                >
                  <Add24Regular className="w-5 h-5" />
                </Button>
              </div>

              {/* Quick Weight Buttons for decimal/weight products */}
              {isDecimal && (
                <div className="flex flex-wrap justify-center gap-1.5 w-full mt-1">
                  {[0.25, 0.5, 1, 2, 5].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => handleQuickWeight(w)}
                      className={`text-[11px] font-semibold px-2 py-1 rounded transition-colors border border-border ${
                        quantity === w
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-secondary hover:bg-primary/20 hover:text-primary"
                      }`}
                    >
                      {w} Kg
                    </button>
                  ))}
                </div>
              )}

              {isDecimal && (
                <p className="text-[11px] text-muted-foreground text-center">
                  Digite o peso (ex: 0.5 para meio quilo, 1.25, 8.98)
                </p>
              )}
            </div>
          ) : (
            <div className="w-full flex flex-col items-center gap-2">
              <div className="relative w-full max-w-[200px]">
                <input
                  type="text"
                  inputMode="decimal"
                  value={amountValue}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && quantity > 0) {
                      e.preventDefault();
                      handleConfirm();
                    }
                  }}
                  placeholder="0.00"
                  autoFocus
                  className="w-full h-11 text-center text-xl font-bold bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary pr-9"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                  MT
                </span>
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex flex-wrap justify-center gap-1.5 w-full mt-1">
                {[20, 50, 100, 200, 500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickAmount(amt)}
                    className="text-[11px] font-semibold px-2 py-1 rounded bg-secondary hover:bg-primary/20 hover:text-primary transition-colors border border-border"
                  >
                    {amt} MT
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-muted-foreground mt-0.5">
                Calcula automaticamente o peso equivalente em Kg.
              </p>
            </div>
          )}

          {/* Real-time Summary Card */}
          <div className="w-full p-2.5 rounded-lg border border-border bg-secondary/30 flex items-center justify-between text-xs">
            <div>
              <p className="text-muted-foreground">Peso a entregar:</p>
              <p className="font-bold text-foreground text-sm">
                {isDecimal ? `${fmtKg(quantity)} Kg` : `${quantity} un`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground">Total a pagar:</p>
              <p className="font-extrabold text-primary text-base">
                {(quantity * unitPrice).toFixed(2)} MT
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-3">
          <Button
            variant="outline"
            className="flex-1 text-xs"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 text-xs font-semibold"
            onClick={handleConfirm}
            disabled={quantity <= 0}
          >
            Adicionar {isDecimal && quantity > 0 ? `(${fmtKg(quantity)} Kg)` : ""}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
