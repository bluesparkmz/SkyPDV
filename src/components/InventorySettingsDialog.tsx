import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inventoryApi, type InventoryReport } from "@/services/api";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: InventoryReport["products"][number] | null;
  onSuccess?: () => void;
};

export function InventorySettingsDialog({ open, onOpenChange, row, onSuccess }: Props) {
  const [minQuantity, setMinQuantity] = useState("");
  const [maxQuantity, setMaxQuantity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !row) return;
    setMinQuantity(row.min_quantity);
    setMaxQuantity(row.max_quantity || "");
  }, [open, row]);

  if (!row) return null;

  const handleSubmit = async () => {
    const minValue = minQuantity === "" ? undefined : minQuantity.replace(",", ".");
    const maxValue = maxQuantity === "" ? undefined : maxQuantity.replace(",", ".");

    if (minValue !== undefined && Number(minValue) < 0) {
      toast.error("O minimo nao pode ser negativo");
      return;
    }

    if (maxValue !== undefined && Number(maxValue) < 0) {
      toast.error("O maximo nao pode ser negativo");
      return;
    }

    if (
      minValue !== undefined &&
      maxValue !== undefined &&
      maxValue !== "" &&
      Number(maxValue) < Number(minValue)
    ) {
      toast.error("O maximo nao pode ser menor que o minimo");
      return;
    }

    setIsSubmitting(true);
    try {
      await inventoryApi.update(
        row.product_id,
        {
          min_quantity: minValue,
          max_quantity: maxValue || undefined,
        },
        row.storage_location,
      );
      toast.success("Niveis de estoque atualizados");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Nao foi possivel atualizar os niveis");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Niveis de estoque</DialogTitle>
          <DialogDescription>
            Configure minimo e maximo para {row.product_name} em {row.storage_location}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Estoque minimo</Label>
            <Input value={minQuantity} onChange={(event) => setMinQuantity(event.target.value)} inputMode="decimal" />
          </div>
          <div className="grid gap-2">
            <Label>Estoque maximo</Label>
            <Input value={maxQuantity} onChange={(event) => setMaxQuantity(event.target.value)} inputMode="decimal" placeholder="Opcional" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar niveis"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
