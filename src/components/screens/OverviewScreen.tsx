import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import {
  Print24Regular,
  ArrowImport24Regular,
} from "@fluentui/react-icons";
import { inventoryApi, type FornecimentosReport } from "@/services/api";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

function todayStr() {
  return format(new Date(), "yyyy-MM-dd");
}

function fmtQty(value: string | number | null | undefined) {
  const n = Number(value ?? 0);
  if (Number.isNaN(n)) return String(value ?? "0");
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(3).replace(/\.?0+$/, "");
}

function fmtMoney(value: string | number | null | undefined) {
  const n = Number(value ?? 0);
  if (Number.isNaN(n)) return "0.00";
  return n.toFixed(2);
}

function fmtTime(iso: string) {
  try {
    return format(parseISO(iso), "HH:mm");
  } catch {
    return "";
  }
}

const kindLabel: Record<string, string> = {
  fornecimento: "Entrada",
  cadastro: "Cadastro",
  ambos: "Entrada",
};

export function OverviewScreen() {
  const [date, setDate] = useState(todayStr);
  const [printing, setPrinting] = useState(false);

  const { data, isLoading, isFetching, refetch } = useQuery<FornecimentosReport>({
    queryKey: ["fornecimentos", date],
    queryFn: () => inventoryApi.getFornecimentos(date),
  });

  const summary = useMemo(() => {
    if (!data) return null;
    return [
      { label: "Produtos", value: String(data.products_count) },
      { label: "Quantidade", value: fmtQty(data.total_qty) },
      { label: "Valor do dia", value: `${fmtMoney(data.total_value)} MT` },
    ];
  }, [data]);

  const handlePrint = async () => {
    setPrinting(true);
    try {
      const { blob, filename } = await inventoryApi.downloadFornecimentosPdf(date);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || `fornecimentos-${date}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Extrato gerado");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Falha ao imprimir extrato");
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="z-10 shrink-0 border-b border-border bg-background/80 p-3 backdrop-blur-md md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-lg font-bold text-foreground md:text-2xl">
              <ArrowImport24Regular className="size-5 text-muted-foreground md:size-6" />
              Fornecimentos
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">
              Só o dia seleccionado — valor = quantidade × preço
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value || todayStr())}
              className="h-9 rounded-lg border border-border bg-secondary px-3 text-sm outline-none focus:ring-1 focus:ring-border"
            />
            <button
              type="button"
              onClick={() => setDate(todayStr())}
              className="fluent-button h-9 px-3 text-sm"
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => void refetch()}
              className="fluent-button h-9 px-3 text-sm"
              disabled={isFetching}
            >
              Actualizar
            </button>
            <button
              type="button"
              onClick={() => void handlePrint()}
              disabled={printing || isLoading}
              className="fluent-button h-9 gap-1.5 px-3 text-sm"
            >
              <Print24Regular className="size-4" />
              {printing ? "A gerar…" : "Imprimir"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-auto windows-scrollbar p-3 md:p-6">
        {summary ? (
          <div className="grid grid-cols-3 gap-3">
            {summary.map((item) => (
              <div key={item.label} className="fluent-card p-4">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-lg font-bold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="fluent-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h3 className="text-lg font-semibold">Movimentos do dia</h3>
            <Badge variant="outline" className="font-normal">
              {data?.products_count ?? 0} produto(s) · {data?.date || date}
            </Badge>
          </div>

          {isLoading ? (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              A carregar fornecimentos…
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-4 py-3 text-xs font-semibold">Hora</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold">Tipo</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold">Produto</TableHead>
                    <TableHead className="px-4 py-3 text-right text-xs font-semibold">Qtd</TableHead>
                    <TableHead className="px-4 py-3 text-right text-xs font-semibold">Preço</TableHead>
                    <TableHead className="px-4 py-3 text-right text-xs font-semibold">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.rows || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                        Sem produtos fornecidos ou cadastrados nesta data.
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {data!.rows.map((row) => (
                        <TableRow
                          key={row.product_id}
                          className="border-b border-border transition-colors hover:bg-secondary/30"
                        >
                          <TableCell className="h-12 px-4 py-2 text-sm tabular-nums text-muted-foreground">
                            {fmtTime(row.created_at)}
                          </TableCell>
                          <TableCell className="h-12 px-4 py-2 text-sm">
                            <Badge variant="secondary">{kindLabel[row.kind] || row.kind}</Badge>
                          </TableCell>
                          <TableCell className="h-12 px-4 py-2 text-sm font-medium">
                            {row.product_name}
                          </TableCell>
                          <TableCell className="h-12 px-4 py-2 text-right text-sm tabular-nums">
                            {fmtQty(row.quantity)}
                          </TableCell>
                          <TableCell className="h-12 px-4 py-2 text-right text-sm tabular-nums">
                            {fmtMoney(row.unit_price)}
                          </TableCell>
                          <TableCell className="h-12 px-4 py-2 text-right text-sm font-semibold tabular-nums">
                            {fmtMoney(row.line_total)} MT
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-secondary/30">
                        <TableCell className="h-12 px-4 py-2 text-sm font-semibold" colSpan={3}>
                          Total do dia · {data!.products_count} produto
                          {data!.products_count === 1 ? "" : "s"}
                        </TableCell>
                        <TableCell className="h-12 px-4 py-2 text-right text-sm font-semibold tabular-nums">
                          {fmtQty(data!.total_qty)}
                        </TableCell>
                        <TableCell className="h-12 px-4 py-2" />
                        <TableCell className="h-12 px-4 py-2 text-right text-sm font-semibold tabular-nums">
                          {fmtMoney(data!.total_value)} MT
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
