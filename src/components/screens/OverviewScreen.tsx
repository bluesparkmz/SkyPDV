import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import {
  Box24Regular,
  Print24Regular,
  ArrowImport24Regular,
  Money24Regular,
  Cube24Regular,
} from "@fluentui/react-icons";
import { inventoryApi, type FornecimentosReport } from "@/services/api";
import { toast } from "sonner";

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
  fornecimento: "Fornecido",
  cadastro: "Cadastrado",
  ambos: "Forn. + Cad.",
};

export function OverviewScreen() {
  const [date, setDate] = useState(todayStr);
  const [printing, setPrinting] = useState(false);

  const { data, isLoading, isFetching, refetch } = useQuery<FornecimentosReport>({
    queryKey: ["fornecimentos", date],
    queryFn: () => inventoryApi.getFornecimentos(date),
  });

  const stats = useMemo(() => {
    if (!data) return [];
    return [
      {
        title: "Total produtos",
        value: String(data.products_count),
        icon: Box24Regular,
      },
      {
        title: "Qtd fornecida",
        value: fmtQty(data.total_qty),
        icon: Cube24Regular,
      },
      {
        title: "Valor (qtd × preço)",
        value: `${fmtMoney(data.total_value)} MT`,
        icon: Money24Regular,
      },
      {
        title: "Saldo total",
        value: `${fmtQty(data.total_balance)} · ${fmtMoney(data.total_balance_value)} MT`,
        icon: ArrowImport24Regular,
      },
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
      <div className="shrink-0 border-b border-border bg-card/80 px-4 py-3 md:px-6 md:py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground md:size-12">
              <ArrowImport24Regular className="size-5 md:size-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground md:text-2xl">Fornecimentos</h1>
              <p className="text-xs text-muted-foreground md:text-sm">
                Produtos fornecidos e cadastrados — valor = quantidade × preço
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value || todayStr())}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
            <button type="button" onClick={() => setDate(todayStr())} className="fluent-button h-9 px-3 text-sm">
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
              className="fluent-button fluent-button-primary h-9 gap-1.5 px-3 text-sm"
            >
              <Print24Regular className="size-4" />
              {printing ? "A gerar…" : "Imprimir extrato"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto windows-scrollbar p-4 md:p-6">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">A carregar fornecimentos…</p>
        ) : (
          <>
            <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {stats.map((s) => (
                <div key={s.title} className="fluent-card p-3 md:p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="mb-0.5 text-[10px] text-muted-foreground md:mb-1 md:text-sm">{s.title}</p>
                      <p className="truncate text-base font-bold text-foreground md:text-xl">{s.value}</p>
                    </div>
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary md:size-12">
                      <s.icon className="size-4 md:size-6" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="fluent-card overflow-hidden">
              <div className="border-b border-border px-4 py-3">
                <h2 className="font-semibold text-foreground">Produtos do dia</h2>
                <p className="text-xs text-muted-foreground">
                  Fornecidos e cadastrados em {data?.date || date}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-muted/40 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 font-medium">Hora</th>
                      <th className="px-4 py-2 font-medium">Tipo</th>
                      <th className="px-4 py-2 font-medium">Produto</th>
                      <th className="px-4 py-2 font-medium text-right">Qtd</th>
                      <th className="px-4 py-2 font-medium text-right">Preço</th>
                      <th className="px-4 py-2 font-medium text-right">Total</th>
                      <th className="px-4 py-2 font-medium text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.rows || []).length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                          Sem produtos fornecidos ou cadastrados nesta data.
                        </td>
                      </tr>
                    ) : (
                      data!.rows.map((row) => (
                        <tr key={row.product_id} className="border-t border-border/70">
                          <td className="px-4 py-2.5 tabular-nums text-muted-foreground">{fmtTime(row.created_at)}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{kindLabel[row.kind] || row.kind}</td>
                          <td className="px-4 py-2.5 font-medium text-foreground">{row.product_name}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-success">{fmtQty(row.quantity)}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{fmtMoney(row.unit_price)}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums font-medium">{fmtMoney(row.line_total)} MT</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{fmtQty(row.balance)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {data && data.rows.length > 0 ? (
                    <tfoot>
                      <tr className="border-t-2 border-border bg-primary/5 font-semibold">
                        <td className="px-4 py-3" colSpan={3}>
                          Total · {data.products_count} produto{data.products_count === 1 ? "" : "s"}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{fmtQty(data.total_qty)}</td>
                        <td className="px-4 py-3" />
                        <td className="px-4 py-3 text-right tabular-nums">{fmtMoney(data.total_value)} MT</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {fmtQty(data.total_balance)}
                          <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                            {fmtMoney(data.total_balance_value)} MT
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  ) : null}
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
