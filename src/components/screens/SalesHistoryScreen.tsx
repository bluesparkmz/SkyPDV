import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search24Regular,
  CalendarLtr24Regular,
  Eye24Regular,
  DismissCircle24Regular,
  Print24Regular,
  Document24Regular,
  Receipt24Regular,
  CheckmarkCircle24Regular,
} from "@fluentui/react-icons";
import type { DrawerProps } from "@fluentui/react-components";
import {
  Hamburger,
  NavDrawer,
  NavDrawerBody,
  NavDrawerHeader,
  NavItem,
  NavSectionHeader,
  makeStyles,
  Tooltip,
  useRestoreFocusTarget,
} from "@fluentui/react-components";
import { useSales, useVoidSale } from "@/hooks/useSales";
import { CategorySalesReportItem, dashboardApi, productsApi, Sale } from "@/services/api";
import { useCategories } from "@/hooks/useCategories";
import { useTerminalUsers } from "@/hooks/useTerminalUsers";
import { CustomerName } from "@/components/CustomerName";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";

const useStyles = makeStyles({
  root: {
    overflow: "hidden",
    display: "flex",
    flex: 1,
    minHeight: 0,
  },
  nav: {
    minWidth: "260px",
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
});

type SalesView = "all" | "completed" | "cancelled" | "category";

export function SalesHistoryScreen() {
  const styles = useStyles();
  const isMobile = useIsMobile();
  const drawerType: Required<DrawerProps>["type"] = isMobile ? "overlay" : "inline";
  const [isNavOpen, setIsNavOpen] = useState(false);
  const restoreFocusTargetAttributes = useRestoreFocusTarget();
  const [activeView, setActiveView] = useState<SalesView>("all");

  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isVoidDialogOpen, setIsVoidDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const todayStr = new Date().toISOString().split("T")[0];
  const [filterStart, setFilterStart] = useState<string>(todayStr);
  const [filterEnd, setFilterEnd] = useState<string>(todayStr);
  const [selectedCashierId, setSelectedCashierId] = useState<number | "all">("all");

  useEffect(() => {
    setIsNavOpen(!isMobile);
  }, [isMobile]);

  const { user: authUser } = useAuth();
  const { data: categories = [] } = useCategories();
  const { data: terminalUsers = [] } = useTerminalUsers();
  const cashierNameByUserId = useMemo(() => {
    const map = new Map<number, string>();
    for (const u of terminalUsers) {
      if (typeof u.user_id === "number") {
        map.set(u.user_id, u.user_name || u.user_email || `#${u.user_id}`);
      }
    }
    return map;
  }, [terminalUsers]);

  const formatQuantity = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (Number.isNaN(num)) return String(value);
    return Number.isInteger(num) ? num.toFixed(0) : num.toString();
  };

  const isAdmin = useMemo(() => {
    const uid = authUser?.user?.id;
    if (!uid) return false;
    if (!terminalUsers || terminalUsers.length === 0) return true; // fallback: assume dono
    const entry = terminalUsers.find((u) => u.user_id === uid);
    if (!entry) return true; // se nÃ£o estiver na lista, provavelmente Ã© dono
    return (
      entry.role === "admin" ||
      entry.role === "manager" ||
      entry.can_manage_users === true
    );
  }, [authUser, terminalUsers]);

  const startIso = filterStart ? new Date(`${filterStart}T00:00:00`).toISOString() : undefined;
  const endIso = filterEnd ? new Date(`${filterEnd}T23:59:59.999`).toISOString() : undefined;

  const { data: sales = [], isLoading } = useSales({
    limit: 100,
    status: activeView === "all" || activeView === "category" ? "all" : activeView,
    start_date: startIso,
    end_date: endIso,
    user_id: selectedCashierId === "all" ? undefined : selectedCashierId,
  });
  const { data: categorySalesReport, isLoading: categorySalesLoading } = useQuery({
    queryKey: ["categorySalesReport", selectedCategory, startIso, endIso, selectedCashierId],
    queryFn: () =>
      productsApi.getCategorySalesReport({
        category: selectedCategory,
        start_date: startIso,
        end_date: endIso,
        user_id: selectedCashierId === "all" ? undefined : selectedCashierId,
      }),
    enabled: activeView === "category" && selectedCategory !== "all",
    refetchInterval: 30000,
  });

  const voidSale = useVoidSale();

  const filteredSales = sales.filter((sale) => {
    const matchesSearch =
      !searchQuery ||
      sale.receipt_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.customer_phone?.includes(searchQuery);

    return matchesSearch;
  });

  const filteredCategoryItems = useMemo(() => {
    const items = categorySalesReport?.items || [];
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter((item) => item.product_name.toLowerCase().includes(query));
  }, [categorySalesReport?.items, searchQuery]);

  const formatDecimalValue = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (Number.isNaN(num)) return "0";
    return Number.isInteger(num) ? num.toFixed(0) : num.toFixed(2);
  };

  const categoryTotals = useMemo(() => {
    return filteredCategoryItems.reduce(
      (acc, item) => {
        acc.quantitySold += parseFloat(item.quantity_sold || "0") || 0;
        acc.quantityIn += parseFloat(item.quantity_in || "0") || 0;
        acc.totalAmount += parseFloat(item.total_amount || "0") || 0;
        return acc;
      },
      { quantitySold: 0, quantityIn: 0, totalAmount: 0 }
    );
  }, [filteredCategoryItems]);

  const handleViewDetails = (sale: Sale) => {
    setSelectedSale(sale);
    setIsDetailDialogOpen(true);
  };

  const handleVoidSale = (sale: Sale) => {
    setSelectedSale(sale);
    setIsVoidDialogOpen(true);
  };

  const confirmVoid = () => {
    if (selectedSale) {
      voidSale.mutate(selectedSale.id);
      setIsVoidDialogOpen(false);
      setSelectedSale(null);
    }
  };

  const formatCurrency = (value: string) => {
    return parseFloat(value).toFixed(2) + " MT";
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: "Cash",
      bci_pos: "BCI POS",
      card: "BCI POS",
      emola: "E-Mola",
      skywallet: "E-Mola",
      mpesa: "M-pesa",
      mixed: "Misto",
    };
    return labels[method] || method;
  };

  const getCashierLabel = (sale: Sale) => {
    if (!sale.created_by) return "-";
    return cashierNameByUserId.get(sale.created_by) || `#${sale.created_by}`;
  };

  const handlePrint = async () => {
    try {
      const { blob, filename: apiFilename } = await dashboardApi.downloadSalesSummaryPdf(
        filterStart,
        filterEnd,
        selectedCashierId === "all" ? undefined : selectedCashierId
      );

      const filename =
        apiFilename || `vendas-${filterStart || "inicio"}-${filterEnd || "fim"}.pdf`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível gerar o PDF das vendas.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Carregando vendas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <NavDrawer
        selectedValue={activeView}
        open={isNavOpen}
        type={drawerType}
        className={styles.nav}
        onOpenChange={(_, data) => setIsNavOpen(data.open)}
        onNavItemSelect={(_, data) => {
          setActiveView(data.value as SalesView);
          if (isMobile) setIsNavOpen(false); // Fecha no mobile
        }}
      >
        <NavDrawerHeader>
          <Hamburger onClick={() => setIsNavOpen((v) => !v)} />
        </NavDrawerHeader>
        <NavDrawerBody>
          <NavSectionHeader>Vendas</NavSectionHeader>
          <NavItem value="all" icon={<Receipt24Regular />}>
            Todas
          </NavItem>
          <NavItem value="completed" icon={<CheckmarkCircle24Regular />}>
            Concluídas
          </NavItem>
          <NavItem value="cancelled" icon={<DismissCircle24Regular />}>
            Canceladas
          </NavItem>
          <NavSectionHeader>Analise</NavSectionHeader>
          <NavItem value="category" icon={<Document24Regular />}>
            Por categoria
          </NavItem>
        </NavDrawerBody>
      </NavDrawer>

      <div className={styles.content + " flex flex-col h-full overflow-hidden"}>
        {/* Fixed Header */}
        <div className="p-3 md:p-6 border-b border-border bg-background/80 backdrop-blur-md z-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {(isMobile || !isNavOpen) && (
                <Tooltip content="Abrir menu" relationship="label">
                  <Hamburger
                    onClick={() => setIsNavOpen(true)}
                    {...restoreFocusTargetAttributes}
                    aria-expanded={isNavOpen}
                    className="md:hidden"
                  />
                </Tooltip>
              )}
              <div className="flex items-center gap-2">
                <Receipt24Regular className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                <div>
                  <h1 className="text-lg md:text-2xl font-bold text-foreground">Vendas</h1>
                  <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Histórico de transações</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handlePrint} className="gap-2 px-3 justify-center h-10 print:hidden">
                <Print24Regular className="w-5 h-5" />
                <span className="hidden sm:inline">Imprimir</span>
              </Button>
              {!isNavOpen && !isMobile && (
                <Tooltip content="Abrir menu" relationship="label">
                  <Hamburger
                    onClick={() => setIsNavOpen(true)}
                    {...restoreFocusTargetAttributes}
                    aria-expanded={isNavOpen}
                  />
                </Tooltip>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 p-3 md:p-6 overflow-auto windows-scrollbar">


          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3 mb-4 md:mb-6">
            <div className="relative flex-1">
              <Search24Regular className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                <Input
                  placeholder={activeView === "category" ? "Buscar produto..." : "Buscar recibo, cliente..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 md:pl-10 h-9 md:h-10 text-xs md:text-sm"
                />
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative">
                <CalendarLtr24Regular className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                <Input
                  type="date"
                  value={filterStart}
                  onChange={(e) => setFilterStart(e.target.value)}
                  className="pl-9 md:pl-10 h-9 md:h-10 text-xs md:text-sm min-w-[150px]"
                />
              </div>
              <div className="relative">
                <CalendarLtr24Regular className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                <Input
                  type="date"
                  value={filterEnd}
                  onChange={(e) => setFilterEnd(e.target.value)}
                  className="pl-9 md:pl-10 h-9 md:h-10 text-xs md:text-sm min-w-[150px]"
                />
              </div>
              <Select
                value={selectedCashierId === "all" ? "all" : String(selectedCashierId)}
                onValueChange={(v) => setSelectedCashierId(v === "all" ? "all" : Number(v))}
              >
                <SelectTrigger className="w-[180px] h-9 md:h-10 text-xs md:text-sm">
                  <SelectValue placeholder="Todos os caixas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os caixas</SelectItem>
                  {terminalUsers.map((u) => (
                    <SelectItem key={u.id} value={String(u.user_id)}>
                      {u.user_name || u.user_email || `#${u.user_id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedCategory}
                onValueChange={(value) => {
                  setSelectedCategory(value);
                  if (value !== "all") {
                    setActiveView("category");
                  }
                }}
              >
                <SelectTrigger className="w-[180px] h-9 md:h-10 text-xs md:text-sm">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-1 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => {
                  const today = new Date().toISOString().split("T")[0];
                  setFilterStart(today); setFilterEnd(today);
                }}>Hoje</Button>
                <Button size="sm" variant="outline" onClick={() => {
                  const d=new Date(); d.setDate(d.getDate()-1);
                  const y=d.toISOString().split("T")[0];
                  setFilterStart(y); setFilterEnd(y);
                }}>Ontem</Button>
                <Button size="sm" variant="outline" onClick={() => {
                  const end=new Date(); const start=new Date(); start.setDate(end.getDate()-6);
                  setFilterStart(start.toISOString().split("T")[0]); setFilterEnd(end.toISOString().split("T")[0]);
                }}>Semana</Button>
                <Button size="sm" variant="outline" onClick={() => {
                  const now=new Date();
                  const start=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-01`;
                  const end=now.toISOString().split("T")[0];
                  setFilterStart(start); setFilterEnd(end);
                }}>Mes</Button>
                <Button size="sm" variant="outline" onClick={() => {
                  const now=new Date();
                  setFilterStart(`${now.getFullYear()}-01-01`);
                  setFilterEnd(now.toISOString().split("T")[0]);
                }}>Ano</Button>
              </div>
            </div>
          </div>

          {/* Mobile Sales Cards */}
          <div className="md:hidden space-y-2 mb-4">
            {activeView === "category" ? (
              selectedCategory === "all" ? (
                <div className="fluent-card p-8 text-center text-muted-foreground">
                  Selecione uma categoria para listar os produtos.
                </div>
              ) : categorySalesLoading ? (
                <div className="fluent-card p-8 text-center text-muted-foreground">
                  Carregando produtos da categoria...
                </div>
              ) : filteredCategoryItems.length === 0 ? (
                <div className="fluent-card p-8 text-center text-muted-foreground">
                  Nenhum movimento encontrado para esta categoria no periodo.
                </div>
              ) : (
                <>
                  <div className="fluent-card p-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Vendida</p>
                        <p className="text-sm font-semibold text-foreground">{formatDecimalValue(categoryTotals.quantitySold)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Entrada</p>
                        <p className="text-sm font-semibold text-foreground">{formatDecimalValue(categoryTotals.quantityIn)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Valor</p>
                        <p className="text-sm font-semibold text-primary">{categoryTotals.totalAmount.toFixed(2)} MT</p>
                      </div>
                    </div>
                  </div>
                  {filteredCategoryItems.map((item: CategorySalesReportItem) => (
                    <div key={item.product_id} className="fluent-card p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground truncate">{item.product_name}</p>
                          <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                            <div>
                              <p className="uppercase tracking-wide">Vendida</p>
                              <p className="text-sm font-medium text-foreground">{formatDecimalValue(item.quantity_sold)}</p>
                            </div>
                            <div>
                              <p className="uppercase tracking-wide">Entrada</p>
                              <p className="text-sm font-medium text-foreground">{formatDecimalValue(item.quantity_in)}</p>
                            </div>
                            <div>
                              <p className="uppercase tracking-wide">Valor</p>
                              <p className="text-sm font-semibold text-primary">{formatCurrency(item.total_amount)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )
            ) : filteredSales.length === 0 ? (
              <div className="fluent-card p-8 text-center text-muted-foreground">
                Nenhuma venda encontrada
              </div>
            ) : (
              filteredSales.map((sale) => (
                <div key={sale.id} className="fluent-card p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${sale.status === "completed" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                        }`}>
                        <Receipt24Regular className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {sale.receipt_number || `#${sale.id}`}
                          </p>
                          <span className="text-sm font-bold text-primary shrink-0">
                            {formatCurrency(sale.total)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className="text-xs text-muted-foreground truncate">
                            <CustomerName sale={sale} />
                          </p>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {new Date(sale.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleViewDetails(sale)}
                      >
                        <Eye24Regular className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {activeView === "category" && (
            <div className="hidden md:block fluent-card overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="py-3 px-4 text-xs font-semibold">Produto</TableHead>
                      <TableHead className="py-3 px-4 text-xs font-semibold">Quantidade vendida</TableHead>
                      <TableHead className="py-3 px-4 text-xs font-semibold">Quantidade de entrada</TableHead>
                      <TableHead className="py-3 px-4 text-xs font-semibold text-right">Total do valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCategory === "all" ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm">
                          Selecione uma categoria para listar os produtos.
                        </TableCell>
                      </TableRow>
                    ) : categorySalesLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm">
                          Carregando movimentos da categoria...
                        </TableCell>
                      </TableRow>
                    ) : filteredCategoryItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm">
                          Nenhum movimento encontrado para esta categoria no periodo.
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {filteredCategoryItems.map((item: CategorySalesReportItem) => (
                          <TableRow key={item.product_id} className="hover:bg-secondary/30 transition-colors border-b border-border">
                            <TableCell className="font-medium h-12 py-2 px-4 text-sm">
                              {item.product_name}
                            </TableCell>
                            <TableCell className="h-12 py-2 px-4 text-sm">
                              {formatDecimalValue(item.quantity_sold)}
                            </TableCell>
                            <TableCell className="h-12 py-2 px-4 text-sm">
                              {formatDecimalValue(item.quantity_in)}
                            </TableCell>
                            <TableCell className="font-semibold text-primary h-12 py-2 px-4 text-sm text-right">
                              {formatCurrency(item.total_amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-secondary/30">
                          <TableCell className="font-semibold h-12 py-2 px-4 text-sm">Total</TableCell>
                          <TableCell className="font-semibold h-12 py-2 px-4 text-sm">
                            {formatDecimalValue(categoryTotals.quantitySold)}
                          </TableCell>
                          <TableCell className="font-semibold h-12 py-2 px-4 text-sm">
                            {formatDecimalValue(categoryTotals.quantityIn)}
                          </TableCell>
                          <TableCell className="font-semibold text-primary h-12 py-2 px-4 text-sm text-right">
                            {categoryTotals.totalAmount.toFixed(2)} MT
                          </TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Sales Table - Desktop */}
          {activeView !== "category" && (
          <div className="hidden md:block fluent-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="py-3 px-4 text-xs font-semibold">Recibo</TableHead>
                    <TableHead className="py-3 px-4 text-xs font-semibold">Data/Hora</TableHead>
                    <TableHead className="py-3 px-4 text-xs font-semibold">Caixa</TableHead>
                    <TableHead className="py-3 px-4 text-xs font-semibold">Cliente</TableHead>
                    <TableHead className="py-3 px-4 text-xs font-semibold">Itens</TableHead>
                    <TableHead className="py-3 px-4 text-xs font-semibold">Total</TableHead>
                    <TableHead className="py-3 px-4 text-xs font-semibold">Pagamento</TableHead>
                    <TableHead className="py-3 px-4 text-xs font-semibold">Status</TableHead>
                    <TableHead className="py-3 px-4 text-xs font-semibold text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground text-sm">
                        Nenhuma venda encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSales.map((sale) => (
                      <TableRow key={sale.id} className="hover:bg-secondary/30 transition-colors border-b border-border">
                        <TableCell className="font-medium h-12 py-2 px-4 text-sm">
                          {sale.receipt_number || `#${sale.id}`}
                        </TableCell>
                        <TableCell className="h-12 py-2 px-4 text-sm">{formatDate(sale.created_at)}</TableCell>
                        <TableCell className="h-12 py-2 px-4 text-sm">{getCashierLabel(sale)}</TableCell>
                        <TableCell className="h-12 py-2 px-4 text-sm">
                          <CustomerName sale={sale} />
                        </TableCell>
                        <TableCell className="h-12 py-2 px-4 text-sm">{sale.items.length} itens</TableCell>
                        <TableCell className="font-semibold text-primary h-12 py-2 px-4 text-sm">
                          {formatCurrency(sale.total)}
                        </TableCell>
                        <TableCell className="h-12 py-2 px-4 text-sm">{getPaymentMethodLabel(sale.payment_method)}</TableCell>
                        <TableCell className="h-12 py-2 px-4">
                          <Badge
                            variant={sale.status === "completed" ? "default" : "destructive"}
                            className="text-[10px] px-2 py-0 h-5"
                          >
                            {sale.status === "completed" ? "Concluída" : "Cancelada"}
                          </Badge>
                        </TableCell>
                        <TableCell className="h-12 py-2 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleViewDetails(sale)}
                              title="Ver detalhes"
                            >
                              <Eye24Regular className="w-4 h-4" />
                            </Button>
                            {sale.status === "completed" && isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleVoidSale(sale)}
                                title="Cancelar venda"
                                className="text-destructive hover:text-destructive h-8 w-8"
                              >
                                <DismissCircle24Regular className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          )}


          {/* Sale Details Dialog */}
          <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Detalhes da Venda</DialogTitle>
                <DialogDescription>
                  Recibo: {selectedSale?.receipt_number || `#${selectedSale?.id}`}
                </DialogDescription>
              </DialogHeader>
              {selectedSale && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Data/Hora</p>
                      <p className="font-medium">{formatDate(selectedSale.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Caixa</p>
                      <p className="font-medium">{getCashierLabel(selectedSale)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge
                        variant={selectedSale.status === "completed" ? "default" : "destructive"}
                      >
                        {selectedSale.status === "completed" ? "Concluída" : "Cancelada"}
                      </Badge>
                    </div>
                    {selectedSale.customer_name && (
                      <div>
                        <p className="text-sm text-muted-foreground">Cliente</p>
                        <p className="font-medium">
                          <CustomerName sale={selectedSale} />
                        </p>
                      </div>
                    )}
                    {selectedSale.customer_phone && (
                      <div>
                        <p className="text-sm text-muted-foreground">Telefone</p>
                        <p className="font-medium">{selectedSale.customer_phone}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Método de Pagamento</p>
                      <p className="font-medium">{getPaymentMethodLabel(selectedSale.payment_method)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Valor Pago</p>
                      <p className="font-medium">{formatCurrency(selectedSale.amount_paid)}</p>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <h3 className="font-semibold mb-3">Itens da Venda</h3>
                    <div className="space-y-2">
                      {selectedSale.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 bg-secondary/50 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{item.product_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatQuantity(item.quantity)}x {formatCurrency(item.unit_price)}
                            </p>
                          </div>
                          <p className="font-semibold">{formatCurrency(item.subtotal)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-border pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(selectedSale.subtotal)}</span>
                    </div>
                    {parseFloat(selectedSale.discount_amount) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Desconto:</span>
                        <span className="font-medium text-destructive">
                          -{formatCurrency(selectedSale.discount_amount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">IVA (16%):</span>
                      <span className="font-medium">{formatCurrency(selectedSale.tax_amount)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                      <span>Total:</span>
                      <span className="text-primary">{formatCurrency(selectedSale.total)}</span>
                    </div>
                    {parseFloat(selectedSale.change_amount) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Troco:</span>
                        <span className="font-medium">{formatCurrency(selectedSale.change_amount)}</span>
                      </div>
                    )}
                  </div>

                  {selectedSale.notes && (
                    <div className="border-t border-border pt-4">
                      <p className="text-sm text-muted-foreground">Observações</p>
                      <p className="font-medium">{selectedSale.notes}</p>
                    </div>
                  )}
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                  Fechar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Void Sale Dialog */}
          <Dialog open={isVoidDialogOpen} onOpenChange={setIsVoidDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cancelar Venda</DialogTitle>
                <DialogDescription>
                  Tem certeza que deseja cancelar esta venda? Esta ação não pode ser desfeita.
                </DialogDescription>
              </DialogHeader>
              {selectedSale && (
                <div className="space-y-2 py-4">
                  <p className="text-sm">
                    <span className="font-medium">Recibo:</span>{" "}
                    {selectedSale.receipt_number || `#${selectedSale.id}`}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Total:</span> {formatCurrency(selectedSale.total)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    O estoque será estornado e o valor será deduzido do caixa.
                  </p>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsVoidDialogOpen(false)}>
                  Cancelar
                </Button>
                {isAdmin && (
                  <Button variant="destructive" onClick={confirmVoid} disabled={voidSale.isPending}>
                    {voidSale.isPending ? "Cancelando..." : "Confirmar Cancelamento"}
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
