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
import { Textarea } from "@/components/ui/textarea";
import { useOpenCashRegister, useCloseCashRegister, useCashRegister } from "@/hooks/useCashRegister";
import { CashRegister, cashRegisterApi, dashboardApi } from "@/services/api";
import { ArrowDownload24Regular } from "@fluentui/react-icons";

interface CashRegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function parseServerUtcDate(value?: string | null) {
  if (!value) return null;
  return /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? new Date(value) : new Date(`${value}Z`);
}

export function CashRegisterDialog({ open, onOpenChange }: CashRegisterDialogProps) {
  const { data: currentRegister } = useCashRegister();
  const openMutation = useOpenCashRegister();
  const closeMutation = useCloseCashRegister();

  const [openingAmount, setOpeningAmount] = useState("0.00");
  const [closingAmount, setClosingAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [closedRegister, setClosedRegister] = useState<CashRegister | null>(null);
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);

  const isOpen = currentRegister?.status === "open";
  const expiresAt = currentRegister?.opened_at
    ? new Date((parseServerUtcDate(currentRegister.opened_at)?.getTime() || 0) + 24 * 60 * 60 * 1000)
    : null;
  const expectedClosingAmount = currentRegister?.expected_amount
    ? parseFloat(currentRegister.expected_amount).toFixed(2)
    : currentRegister
      ? (
          parseFloat(currentRegister.opening_amount || "0") +
          parseFloat(currentRegister.total_cash || "0") +
          parseFloat(currentRegister.total_card || "0") +
          parseFloat(currentRegister.total_skywallet || "0") +
          parseFloat(currentRegister.total_mpesa || "0")
        ).toFixed(2)
      : "";

  useEffect(() => {
    if (isOpen) {
      setClosingAmount(expectedClosingAmount);
    } else {
      setClosingAmount("");
    }
  }, [isOpen, expectedClosingAmount]);

  const handleOpen = async () => {
    if (isOpen) return;
    try {
      await openMutation.mutateAsync({
        opening_amount: openingAmount,
        notes: notes || undefined,
      });
      onOpenChange(false);
      setOpeningAmount("0.00");
      setNotes("");
    } catch {
      // Error handled by mutation
    }
  };

  const handleClose = async () => {
    if (!closingAmount) return;
    try {
      const register = await closeMutation.mutateAsync({
        closing_amount: closingAmount,
        notes: notes || undefined,
      });
      onOpenChange(false);
      setClosingAmount("");
      setNotes("");
      setClosedRegister(register);
    } catch {
      // Error handled by mutation
    }
  };

  const handleDownloadReport = async () => {
    if (!closedRegister) return;
    try {
      setIsDownloadingReport(true);
      const closedAt = parseServerUtcDate(closedRegister.closed_at) || new Date();
      const startOfDay = new Date(closedAt);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(closedAt);
      endOfDay.setHours(23, 59, 59, 999);
      const { blob, filename } = await dashboardApi.downloadSalesSummaryPdf(
        startOfDay.toISOString(),
        endOfDay.toISOString()
      );
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename || `relatorio_diario_${startOfDay.toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloadingReport(false);
    }
  };

  const formatMoney = (value?: string | null) => `${Number(value || 0).toFixed(2)} MT`;
  const paymentMethodsUsed = closedRegister
    ? [
        ["Dinheiro", closedRegister.total_cash],
        ["M-Pesa", closedRegister.total_mpesa],
        ["E-Mola / SkyWallet", closedRegister.total_skywallet],
        ["POS / Cartão", closedRegister.total_card],
      ].filter(([, amount]) => Number(amount || 0) > 0)
    : [];

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isOpen ? "Fechar Caixa" : "Abrir Caixa"}</DialogTitle>
          <DialogDescription>
            {isOpen
              ? "O fechamento usa automaticamente o valor vendido/esperado desta sessao."
              : "Registre o valor inicial em dinheiro no caixa para iniciar a sessao. Cada caixa dura no maximo 24 horas."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isOpen && currentRegister && (
            <div className="space-y-2 rounded-lg bg-secondary/50 p-4">
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
                    : "Calculando..."}
                </span>
              </div>
              {expiresAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Expira em:</span>
                  <span className="font-medium">{expiresAt.toLocaleString("pt-MZ")}</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">{isOpen ? "Valor de Fechamento" : "Valor de Abertura"}</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={isOpen ? closingAmount : openingAmount}
              onChange={(e) => (isOpen ? setClosingAmount(e.target.value) : setOpeningAmount(e.target.value))}
              placeholder="0.00"
              disabled={isOpen || openMutation.isPending || closeMutation.isPending}
              readOnly={isOpen}
            />
            {isOpen && (
              <p className="text-xs text-muted-foreground">
                Este valor e calculado automaticamente com base no total vendido no caixa.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observacoes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionais..."
              rows={3}
              disabled={openMutation.isPending || closeMutation.isPending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={isOpen ? handleClose : handleOpen}
            disabled={isOpen ? !closingAmount || closeMutation.isPending : openMutation.isPending || closeMutation.isPending}
          >
            {isOpen ? "Fechar Caixa" : "Abrir Caixa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={!!closedRegister} onOpenChange={(isOpen) => !isOpen && setClosedRegister(null)}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Caixa fechado com sucesso</DialogTitle>
          <DialogDescription>
            Resumo final do caixa #{closedRegister?.id}. Pode baixar o relatório do dia em PDF.
          </DialogDescription>
        </DialogHeader>

        {closedRegister && (
          <div className="space-y-2 rounded-lg bg-secondary/50 p-4 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Vendas realizadas</span><span className="font-medium">{closedRegister.sales_count}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total de vendas</span><span className="font-semibold">{formatMoney(closedRegister.total_sales)}</span></div>
            {paymentMethodsUsed.map(([method, amount]) => (
              <div key={method} className="flex justify-between"><span className="text-muted-foreground">{method}</span><span>{formatMoney(amount)}</span></div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setClosedRegister(null)}>Concluir</Button>
          <Button onClick={handleDownloadReport} disabled={isDownloadingReport} className="gap-2">
            <ArrowDownload24Regular className="h-4 w-4" />
            {isDownloadingReport ? "A baixar..." : "Baixar relatório diário"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
