import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownload24Regular,
  ArrowLeftRight24Regular,
  ArrowUpload24Regular,
  CheckmarkCircle24Regular,
  ClipboardTaskListLtr24Regular,
  Edit24Regular,
  ErrorCircle24Regular,
  History24Regular,
  Search24Regular,
  Warning24Regular,
} from "@fluentui/react-icons";
import { ProductImage } from "@/components/ProductImage";
import { StockOperationDialog } from "@/components/StockOperationDialog";
import { inventoryApi, type StockMovement } from "@/services/api";
import { useProducts } from "@/hooks/useProducts";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type OperationMode = "in" | "out" | "adjustment" | "transfer";

type DialogState = {
  open: boolean;
  mode: OperationMode;
  productId: number | null;
  location: "balcao" | "congelado" | "armazem";
};

const LOCATION_LABELS: Record<"balcao" | "congelado" | "armazem", string> = {
  balcao: "Balcao",
  armazem: "Armazem",
  congelado: "Congelado",
};

function getMovementLabel(type: StockMovement["movement_type"]) {
  switch (type) {
    case "in":
      return "Entrada";
    case "out":
      return "Saida";
    case "adjustment":
      return "Ajuste";
    case "sale":
      return "Venda";
    case "return":
      return "Estorno";
    case "transfer":
      return "Transferencia";
    default:
      return type;
  }
}

