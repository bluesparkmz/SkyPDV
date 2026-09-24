import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { CashRegister, cashRegisterApi, dashboardApi, salesApi } from "@/services/api";
import { ArrowDownload24Regular } from "@fluentui/react-icons";

interface CashRegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function parseServerUtcDate(value?: string | null) {
  if (!value) return null;
  return /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? new Date(value) : new Date(`${value}Z`);
}

function mozambiqueTodayRange() {
  // Mozambique is UTC+2 year-round. Keep this aligned with Relatórios Diários.
  const date = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return {
    start: new Date(`${date}T00:00:00.000+02:00`).toISOString(),
    end: new Date(`${date}T23:59:59.999+02:00`).toISOString(),
  };
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
  const dailyReportRange = mozambiqueTodayRange();
  const { data: dailySales = [], isLoading: isDailyReportLoading } = useQuery({
    queryKey: ["cashRegisterDailyReport", dailyReportRange.start, dailyReportRange.end],
    queryFn: () => salesApi.list({
      start_date: dailyReportRange.start,
      end_date: dailyReportRange.end,
      status: "completed",
      limit: 1000,
    }),
    enabled: (open && isOpen) || !!closedRegister,
  });
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

  const formatMoney = (value?: string | null) => `${Number(value || 0).toFixed(2)} MZN`;
  const dailyPaymentMethods = dailySales.reduce((methods, sale) => {
    const method = String(sale.notes || "").match(/M[eé]todo\s*:\s*([^\n)]+)/i)?.[1]?.trim()
      || sale.payment_method
      || "Não informado";
    methods[method] = (methods[method] || 0) + Number(sale.total || 0);
    return methods;
  }, {} as Record<string, number>);
  const dailySalesTotal = dailySales.reduce((total, sale) => total + Number(sale.total || 0), 0);
  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isOpen ? "Fechar Caixa" : "Abrir Caixa"}</DialogTitle>
          <DialogDescription>
            {isOpen
              ? "Confira o resumo das vendas por método de pagamento antes de fechar o caixa."
              : "Registre o valor inicial em dinheiro no caixa para iniciar a sessao. Cada caixa dura no maximo 24 horas."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isOpen && currentRegister && (
            <div className="space-y-2 rounded-lg bg-secondary/50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total de Vendas:</span>
                <span className="font-medium">{isDailyReportLoading ? "A carregar..." : formatMoney(String(dailySalesTotal))}</span>
              </div>
              {Object.entries(dailyPaymentMethods).map(([method, amount]) => (
                <div key={method} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{method}:</span>
                  <span className="font-medium">{formatMoney(String(amount))}</span>
                </div>
              ))}
            </div>
          )}

          {!isOpen && <div className="space-y-2">
            <Label htmlFor="amount">Valor de Abertura</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={openingAmount}
              onChange={(e) => setOpeningAmount(e.target.value)}
              placeholder="0.00"
              disabled={openMutation.isPending || closeMutation.isPending}
            />
          </div>}

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
            <div className="flex justify-between"><span className="text-muted-foreground">Total de vendas</span><span className="font-semibold">{isDailyReportLoading ? "A carregar..." : formatMoney(String(dailySalesTotal))}</span></div>
            {Object.entries(dailyPaymentMethods).map(([method, amount]) => (
              <div key={method} className="flex justify-between"><span className="text-muted-foreground">{method}</span><span>{formatMoney(String(amount))}</span></div>
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
