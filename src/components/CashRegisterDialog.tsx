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
import { useOpenCashRegister, useCloseCashRegister, useCashRegister } from "@/hooks/useCashRegister";
import { CashRegister } from "@/services/api";

interface CashRegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CashRegisterDialog({ open, onOpenChange }: CashRegisterDialogProps) {
  const { data: currentRegister } = useCashRegister();
  const openMutation = useOpenCashRegister();
  const closeMutation = useCloseCashRegister();
  
  const [openingAmount, setOpeningAmount] = useState("0.00");
  const [closingAmount, setClosingAmount] = useState("");
  const [notes, setNotes] = useState("");

  const handleOpen = async () => {
    try {
      await openMutation.mutateAsync({
        opening_amount: openingAmount,
        notes: notes || undefined,
      });
      onOpenChange(false);
      setOpeningAmount("0.00");
      setNotes("");
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleClose = async () => {
    if (!closingAmount) {
      return;
    }
    try {
      await closeMutation.mutateAsync({
        closing_amount: closingAmount,
        notes: notes || undefined,
      });
      onOpenChange(false);
      setClosingAmount("");
      setNotes("");
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isOpen = currentRegister?.status === "open";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isOpen ? "Fechar Caixa" : "Abrir Caixa"}
          </DialogTitle>
          <DialogDescription>
            {isOpen 
              ? "Registre o valor em dinheiro no caixa para fechar a sessão."
              : "Registre o valor inicial em dinheiro no caixa para iniciar a sessão."
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {isOpen && currentRegister && (
            <div className="space-y-2 p-4 bg-secondary/50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Abertura:</span>
                <span className="font-medium">{parseFloat(currentRegister.opening_amount).toFixed(2)} MT</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total de Vendas:</span>
                <span className="font-medium">{parseFloat(currentRegister.total_sales).toFixed(2)} MT</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Esperado:</span>
                <span className="font-medium">
                  {currentRegister.expected_amount 
                    ? `${parseFloat(currentRegister.expected_amount).toFixed(2)} MT`
                    : "Calculando..."
                  }
                </span>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="amount">
              {isOpen ? "Valor de Fechamento" : "Valor de Abertura"}
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={isOpen ? closingAmount : openingAmount}
              onChange={(e) => isOpen ? setClosingAmount(e.target.value) : setOpeningAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionais..."
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={isOpen ? handleClose : handleOpen}
            disabled={isOpen ? !closingAmount : openMutation.isPending || closeMutation.isPending}
          >
            {isOpen ? "Fechar Caixa" : "Abrir Caixa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

