import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format, endOfMonth, endOfWeek, endOfYear, startOfMonth, startOfWeek, startOfYear } from "date-fns";
import type { DrawerProps } from "@fluentui/react-components";
import {
  Hamburger,
  NavDivider,
  NavDrawer,
  NavDrawerBody,
  NavDrawerHeader,
  NavItem,
  NavSectionHeader,
  Tooltip,
  makeStyles,
  tokens,
  useRestoreFocusTarget,
} from "@fluentui/react-components";
import {
  AlertOff24Regular,
  CalligraphyPen20Regular,
  DataTrending24Regular,
  Document24Regular,
  List24Regular,
  Money24Regular,
  Print24Regular,
  ReceiptMoney24Regular,
} from "@fluentui/react-icons";
import { toast } from "sonner";

import { useIsMobile } from "@/hooks/use-mobile";
import { useWhatsappPrefs } from "@/hooks/useWhatsappPrefs";
import {
  useCreateExpense,
  useDeleteExpense,
  useExpenseCategories,
  useExpenses,
  useFinanceSummary,
  useMonthlyFinanceSummaries,
  useTaxSummaries,
  useTaxSummary,
  useUpdateExpense,
  useUpdateTaxSummary,
} from "@/hooks/useFinance";
import { financeApi, type PDVExpense } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
    display: "flex",
  },
  drawerContent: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    height: "100%",
  },
  footer: {
    marginTop: "auto",
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    paddingTop: tokens.spacingVerticalS,
  },
});

type FinanceNav = "resumo" | "despesas" | "imposto";