export function StockScreen() {
  const queryClient = useQueryClient();
  const permissions = usePermissions();
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState<"todos" | "balcao" | "armazem" | "congelado">("todos");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ok" | "baixo" | "critico">("todos");
  const [dialogState, setDialogState] = useState<DialogState>({
    open: false,
    mode: "in",
    productId: null,
    location: "balcao",
  });

  const { data: products = [], isLoading: productsLoading } = useProducts({ limit: 1000 });
  const { data: inventoryReport, isLoading: reportLoading } = useQuery({
    queryKey: ["inventory-report"],
    queryFn: () => inventoryApi.getReport(),
  });
  const { data: recentMovements = [], isLoading: movementsLoading } = useQuery<StockMovement[]>({
    queryKey: ["inventory-movements", 20],
    queryFn: () => inventoryApi.getMovements(0, 20),
  });

  const inventoryRows = inventoryReport?.products ?? [];
  const loading = productsLoading || reportLoading;

  const productMap = useMemo(() => {
    return new Map(products.map((product) => [product.id, product]));
  }, [products]);

  const stockRows = useMemo(() => {
    return inventoryRows
      .map((row) => {
        const product = productMap.get(row.product_id);
        const quantity = parseFloat(row.quantity);
        const minQuantity = parseFloat(row.min_quantity);
        const reserved = parseFloat(row.reserved_quantity);

        let status: "ok" | "baixo" | "critico" = "ok";
        if (quantity <= 0) {
          status = "critico";
        } else if (quantity <= minQuantity) {
          status = "baixo";
        }

        return {
          ...row,
          product,
          quantityNumber: quantity,
          minQuantityNumber: minQuantity,
          reservedNumber: reserved,
          status,
        };
      })
      .filter((row) => row.product?.is_active && row.product?.track_stock);
  }, [inventoryRows, productMap]);

  const filteredRows = useMemo(() => {
    return stockRows.filter((row) => {
      const productName = row.product?.name?.toLowerCase() ?? row.product_name.toLowerCase();
      const matchesSearch =
        productName.includes(searchQuery.toLowerCase()) ||
        (row.product?.sku ?? row.product_sku ?? "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLocation = locationFilter === "todos" || row.storage_location === locationFilter;
      const matchesStatus = statusFilter === "todos" || row.status === statusFilter;
      return matchesSearch && matchesLocation && matchesStatus;
    });
  }, [stockRows, searchQuery, locationFilter, statusFilter]);

  const summary = useMemo(() => {
    const totalUnits = stockRows.reduce((acc, row) => acc + row.quantityNumber, 0);
    const totalRetail = stockRows.reduce((acc, row) => {
      const unitPrice = row.product ? parseFloat(row.product.price) : 0;
      return acc + unitPrice * row.quantityNumber;
    }, 0);
    const totalCost = stockRows.reduce((acc, row) => {
      const unitCost = row.product ? parseFloat(row.product.cost_price) : 0;
      return acc + unitCost * row.quantityNumber;
    }, 0);

    return {
      totalUnits,
      totalRetail,
      totalCost,
      lowStock: stockRows.filter((row) => row.status === "baixo").length,
      criticalStock: stockRows.filter((row) => row.status === "critico").length,
    };
  }, [stockRows]);

  const formattedMovements = useMemo(() => {
    return recentMovements.map((movement) => {
      const product = productMap.get(movement.product_id);
      return {
        ...movement,
        productName: product?.name || `Produto #${movement.product_id}`,
        quantityNumber: Math.abs(parseFloat(movement.quantity)),
      };
    });
  }, [recentMovements, productMap]);

  const openDialog = (
    mode: OperationMode,
    productId: number | null = null,
    location: "balcao" | "congelado" | "armazem" = "balcao",
  ) => {
    setDialogState({ open: true, mode, productId, location });
  };

  const handleDialogSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["inventory-report"] });
    queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="border-b border-border bg-background/80 p-3 backdrop-blur-md md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white md:h-10 md:w-10">
              <ClipboardTaskListLtr24Regular className="h-5 w-5 md:h-6 md:w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground md:text-2xl">Estoque</h1>
              <p className="hidden text-xs text-muted-foreground sm:block md:text-sm">
                Controle operacional de inventario, movimentos e locais.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" onClick={() => openDialog("in")} disabled={!permissions.can_manage_stock}>
              <ArrowDownload24Regular className="h-4 w-4" />
              Entrada
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => openDialog("out")} disabled={!permissions.can_manage_stock}>
              <ArrowUpload24Regular className="h-4 w-4" />
              Saida
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => openDialog("adjustment")} disabled={!permissions.can_manage_stock}>
              <Edit24Regular className="h-4 w-4" />
              Ajuste
            </Button>
            <Button className="gap-2" onClick={() => openDialog("transfer")} disabled={!permissions.can_manage_stock}>
              <ArrowLeftRight24Regular className="h-4 w-4" />
              Transferencia
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 md:p-6 windows-scrollbar">
        {loading ? (
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            <p className="text-sm">Carregando dados de estoque...</p>
          </div>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
              <div className="fluent-card p-4">
                <p className="text-xs text-muted-foreground md:text-sm">Produtos controlados</p>
                <p className="mt-1 text-xl font-bold text-foreground md:text-2xl">{inventoryReport?.total_products || 0}</p>
              </div>
              <div className="fluent-card p-4">
                <p className="text-xs text-muted-foreground md:text-sm">Unidades em estoque</p>
                <p className="mt-1 text-xl font-bold text-foreground md:text-2xl">{summary.totalUnits.toFixed(0)}</p>
              </div>
              <div className="fluent-card p-4">
                <p className="text-xs text-muted-foreground md:text-sm">Estoque baixo</p>
                <p className="mt-1 text-xl font-bold text-warning md:text-2xl">{summary.lowStock}</p>
              </div>
              <div className="fluent-card p-4">
                <p className="text-xs text-muted-foreground md:text-sm">Sem estoque</p>
                <p className="mt-1 text-xl font-bold text-destructive md:text-2xl">{summary.criticalStock}</p>
              </div>
              <div className="fluent-card p-4">
                <p className="text-xs text-muted-foreground md:text-sm">Valor de venda</p>
                <p className="mt-1 text-xl font-bold text-primary md:text-2xl">{summary.totalRetail.toFixed(2)} MT</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.7fr)_360px]">
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px]">
                  <div className="relative">
                    <Search24Regular className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Buscar por produto ou SKU..."
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  <Select value={locationFilter} onValueChange={(value: "todos" | "balcao" | "armazem" | "congelado") => setLocationFilter(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Local" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os locais</SelectItem>
                      <SelectItem value="balcao">Balcao</SelectItem>
                      <SelectItem value="armazem">Armazem</SelectItem>
                      <SelectItem value="congelado">Congelado</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={(value: "todos" | "ok" | "baixo" | "critico") => setStatusFilter(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os estados</SelectItem>
                      <SelectItem value="ok">Normal</SelectItem>
                      <SelectItem value="baixo">Baixo</SelectItem>
                      <SelectItem value="critico">Critico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[920px]">
                      <thead className="bg-secondary/50">
                        <tr>
                          <th className="p-3 text-left text-xs font-semibold text-foreground">Produto</th>
                          <th className="p-3 text-left text-xs font-semibold text-foreground">Local</th>
                          <th className="p-3 text-center text-xs font-semibold text-foreground">Atual</th>
                          <th className="p-3 text-center text-xs font-semibold text-foreground">Minimo</th>
                          <th className="p-3 text-center text-xs font-semibold text-foreground">Reservado</th>
                          <th className="p-3 text-center text-xs font-semibold text-foreground">Estado</th>
                          <th className="p-3 text-right text-xs font-semibold text-foreground">Acoes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRows.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-sm text-muted-foreground">
                              Nenhum item encontrado para os filtros aplicados.
                            </td>
                          </tr>
                        ) : (
                          filteredRows.map((row) => (
                            <tr key={row.id} className="border-t border-border hover:bg-secondary/20">
                              <td className="p-3">
                                <div className="flex items-center gap-3">
                                  <ProductImage
                                    emoji={row.product?.emoji ?? null}
                                    image={row.product?.image ?? null}
                                    alt={row.product?.name ?? row.product_name}
                                    size="sm"
                                    productName={row.product?.name ?? row.product_name}
                                    color="bg-primary/10"
                                    textColor="text-primary"
                                  />
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-foreground">
                                      {row.product?.name ?? row.product_name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {row.product?.sku || row.product_sku || "Sem SKU"}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 text-sm text-foreground">{LOCATION_LABELS[row.storage_location]}</td>
                              <td className="p-3 text-center text-sm font-semibold text-foreground">{row.quantityNumber.toFixed(3)}</td>
                              <td className="p-3 text-center text-sm text-muted-foreground">{row.minQuantityNumber.toFixed(3)}</td>
                              <td className="p-3 text-center text-sm text-muted-foreground">{row.reservedNumber.toFixed(3)}</td>
                              <td className="p-3">
                                <div className="flex items-center justify-center gap-2">
                                  {row.status === "ok" && <CheckmarkCircle24Regular className="h-4 w-4 text-success" />}
                                  {row.status === "baixo" && <Warning24Regular className="h-4 w-4 text-warning" />}
                                  {row.status === "critico" && <ErrorCircle24Regular className="h-4 w-4 text-destructive" />}
                                  <span
                                    className={`text-xs font-medium ${
                                      row.status === "ok"
                                        ? "text-success"
                                        : row.status === "baixo"
                                          ? "text-warning"
                                          : "text-destructive"
                                    }`}
                                  >
                                    {row.status === "ok" ? "Normal" : row.status === "baixo" ? "Baixo" : "Critico"}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openDialog("in", row.product_id, row.storage_location)}
                                    disabled={!permissions.can_manage_stock}
                                  >
                                    Entrada
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openDialog("out", row.product_id, row.storage_location)}
                                    disabled={!permissions.can_manage_stock}
                                  >
                                    Saida
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openDialog("adjustment", row.product_id, row.storage_location)}
                                    disabled={!permissions.can_manage_stock}
                                  >
                                    Ajuste
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => openDialog("transfer", row.product_id, row.storage_location)}
                                    disabled={!permissions.can_manage_stock}
                                  >
                                    Transferir
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <History24Regular className="h-5 w-5 text-primary" />
                  <h3 className="text-base font-semibold text-foreground">Movimentos recentes</h3>
                </div>

                {movementsLoading ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Carregando movimentos...</p>
                ) : formattedMovements.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma movimentacao recente</p>
                ) : (
                  <div className="space-y-3">
                    {formattedMovements.map((movement) => (
                      <div key={movement.id} className="rounded-xl border border-border bg-background/70 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">{movement.productName}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {getMovementLabel(movement.movement_type)}
                              {movement.from_location ? ` • ${LOCATION_LABELS[movement.from_location as "balcao" | "congelado" | "armazem"]}` : ""}
                              {movement.to_location ? ` -> ${LOCATION_LABELS[movement.to_location as "balcao" | "congelado" | "armazem"]}` : ""}
                            </p>
                          </div>
                          <span
                            className={`text-sm font-semibold ${
                              movement.movement_type === "out" || movement.movement_type === "sale"
                                ? "text-destructive"
                                : "text-success"
                            }`}
                          >
                            {movement.movement_type === "out" || movement.movement_type === "sale" ? "-" : "+"}
                            {movement.quantityNumber.toFixed(3)}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span>{new Date(movement.created_at).toLocaleString("pt-MZ")}</span>
                          <span>{movement.notes || movement.reference || "Sem observacoes"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-5 rounded-xl border border-border bg-secondary/30 p-3">
                  <p className="text-xs text-muted-foreground">Valor de custo do estoque</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{summary.totalCost.toFixed(2)} MT</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <StockOperationDialog
        open={dialogState.open}
        onOpenChange={(open) => setDialogState((previous) => ({ ...previous, open }))}
        mode={dialogState.mode}
        products={products.filter((product) => product.track_stock && product.is_active)}
        inventoryRows={inventoryRows}
        initialProductId={dialogState.productId}
        initialLocation={dialogState.location}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}
