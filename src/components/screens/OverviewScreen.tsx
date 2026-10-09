import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import {
  Print24Regular,
  ArrowImport24Regular,
  Edit24Regular,
  Delete24Regular,
} from "@fluentui/react-icons";
import {
  inventoryApi,
  type FornecimentoRow,
  type FornecimentosReport,
} from "@/services/api";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const queryClient = useQueryClient();
  const [date, setDate] = useState(todayStr);
  const [printing, setPrinting] = useState(false);
  const [editRow, setEditRow] = useState<FornecimentoRow | null>(null);
  const [editQty, setEditQty] = useState("");
  const [deleteRow, setDeleteRow] = useState<FornecimentoRow | null>(null);

  const { data, isLoading, isFetching, refetch } = useQuery<FornecimentosReport>({
    queryKey: ["fornecimentos", date],
    queryFn: () => inventoryApi.getFornecimentos(date),
  });

  const queryKey = ["fornecimentos", date] as const;

  const summarizeRows = (rows: FornecimentoRow[]) => {
    const supply = rows.filter((r) => r.kind === "fornecimento" && Number(r.quantity) > 0);
    const total_qty = supply.reduce((sum, r) => sum + Number(r.quantity || 0), 0);
    const total_value = supply.reduce((sum, r) => sum + Number(r.line_total || 0), 0);
    return {
      products_count: new Set(supply.map((r) => r.product_id)).size,
      total_qty: String(total_qty),
      total_value: total_value.toFixed(2),
    };
  };

  const removeRowFromCache = (movementId: number) => {
    queryClient.setQueryData<FornecimentosReport>(queryKey, (prev) => {
      if (!prev) return prev;
      const rows = prev.rows.filter((r) => r.movement_id !== movementId);
      return { ...prev, rows, ...summarizeRows(rows) };
    });
  };

  const patchRowQtyInCache = (movementId: number, quantity: number, unitPrice: number) => {
    queryClient.setQueryData<FornecimentosReport>(queryKey, (prev) => {
      if (!prev) return prev;
      const rows = prev.rows.map((r) => {
        if (r.movement_id !== movementId) return r;
        const line_total = quantity * unitPrice;
        return {
          ...r,
          quantity: String(quantity),
          line_total: line_total.toFixed(2),
        };
      });
      return { ...prev, rows, ...summarizeRows(rows) };
    });
  };

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey });
    await refetch();
  };

  const updateMutation = useMutation({
    mutationFn: ({ movementId, quantity }: { movementId: number; quantity: number }) =>
      inventoryApi.updateFornecimento(movementId, quantity),
    onSuccess: (_data, vars) => {
      if (vars.quantity <= 0) {
        removeRowFromCache(vars.movementId);
        toast.success("Fornecimento eliminado");
      } else {
        const price = Number(editRow?.unit_price || 0);
        patchRowQtyInCache(vars.movementId, vars.quantity, price);
        toast.success("Quantidade do fornecimento actualizada");
      }
      setEditRow(null);
      void refresh();
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Falha ao editar fornecimento");
      void refresh();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (movementId: number) => inventoryApi.deleteFornecimento(movementId),
    onMutate: async (movementId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<FornecimentosReport>(queryKey);
      removeRowFromCache(movementId);
      return { previous };
    },
    onSuccess: () => {
      toast.success("Fornecimento eliminado — saiu do extrato e dos totais");
      setDeleteRow(null);
      void refresh();
    },
    onError: (err: unknown, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(queryKey, ctx.previous);
      }
      toast.error(err instanceof Error ? err.message : "Falha ao eliminar fornecimento");
    },
  });

  const summary = useMemo(() => {
    if (!data) return null;
    return [
      { label: "Produtos", value: String(data.products_count) },
      { label: "Quantidade", value: fmtQty(data.total_qty) },
      { label: "Valor do dia", value: `${fmtMoney(data.total_value)} MT` },
    ];
  }, [data]);

  const openEdit = (row: FornecimentoRow) => {
    setEditRow(row);
    setEditQty(fmtQty(row.quantity));
  };

  const handleSaveEdit = () => {
    if (!editRow?.movement_id) return;
    const qty = Number(editQty);
    if (!Number.isFinite(qty) || qty < 0) {
      toast.error("Quantidade inválida");
      return;
    }
    // 0 = eliminar por completo (sem rasto nos totais)
    if (qty === 0) {
      updateMutation.mutate({ movementId: editRow.movement_id, quantity: 0 });
      return;
    }
    updateMutation.mutate({ movementId: editRow.movement_id, quantity: qty });
  };

  const handleConfirmDelete = () => {
    if (!deleteRow?.movement_id) return;
    deleteMutation.mutate(deleteRow.movement_id);
  };

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
              Só o dia seleccionado — valor = quantidade × preço. Pode editar ou eliminar entradas.
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
                    <TableHead className="px-4 py-3 text-right text-xs font-semibold">Acções</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.rows || []).filter((r) => Number(r.quantity) > 0).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                        Sem fornecimentos nesta data.
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {data!.rows
                        .filter((r) => Number(r.quantity) > 0)
                        .map((row) => {
                        const rowKey = row.movement_id
                          ? `mov-${row.movement_id}`
                          : `cad-${row.product_id}-${row.created_at}`;
                        const canManage = row.kind === "fornecimento" && row.movement_id != null;
                        return (
                          <TableRow
                            key={rowKey}
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
                            <TableCell className="h-12 px-4 py-2">
                              {canManage ? (
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    title="Editar quantidade"
                                    onClick={() => openEdit(row)}
                                  >
                                    <Edit24Regular className="size-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    title="Eliminar fornecimento"
                                    onClick={() => setDeleteRow(row)}
                                  >
                                    <Delete24Regular className="size-4" />
                                  </Button>
                                </div>
                              ) : (
                                <span className="block text-right text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
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
                        <TableCell className="h-12 px-4 py-2" />
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={!!editRow}
        onOpenChange={(open) => {
          if (!open) setEditRow(null);
        }}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Editar quantidade</DialogTitle>
            <DialogDescription>
              Corrige a quantidade fornecida de{" "}
              <span className="font-medium text-foreground">{editRow?.product_name}</span>. O stock
              será ajustado pela diferença.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-qty">Nova quantidade (0 = eliminar)</Label>
              <Input
                id="edit-qty"
                type="number"
                min={0}
                step="any"
                value={editQty}
                onChange={(e) => setEditQty(e.target.value)}
                className="text-lg font-semibold"
              />
            </div>
            {editRow ? (
              <p className="text-xs text-muted-foreground">
                Actual: {fmtQty(editRow.quantity)} → Nova: {fmtQty(editQty || 0)}
                {Number(editQty) === 0 ? " · será removido do extrato e dos totais" : ""}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditRow(null)}
              disabled={updateMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveEdit}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "A guardar…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteRow}
        onOpenChange={(open) => {
          if (!open) setDeleteRow(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar fornecimento?</AlertDialogTitle>
            <AlertDialogDescription>
              Vai remover a entrada de{" "}
              <span className="font-medium text-foreground">
                {fmtQty(deleteRow?.quantity)} × {deleteRow?.product_name}
              </span>{" "}
              e reverter essa quantidade no stock. Esta acção não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "A eliminar…" : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