const monthLabels = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function FinanceScreen() {
  const styles = useStyles();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const drawerType: Required<DrawerProps>["type"] = isMobile ? "overlay" : "inline";
  const restoreFocusTargetAttributes = useRestoreFocusTarget();

  const [isNavOpen, setIsNavOpen] = useState(false);
  const [activeNav, setActiveNav] = useState<FinanceNav>("resumo");
  const resumoRef = useRef<HTMLDivElement>(null);
  const despesasRef = useRef<HTMLDivElement>(null);
  const impostoRef = useRef<HTMLDivElement>(null);

  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [taxMonth, setTaxMonth] = useState(new Date().getMonth() + 1);
  const [taxYear, setTaxYear] = useState(new Date().getFullYear());
  const [taxNotes, setTaxNotes] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PDVExpense | null>(null);
  const [form, setForm] = useState<{ title: string; amount: string; expense_date: string; category_id?: number; description?: string; }>({
    title: "",
    amount: "",
    expense_date: format(new Date(), "yyyy-MM-dd"),
  });

  const { prefs: whatsappPrefs, setPrefs: setWhatsappPrefs, saveToBackend } = useWhatsappPrefs();
  const [showWhatsappDialog, setShowWhatsappDialog] = useState(false);
  const [pendingExport, setPendingExport] = useState<"pdf" | "excel" | null>(null);
  const [tempPhone, setTempPhone] = useState("");

  const taxPeriodDate = new Date(taxYear, taxMonth - 1, 1);
  const taxStartDate = format(startOfMonth(taxPeriodDate), "yyyy-MM-dd");
  const taxEndDate = format(endOfMonth(taxPeriodDate), "yyyy-MM-dd");

  const { data: summary } = useFinanceSummary(startDate, endDate);
  const { data: categories = [] } = useExpenseCategories();
  const { data: expenses = [] } = useExpenses(startDate, endDate, selectedCategory);
  const { data: taxMonthFinanceSummary } = useFinanceSummary(taxStartDate, taxEndDate);
  const { data: taxSummary } = useTaxSummary(taxYear, taxMonth);
  const taxSummaries = useTaxSummaries(taxYear);
  const monthlyFinanceSummaries = useMonthlyFinanceSummaries(taxYear);

  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();
  const updateTaxSummary = useUpdateTaxSummary(taxYear, taxMonth);

  const monthlyTaxRows = monthLabels.map((label, index) => {
    const month = index + 1;
    const taxData = taxSummaries[index]?.data;
    const financeData = monthlyFinanceSummaries[index]?.data;
    const totalTax = Number(taxData?.total_tax_due || 0);
    const totalSales = Number(financeData?.gross_revenue || 0);

    return { month, label, taxSummary: taxData, financeSummary: financeData, taxPercentage: totalSales > 0 ? (totalTax / totalSales) * 100 : 0 };
  });

  useEffect(() => {
    setIsNavOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    setTaxNotes(taxSummary?.notes || "");
  }, [taxSummary?.notes]);

  const scrollToSection = (section: FinanceNav) => {
    const target = section === "resumo" ? resumoRef.current : section === "despesas" ? despesasRef.current : impostoRef.current;
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const formatCurrency = (value?: string | number | null) => {
    const amount = typeof value === "string" ? parseFloat(value) : value || 0;
    return `${new Intl.NumberFormat("pt-MZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)} MT`;
  };

  const applyQuickRange = (range: "day" | "week" | "month" | "year") => {
    const now = new Date();
    if (range === "day") {
      const d = format(now, "yyyy-MM-dd");
      setStartDate(d);
      setEndDate(d);
      return;
    }
    if (range === "week") {
      setStartDate(format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"));
      setEndDate(format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"));
      return;
    }
    if (range === "month") {
      setStartDate(format(startOfMonth(now), "yyyy-MM-dd"));
      setEndDate(format(endOfMonth(now), "yyyy-MM-dd"));
      return;
    }
    setStartDate(format(startOfYear(now), "yyyy-MM-dd"));
    setEndDate(format(endOfYear(now), "yyyy-MM-dd"));
  };

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", amount: "", expense_date: format(new Date(), "yyyy-MM-dd") });
    setIsDialogOpen(true);
  };

  const openEdit = (expense: PDVExpense) => {
    setEditing(expense);
    setForm({
      title: expense.title,
      amount: expense.amount,
      expense_date: expense.expense_date.substring(0, 10),
      category_id: expense.category_id || undefined,
      description: expense.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!form.title || !form.amount || !form.expense_date) {
        toast.error("Preencha titulo, valor e data");
        return;
      }
      const payload = {
        title: form.title,
        amount: form.amount,
        expense_date: new Date(form.expense_date).toISOString(),
        category_id: form.category_id,
        description: form.description,
      };
      if (editing) {
        await updateExpense.mutateAsync({ id: editing.id, data: payload });
        toast.success("Despesa atualizada");
      } else {
        await createExpense.mutateAsync(payload);
        toast.success("Despesa cadastrada");
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error?.message || "Erro ao salvar");
    }
  };

  const handleDelete = async (expense: PDVExpense) => {
    try {
      await deleteExpense.mutateAsync(expense.id);
      toast.success("Despesa removida");
    } catch (error: any) {
      toast.error(error?.message || "Erro ao remover");
    }
  };

  const handleExport = async (type: "pdf" | "excel") => {
    try {
      if (!whatsappPrefs.phone) {
        setPendingExport(type);
        setShowWhatsappDialog(true);
        return;
      }
      const phoneParam = whatsappPrefs.enabled ? whatsappPrefs.phone : undefined;
      const { blob, filename } = type === "pdf"
        ? await financeApi.downloadSummaryPdf(startDate, endDate, undefined, phoneParam)
        : await financeApi.downloadSummaryExcel(startDate, endDate, undefined, phoneParam);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename || `finance-${type}-${startDate || "inicio"}-${endDate || "fim"}.${type === "pdf" ? "pdf" : "xlsx"}`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error(error?.message || `Falha ao gerar ${type === "pdf" ? "PDF" : "Excel"}`);
    }
  };

  const handleTaxStatusChange = async (month: number, isPaid: boolean) => {
    try {
      await financeApi.updateTaxSummary(taxYear, month, { is_paid: isPaid, notes: month === taxMonth ? taxNotes || undefined : undefined });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["taxSummary", taxYear, month] }),
        queryClient.invalidateQueries({ queryKey: ["taxSummary", taxYear, taxMonth] }),
      ]);
      toast.success(isPaid ? "Imposto marcado como pago" : "Imposto marcado como nao pago");
    } catch (error: any) {
      toast.error(error?.message || "Erro ao atualizar estado do imposto");
    }
  };

  const sidebarItems = [
    { id: "resumo" as FinanceNav, label: "Resumo financeiro", icon: DataTrending24Regular },
    { id: "despesas" as FinanceNav, label: "Despesas do periodo", icon: List24Regular },
    { id: "imposto" as FinanceNav, label: "Imposto", icon: Money24Regular },
  ];

  const filterFields = (
    <div className="space-y-3">
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Atalhos de periodo</div>
        <div className="grid grid-cols-2 gap-1.5">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => applyQuickRange("day")}>Hoje</Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => applyQuickRange("week")}>Semana</Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => applyQuickRange("month")}>Mes</Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => applyQuickRange("year")}>Ano</Button>
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Datas</div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Data inicial</label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-8 text-xs" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Data final</label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-8 text-xs" />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Categoria</label>
        <Select value={selectedCategory ? String(selectedCategory) : "todas"} onValueChange={(value) => setSelectedCategory(value === "todas" ? undefined : Number(value))}>
          <SelectTrigger className="h-8 w-full text-xs">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas categorias</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className={styles.root}>
      <NavDrawer
        selectedValue={activeNav}
        open={isNavOpen}
        type={drawerType}
        className={styles.nav}
        onOpenChange={(_, data) => setIsNavOpen(data.open)}
        onNavItemSelect={(_, data) => {
          const next = data.value as FinanceNav;
          setActiveNav(next);
          if (isMobile) setIsNavOpen(false);
          requestAnimationFrame(() => scrollToSection(next));
        }}
      >
        <NavDrawerHeader>
          <Hamburger onClick={() => setIsNavOpen((value) => !value)} />
        </NavDrawerHeader>
        <NavDrawerBody className={styles.drawerContent}>
          <NavSectionHeader>Financas</NavSectionHeader>
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return <NavItem key={item.id} value={item.id} icon={<Icon />}>{item.label}</NavItem>;
          })}
          {!isMobile && <div className={styles.footer}><NavDivider />{filterFields}</div>}
        </NavDrawerBody>
      </NavDrawer>

      <div className={styles.content}>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 md:p-6">
          <div className="mb-4 flex shrink-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              {(isMobile || !isNavOpen) && (
                <Tooltip content="Abrir menu" relationship="label">
                  <Hamburger onClick={() => setIsNavOpen(true)} {...restoreFocusTargetAttributes} aria-expanded={isNavOpen} />
                </Tooltip>
              )}
              <div>
                <h1 className="text-lg font-bold tracking-tight md:text-xl">Financas / Contabilidade</h1>
                <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">Controle simples de entradas (vendas) e saidas (despesas).</p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button onClick={openNew}>Registrar despesa</Button>
              <Button variant="outline" size="sm" onClick={() => handleExport("pdf")} className="gap-2"><Print24Regular className="h-4 w-4" /> PDF</Button>
              <Button variant="outline" size="sm" onClick={() => handleExport("excel")} className="gap-2"><Document24Regular className="h-4 w-4" /> Excel</Button>
            </div>
          </div>

          {isMobile && <Card className="mb-4 shrink-0"><CardHeader className="px-4 pb-2 pt-4"><CardTitle className="text-sm font-medium">Periodo e filtros</CardTitle></CardHeader><CardContent className="px-4 pb-4">{filterFields}</CardContent></Card>}

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
            <div ref={resumoRef} id="finance-resumo" className="scroll-mt-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Card><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm text-muted-foreground"><ReceiptMoney24Regular className="h-5 w-5 text-emerald-500" />Entradas (vendas)</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{formatCurrency(summary?.gross_revenue)}</CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm text-muted-foreground"><CalligraphyPen20Regular className="h-5 w-5 text-red-500" />Saidas (despesas)</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{formatCurrency(summary?.total_expenses)}</CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm text-muted-foreground"><Money24Regular className="h-5 w-5 text-blue-500" />Lucro liquido</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{formatCurrency(summary?.net_profit)}</CardContent></Card>
              </div>
            </div>

            <div ref={despesasRef} id="finance-despesas" className="scroll-mt-4">
              <Card className="flex-1">
                <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2"><AlertOff24Regular className="h-5 w-5" />Despesas do periodo</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Titulo</TableHead><TableHead>Categoria</TableHead><TableHead>Valor</TableHead><TableHead className="text-right">Acoes</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {expenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>{expense.expense_date.substring(0, 10)}</TableCell>
                          <TableCell>{expense.title}</TableCell>
                          <TableCell>{expense.category_name || "-"}</TableCell>
                          <TableCell>{formatCurrency(expense.amount)}</TableCell>
                          <TableCell className="space-x-2 text-right"><Button size="sm" variant="ghost" onClick={() => openEdit(expense)}>Editar</Button><Button size="sm" variant="ghost" onClick={() => handleDelete(expense)}>Remover</Button></TableCell>
                        </TableRow>
                      ))}
                      {expenses.length === 0 && <TableRow><TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">Nenhuma despesa registrada no periodo.</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
            <div ref={impostoRef} id="finance-imposto" className="scroll-mt-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2"><Money24Regular className="h-5 w-5" />Imposto</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">O imposto mensal e criado automaticamente com estado Nao pago. O admin pode marcar como pago depois da liquidacao.</p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Mes</label>
                      <Select value={String(taxMonth)} onValueChange={(value) => setTaxMonth(Number(value))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {monthLabels.map((label, index) => (
                            <SelectItem key={label} value={String(index + 1)}>{String(index + 1).padStart(2, "0")} - {label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Ano</label>
                      <Select value={String(taxYear)} onValueChange={(value) => setTaxYear(Number(value))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 6 }, (_, index) => new Date().getFullYear() - 2 + index).map((year) => (
                            <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs text-muted-foreground">Estado do mes selecionado</label>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant={taxSummary?.is_paid ? "default" : "outline"} onClick={() => updateTaxSummary.mutate({ is_paid: true, notes: taxNotes || undefined })} disabled={updateTaxSummary.isPending}>Marcar como Pago</Button>
                        <Button variant={!taxSummary?.is_paid ? "default" : "outline"} onClick={() => updateTaxSummary.mutate({ is_paid: false, notes: taxNotes || undefined })} disabled={updateTaxSummary.isPending}>Marcar como Nao Pago</Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <Card className="border-amber-200 bg-amber-50/70"><CardHeader className="pb-2"><CardTitle className="text-sm text-amber-800">Total do mes atual</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-amber-950">{formatCurrency(taxSummary?.total_tax_due)}</CardContent></Card>
                    <Card className="border-emerald-200 bg-emerald-50/70"><CardHeader className="pb-2"><CardTitle className="text-sm text-emerald-800">Total vendido no mes</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-emerald-950">{formatCurrency(taxMonthFinanceSummary?.gross_revenue)}</CardContent></Card>
                    <Card className="border-rose-200 bg-rose-50/70"><CardHeader className="pb-2"><CardTitle className="text-sm text-rose-800">Total de despesas</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-rose-950">{formatCurrency(taxMonthFinanceSummary?.total_expenses)}</CardContent></Card>
                  </div>

                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base">Lista de meses</CardTitle></CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader><TableRow><TableHead>Nº</TableHead><TableHead>Nome do mes</TableHead><TableHead>Total do imposto</TableHead><TableHead>Total de venda do mes</TableHead><TableHead>% imposto</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acao</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {monthlyTaxRows.map((row) => (
                            <TableRow key={`${taxYear}-${row.month}`} className={row.month === taxMonth ? "bg-muted/40" : undefined}>
                              <TableCell>{String(row.month).padStart(2, "0")}</TableCell>
                              <TableCell>{row.label}</TableCell>
                              <TableCell>{formatCurrency(row.taxSummary?.total_tax_due)}</TableCell>
                              <TableCell>{formatCurrency(row.financeSummary?.gross_revenue)}</TableCell>
                              <TableCell>{row.taxPercentage.toFixed(2)}%</TableCell>
                              <TableCell><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${row.taxSummary?.is_paid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{row.taxSummary?.is_paid ? "Pago" : "Nao pago"}</span></TableCell>
                              <TableCell className="text-right"><div className="flex justify-end gap-2"><Button variant="ghost" size="sm" onClick={() => setTaxMonth(row.month)}>Ver</Button><Button variant={row.taxSummary?.is_paid ? "outline" : "default"} size="sm" onClick={() => handleTaxStatusChange(row.month, !row.taxSummary?.is_paid)}>{row.taxSummary?.is_paid ? "Marcar Nao Pago" : "Marcar Pago"}</Button></div></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Observacoes</label>
                    <Input value={taxNotes} onChange={(e) => setTaxNotes(e.target.value)} placeholder="Notas sobre o pagamento do imposto" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showWhatsappDialog} onOpenChange={setShowWhatsappDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Enviar documento para WhatsApp</DialogTitle></DialogHeader>
          <div className="space-y-3 py-3">
            <Input placeholder="Ex.: +25884XXXXXXX" value={tempPhone} onChange={(e) => setTempPhone(e.target.value)} />
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={whatsappPrefs.enabled} onChange={(e) => setWhatsappPrefs({ enabled: e.target.checked })} />
              <span className="text-sm text-muted-foreground">Ativar envio automatico para WhatsApp</span>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => { setShowWhatsappDialog(false); if (pendingExport) handleExport(pendingExport); }}>Imprimir sem WhatsApp</Button>
            <Button onClick={() => { setWhatsappPrefs({ phone: tempPhone, enabled: true }); saveToBackend(tempPhone); setShowWhatsappDialog(false); if (pendingExport) handleExport(pendingExport); }} disabled={!tempPhone.trim()}>Salvar e continuar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar despesa" : "Nova despesa"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Titulo" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input type="number" placeholder="Valor" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <Input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} />
            <Select value={form.category_id ? String(form.category_id) : "nenhuma"} onValueChange={(value) => setForm({ ...form, category_id: value === "nenhuma" ? undefined : Number(value) })}>
              <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nenhuma">Sem categoria</SelectItem>
                {categories.map((category) => (<SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>))}
              </SelectContent>
            </Select>
            <Input placeholder="Descricao (opcional)" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <DialogFooter className="mt-4"><Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button><Button onClick={handleSave}>{editing ? "Salvar" : "Adicionar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
