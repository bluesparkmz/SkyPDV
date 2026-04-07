import { useState, useRef, useEffect } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear } from "date-fns";
import type { DrawerProps } from "@fluentui/react-components";
import {
  Hamburger,
  NavDrawer,
  NavDrawerBody,
  NavDrawerHeader,
  NavDivider,
  NavItem,
  NavSectionHeader,
  makeStyles,
  tokens,
  Tooltip,
  useRestoreFocusTarget,
} from "@fluentui/react-components";
import {
  Money24Regular,
  ReceiptMoney24Regular,
  CalligraphyPen20Regular,
  AlertOff24Regular,
  Print24Regular,
  Document24Regular,
  DataTrending24Regular,
  List24Regular,
} from "@fluentui/react-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useFinanceSummary, useExpenses, useExpenseCategories, useCreateExpense, useUpdateExpense, useDeleteExpense, useTaxSummary, useUpdateTaxSummary } from "@/hooks/useFinance";
import { financeApi } from "@/services/api";
import { useWhatsappPrefs } from "@/hooks/useWhatsappPrefs";
import { PDVExpense } from "@/services/api";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

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

export function FinanceScreen() {
  const styles = useStyles();
  const isMobile = useIsMobile();
  const drawerType: Required<DrawerProps>["type"] = isMobile ? "overlay" : "inline";
  const [isNavOpen, setIsNavOpen] = useState(false);
  const restoreFocusTargetAttributes = useRestoreFocusTarget();
  const [activeNav, setActiveNav] = useState<FinanceNav>("resumo");
  const resumoRef = useRef<HTMLDivElement>(null);
  const despesasRef = useRef<HTMLDivElement>(null);
  const impostoRef = useRef<HTMLDivElement>(null);

  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [taxMonth, setTaxMonth] = useState<number>(new Date().getMonth() + 1);
  const [taxYear, setTaxYear] = useState<number>(new Date().getFullYear());
  const [taxNotes, setTaxNotes] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PDVExpense | null>(null);
  const [form, setForm] = useState<{ title: string; amount: string; expense_date: string; category_id?: number; description?: string }>({
    title: "",
    amount: "",
    expense_date: format(new Date(), "yyyy-MM-dd"),
  });
  const { prefs: whatsappPrefs, setPrefs: setWhatsappPrefs, saveToBackend } = useWhatsappPrefs();
  const [showWhatsappDialog, setShowWhatsappDialog] = useState(false);
  const [pendingExport, setPendingExport] = useState<"pdf" | "excel" | null>(null);
  const [tempPhone, setTempPhone] = useState("");

  const { data: summary } = useFinanceSummary(startDate, endDate);
  const { data: categories = [] } = useExpenseCategories();
  const { data: expenses = [] } = useExpenses(startDate, endDate, selectedCategory);
  const { data: taxSummary } = useTaxSummary(taxYear, taxMonth);

  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();
  const updateTaxSummary = useUpdateTaxSummary(taxYear, taxMonth);

  useEffect(() => {
    setIsNavOpen(!isMobile);
  }, [isMobile]);

  const scrollToSection = (section: FinanceNav) => {
    const el = section === "resumo" ? resumoRef.current : section === "despesas" ? despesasRef.current : impostoRef.current;
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    setTaxNotes(taxSummary?.notes || "");
  }, [taxSummary?.notes]);

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", amount: "", expense_date: format(new Date(), "yyyy-MM-dd") });
    setIsDialogOpen(true);
  };

  const openEdit = (exp: PDVExpense) => {
    setEditing(exp);
    setForm({
      title: exp.title,
      amount: exp.amount,
      expense_date: exp.expense_date.substring(0, 10),
      category_id: exp.category_id || undefined,
      description: exp.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!form.title || !form.amount || !form.expense_date) {
        toast.error("Preencha título, valor e data");
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
    } catch (e: any) {
      toast.error(e?.message || "Erro ao salvar");
    }
  };

  const handleDelete = async (exp: PDVExpense) => {
    try {
      await deleteExpense.mutateAsync(exp.id);
      toast.success("Despesa removida");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao remover");
    }
  };

  const formatCurrency = (val?: string | number | null) => {
    const num = typeof val === "string" ? parseFloat(val) : val || 0;
    return new Intl.NumberFormat("pt-MZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num) + " MT";
  };

  const applyQuickRange = (range: "day" | "week" | "month" | "year") => {
    const now = new Date();
    if (range === "day") {
      const d = format(now, "yyyy-MM-dd");
      setStartDate(d);
      setEndDate(d);
    } else if (range === "week") {
      setStartDate(format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"));
      setEndDate(format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"));
    } else if (range === "month") {
      setStartDate(format(startOfMonth(now), "yyyy-MM-dd"));
      setEndDate(format(endOfMonth(now), "yyyy-MM-dd"));
    } else if (range === "year") {
      setStartDate(format(startOfYear(now), "yyyy-MM-dd"));
      setEndDate(format(endOfYear(now), "yyyy-MM-dd"));
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
      const { blob, filename } =
        type === "pdf"
          ? await financeApi.downloadSummaryPdf(startDate, endDate, undefined, phoneParam)
          : await financeApi.downloadSummaryExcel(startDate, endDate, undefined, phoneParam);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        filename ||
        `finance-${type}-${startDate || "inicio"}-${endDate || "fim"}.${type === "pdf" ? "pdf" : "xlsx"}`;
      a.click();
      URL.revokeObjectURL(url);

      if (whatsappPrefs.enabled && whatsappPrefs.phone) {
        toast.success(`Enviaremos o resumo para o WhatsApp ${whatsappPrefs.phone}. (placeholder)`);
      }
    } catch (e: any) {
      toast.error(e?.message || `Falha ao gerar ${type === "pdf" ? "PDF" : "Excel"}`);
    }
  };

  const sidebarItems = [
    {
      id: "resumo" as FinanceNav,
      label: "Resumo financeiro",
      icon: DataTrending24Regular,
    },
    {
      id: "despesas" as FinanceNav,
      label: "Despesas do período",
      icon: List24Regular,
    },
    {
      id: "imposto" as FinanceNav,
      label: "Imposto",
      icon: Money24Regular,
    },
  ];

  const filterFields = (
    <div className="space-y-3">
      <div>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Atalhos de período</div>
        <div className="grid grid-cols-2 gap-1.5">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => applyQuickRange("day")}>
            Hoje
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => applyQuickRange("week")}>
            Semana
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => applyQuickRange("month")}>
            Mês
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => applyQuickRange("year")}>
            Ano
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Datas</div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Data inicial</label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-8 text-xs" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Data final</label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-8 text-xs" />
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Categoria</label>
        <Select
          value={selectedCategory ? String(selectedCategory) : "todas"}
          onValueChange={(v) => setSelectedCategory(v === "todas" ? undefined : Number(v))}
        >
          <SelectTrigger className="h-8 w-full text-xs">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas categorias</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
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
          <Hamburger onClick={() => setIsNavOpen((v) => !v)} />
        </NavDrawerHeader>
        <NavDrawerBody className={styles.drawerContent}>
          <NavSectionHeader>Finanças</NavSectionHeader>
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavItem key={item.id} value={item.id} icon={<Icon />}>
                {item.label}
              </NavItem>
            );
          })}
          {!isMobile && (
            <div className={styles.footer}>
              <NavDivider />
              {filterFields}
            </div>
          )}
        </NavDrawerBody>
      </NavDrawer>

      <div className={styles.content}>
        <div className="flex-1 flex flex-col overflow-hidden p-4 md:p-6 min-h-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4 shrink-0">
            <div className="flex items-start gap-3 min-w-0">
              {(isMobile || !isNavOpen) && (
                <Tooltip content="Abrir menu" relationship="label">
                  <Hamburger
                    onClick={() => setIsNavOpen(true)}
                    {...restoreFocusTargetAttributes}
                    aria-expanded={isNavOpen}
                  />
                </Tooltip>
              )}
              <div>
                <h1 className="text-lg md:text-xl font-bold tracking-tight">Finanças / Contabilidade</h1>
                <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                  Controle simples de entradas (vendas) e saídas (despesas).
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button onClick={openNew}>Registrar despesa</Button>
              <Button variant="outline" size="sm" onClick={() => handleExport("pdf")} className="gap-2">
                <Print24Regular className="w-4 h-4" /> PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport("excel")} className="gap-2">
                <Document24Regular className="w-4 h-4" /> Excel
              </Button>
            </div>
          </div>

          {isMobile && (
            <Card className="mb-4 shrink-0">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-medium">Período e filtros</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">{filterFields}</CardContent>
            </Card>
          )}

          <div className="flex-1 overflow-y-auto min-h-0 space-y-4">
            <div ref={resumoRef} id="finance-resumo" className="scroll-mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ReceiptMoney24Regular className="w-5 h-5 text-emerald-500" />
                      Entradas (vendas)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-bold">{formatCurrency(summary?.gross_revenue)}</CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalligraphyPen20Regular className="w-5 h-5 text-red-500" />
                      Saídas (despesas)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-bold">{formatCurrency(summary?.total_expenses)}</CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Money24Regular className="w-5 h-5 text-blue-500" />
                      Lucro líquido
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-bold">{formatCurrency(summary?.net_profit)}</CardContent>
                </Card>
              </div>
            </div>

            <div ref={despesasRef} id="finance-despesas" className="scroll-mt-4">
              <Card className="flex-1">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <AlertOff24Regular className="w-5 h-5" />
                    Despesas do período
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses?.map((exp) => (
                        <TableRow key={exp.id}>
                          <TableCell>{exp.expense_date.substring(0, 10)}</TableCell>
                          <TableCell>{exp.title}</TableCell>
                          <TableCell>{exp.category_name || "-"}</TableCell>
                          <TableCell>{formatCurrency(exp.amount)}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button size="sm" variant="ghost" onClick={() => openEdit(exp)}>
                              Editar
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(exp)}>
                              Remover
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {expenses?.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">
                            Nenhuma despesa registrada no período.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            <div ref={impostoRef} id="finance-imposto" className="scroll-mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Money24Regular className="w-5 h-5" />
                    Imposto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    O imposto mensal e criado automaticamente com estado Nao pago. O admin pode marcar como pago depois da liquidacao.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Mês</label>
                      <Select value={String(taxMonth)} onValueChange={(v) => setTaxMonth(Number(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                            <SelectItem key={month} value={String(month)}>
                              {month.toString().padStart(2, "0")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Ano</label>
                      <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(Number(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                            <SelectItem key={year} value={String(year)}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-muted-foreground mb-1 block">Estado</label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={taxSummary?.is_paid ? "default" : "outline"}
                          onClick={() => updateTaxSummary.mutate({ is_paid: true, notes: taxNotes || undefined })}
                          disabled={updateTaxSummary.isPending}
                        >
                          Marcar como Pago
                        </Button>
                        <Button
                          variant={!taxSummary?.is_paid ? "default" : "outline"}
                          onClick={() => updateTaxSummary.mutate({ is_paid: false, notes: taxNotes || undefined })}
                          disabled={updateTaxSummary.isPending}
                        >
                          Marcar como Nao Pago
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">Total a pagar no mês</CardTitle>
                      </CardHeader>
                      <CardContent className="text-2xl font-bold">
                        {formatCurrency(taxSummary?.total_tax_due)}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">Estado</CardTitle>
                      </CardHeader>
                      <CardContent className="text-lg font-semibold">
                        {taxSummary?.is_paid ? "Pago" : "Nao pago"}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">Data de pagamento</CardTitle>
                      </CardHeader>
                      <CardContent className="text-lg font-semibold">
                        {taxSummary?.paid_at ? taxSummary.paid_at.substring(0, 10) : "-"}
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Observações</label>
                    <Input
                      value={taxNotes}
                      onChange={(e) => setTaxNotes(e.target.value)}
                      placeholder="Notas sobre o pagamento do imposto"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showWhatsappDialog} onOpenChange={setShowWhatsappDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar documento para WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-3">
            <Input
              placeholder="Ex.: +25884XXXXXXX"
              value={tempPhone}
              onChange={(e) => setTempPhone(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={whatsappPrefs.enabled}
                onChange={(e) => setWhatsappPrefs({ enabled: e.target.checked })}
              />
              <span className="text-sm text-muted-foreground">Ativar envio automático para WhatsApp</span>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setShowWhatsappDialog(false);
                if (pendingExport) handleExport(pendingExport);
              }}
            >
              Imprimir sem WhatsApp
            </Button>
            <Button
              onClick={() => {
                setWhatsappPrefs({ phone: tempPhone, enabled: true });
                saveToBackend(tempPhone);
                setShowWhatsappDialog(false);
                if (pendingExport) handleExport(pendingExport);
              }}
              disabled={!tempPhone.trim()}
            >
              Salvar e continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar despesa" : "Nova despesa"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input type="number" placeholder="Valor" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <Input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} />
            <Select value={form.category_id ? String(form.category_id) : "nenhuma"} onValueChange={(v) => setForm({ ...form, category_id: v === "nenhuma" ? undefined : Number(v) })}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nenhuma">Sem categoria</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input placeholder="Descrição (opcional)" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>{editing ? "Salvar" : "Adicionar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
