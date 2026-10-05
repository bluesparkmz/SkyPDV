import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import {
  Box24Regular,
  Print24Regular,
  ArrowImport24Regular,
  CalendarLtr24Regular,
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
        title: "Entradas do dia",
        value: String(data.supplies_count),
        icon: ArrowImport24Regular,
      },
      {
        title: "Produtos fornecidos",
        value: String(data.products_supplied_count),
        icon: Box24Regular,
      },
      {
        title: "Qtd fornecida",
        value: fmtQty(data.total_qty_supplied),
        icon: Cube24Regular,
      },
      {
        title: "Custo estimado",
        value: `${fmtMoney(data.total_cost_value)} MT`,
        icon: CalendarLtr24Regular,
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
                Entradas e produtos cadastrados por data — saldo actual
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
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="mb-0.5 text-[10px] text-muted-foreground md:mb-1 md:text-sm">{s.title}</p>
                      <p className="text-base font-bold text-foreground md:text-2xl">{s.value}</p>
                    </div>
                    <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary md:size-12">
                      <s.icon className="size-4 md:size-6" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="fluent-card mb-5 overflow-hidden">
              <div className="border-b border-border px-4 py-3">
                <h2 className="font-semibold text-foreground">Produtos fornecidos</h2>
                <p className="text-xs text-muted-foreground">
                  Entradas de stock em {data?.date || date}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-muted/40 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 font-medium">Hora</th>
                      <th className="px-4 py-2 font-medium">Produto</th>
                      <th className="px-4 py-2 font-medium">Categoria</th>
                      <th className="px-4 py-2 font-medium text-right">Qtd</th>
                      <th className="px-4 py-2 font-medium text-right">Saldo</th>
                      <th className="px-4 py-2 font-medium">Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.movements || []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                          Sem fornecimentos nesta data.
                        </td>
                      </tr>
                    ) : (
                      data!.movements.map((row) => (
                        <tr key={row.movement_id} className="border-t border-border/70">
                          <td className="px-4 py-2.5 tabular-nums text-muted-foreground">{fmtTime(row.created_at)}</td>
                          <td className="px-4 py-2.5 font-medium text-foreground">{row.product_name}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{row.category || "—"}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-success">+{fmtQty(row.quantity)}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums font-medium">{fmtQty(row.balance)}</td>
                          <td className="max-w-[220px] truncate px-4 py-2.5 text-muted-foreground">{row.notes || "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="fluent-card overflow-hidden">
              <div className="border-b border-border px-4 py-3">
                <h2 className="font-semibold text-foreground">Produtos cadastrados</h2>
                <p className="text-xs text-muted-foreground">
                  Novos produtos registados em {data?.date || date}
                  {data ? ` · ${data.products_created_count}` : ""}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-muted/40 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 font-medium">Hora</th>
                      <th className="px-4 py-2 font-medium">Produto</th>
                      <th className="px-4 py-2 font-medium">Categoria</th>
                      <th className="px-4 py-2 font-medium text-right">Preço</th>
                      <th className="px-4 py-2 font-medium text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.products_created || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                          Nenhum produto cadastrado nesta data.
                        </td>
                      </tr>
                    ) : (
                      data!.products_created.map((row) => (
                        <tr key={row.product_id} className="border-t border-border/70">
                          <td className="px-4 py-2.5 tabular-nums text-muted-foreground">{fmtTime(row.created_at)}</td>
                          <td className="px-4 py-2.5 font-medium text-foreground">{row.product_name}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{row.category || "—"}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{fmtMoney(row.price)} MT</td>
                          <td className="px-4 py-2.5 text-right tabular-nums font-medium">{fmtQty(row.balance)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
