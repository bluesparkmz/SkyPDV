import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { inventoryApi, type InventoryReport, type Product } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type OperationMode = "in" | "out" | "adjustment" | "transfer" | "count";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: OperationMode;
  products: Product[];
  inventoryRows: InventoryReport["products"];
  initialProductId?: number | null;
  initialLocation?: "balcao" | "congelado" | "armazem";
  onSuccess?: () => void;
};

const LOCATION_OPTIONS = [
  { value: "balcao", label: "Balcao" },
  { value: "armazem", label: "Armazem" },
  { value: "congelado", label: "Congelado" },
] as const;

const MODE_META: Record<OperationMode, { title: string; description: string; action: string }> = {
  in: {
    title: "Entrada de estoque",
    description: "Registre reposicao ou chegada de produtos no local selecionado.",
    action: "Registrar entrada",
  },
  out: {
    title: "Saida de estoque",
    description: "Retire itens por perda, consumo interno ou baixa manual.",
    action: "Registrar saida",
  },
  adjustment: {
    title: "Ajuste de estoque",
    description: "Defina o estoque real encontrado na contagem fisica.",
    action: "Aplicar ajuste",
  },
  count: {
    title: "Contagem fisica",
    description: "Registre a quantidade real encontrada e ajuste o sistema para o valor contado.",
    action: "Registrar contagem",
  },
  transfer: {
    title: "Transferencia de estoque",
    description: "Mova produtos entre locais do terminal.",
    action: "Transferir estoque",
  },
};

export function StockOperationDialog({
  open,
  onOpenChange,
  mode,
  products,
  inventoryRows,
  initialProductId,
  initialLocation = "balcao",
  onSuccess,
}: Props) {
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [storageLocation, setStorageLocation] = useState<"balcao" | "congelado" | "armazem">(initialLocation);
  const [fromLocation, setFromLocation] = useState<"balcao" | "congelado" | "armazem">(initialLocation);
  const [toLocation, setToLocation] = useState<"balcao" | "congelado" | "armazem">("armazem");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [reference, setReference] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    const fallbackProductId = initialProductId ? String(initialProductId) : (products[0] ? String(products[0].id) : "");
    setSelectedProductId(fallbackProductId);
    setStorageLocation(initialLocation);
    setFromLocation(initialLocation);
    setToLocation(initialLocation === "balcao" ? "armazem" : "balcao");
    setQuantity("");
    setNotes("");
    setReference("");
  }, [open, products, initialProductId, initialLocation]);

  const selectedProduct = useMemo(
    () => products.find((product) => String(product.id) === selectedProductId) ?? null,
    [products, selectedProductId],
  );

  const locationStock = useMemo(() => {
    if (!selectedProductId) return 0;
    const row = inventoryRows.find(
      (item) => String(item.product_id) === selectedProductId && item.storage_location === storageLocation,
    );
    return row ? parseFloat(row.quantity) : 0;
  }, [inventoryRows, selectedProductId, storageLocation]);

  const fromStock = useMemo(() => {
    if (!selectedProductId) return 0;
    const row = inventoryRows.find(
      (item) => String(item.product_id) === selectedProductId && item.storage_location === fromLocation,
    );
    return row ? parseFloat(row.quantity) : 0;
  }, [inventoryRows, selectedProductId, fromLocation]);

  const toStock = useMemo(() => {
    if (!selectedProductId) return 0;
    const row = inventoryRows.find(
      (item) => String(item.product_id) === selectedProductId && item.storage_location === toLocation,
    );
    return row ? parseFloat(row.quantity) : 0;
  }, [inventoryRows, selectedProductId, toLocation]);

  const quantityNumber = parseFloat(quantity) || 0;
  const isTransfer = mode === "transfer";
  const isAbsoluteCount = mode === "adjustment" || mode === "count";
  const nextStock =
    isAbsoluteCount
      ? quantityNumber
      : mode === "out"
        ? locationStock - quantityNumber
        : locationStock + quantityNumber;

  const handleSubmit = async () => {
    if (!selectedProduct) {
      toast.error("Selecione um produto");
      return;
    }

    if (quantityNumber <= 0) {
      toast.error("Informe uma quantidade valida");
      return;
    }

    if (!selectedProduct.allow_decimal_quantity && !Number.isInteger(quantityNumber)) {
      toast.error("Este produto nao permite quantidade decimal");
      return;
    }

    if (mode === "out" && quantityNumber > locationStock) {
      toast.error("Quantidade maior do que o estoque disponivel");
      return;
    }

    if (isTransfer) {
      if (fromLocation === toLocation) {
        toast.error("Escolha locais diferentes para a transferencia");
        return;
      }
      if (quantityNumber > fromStock) {
        toast.error("Quantidade maior do que o estoque disponivel na origem");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (isTransfer) {
        await inventoryApi.transfer({
          product_id: selectedProduct.id,
          from_location: fromLocation,
          to_location: toLocation,
          quantity: quantityNumber.toString(),
          notes,
        });
      } else {
        await inventoryApi.adjust({
          product_id: selectedProduct.id,
          movement_type: mode === "count" ? "adjustment" : mode,
          quantity: quantityNumber.toString(),
          notes,
          reference: reference || undefined,
          storage_location: storageLocation,
        });
      }

      toast.success(MODE_META[mode].action);
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Nao foi possivel concluir a operacao de estoque");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{MODE_META[mode].title}</DialogTitle>
          <DialogDescription>{MODE_META[mode].description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Produto</Label>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um produto" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={String(product.id)}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isTransfer ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Local de origem</Label>
                <Select value={fromLocation} onValueChange={(value: "balcao" | "congelado" | "armazem") => setFromLocation(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATION_OPTIONS.map((location) => (
                      <SelectItem key={location.value} value={location.value}>
                        {location.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Disponivel: {fromStock.toFixed(3)} un</p>
              </div>

              <div className="grid gap-2">
                <Label>Local de destino</Label>
                <Select value={toLocation} onValueChange={(value: "balcao" | "congelado" | "armazem") => setToLocation(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATION_OPTIONS.map((location) => (
                      <SelectItem key={location.value} value={location.value}>
                        {location.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Atual no destino: {toStock.toFixed(3)} un</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-2">
              <Label>Local</Label>
              <Select value={storageLocation} onValueChange={(value: "balcao" | "congelado" | "armazem") => setStorageLocation(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCATION_OPTIONS.map((location) => (
                    <SelectItem key={location.value} value={location.value}>
                      {location.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Estoque atual neste local: {locationStock.toFixed(3)} un</p>
            </div>
          )}

          <div className="grid gap-2 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>{isAbsoluteCount ? "Estoque real contado" : "Quantidade"}</Label>
              <Input
                value={quantity}
                onChange={(event) => setQuantity(event.target.value.replace(",", "."))}
                inputMode="decimal"
                placeholder="0"
              />
            </div>

            {!isTransfer && (
              <div className="rounded-xl border border-border bg-secondary/30 p-3">
                <p className="text-xs text-muted-foreground">
                  {isAbsoluteCount ? "Estoque atual" : "Resultado previsto"}
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {(isAbsoluteCount ? locationStock : nextStock).toFixed(3)} un
                </p>
                {!isAbsoluteCount && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Depois da operacao o local ficara com {nextStock.toFixed(3)} un
                  </p>
                )}
              </div>
            )}
          </div>

          {!isTransfer && (
            <div className="grid gap-2">
              <Label>Referencia</Label>
              <Input
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder="Ex: compra, contagem, perda"
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label>Observacoes</Label>
            <Input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Opcional"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Processando..." : MODE_META[mode].action}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
