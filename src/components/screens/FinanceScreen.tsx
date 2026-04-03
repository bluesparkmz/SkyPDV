import { useState } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Money24Regular, ReceiptMoney24Regular, CalligraphyPen20Regular, AlertOff24Regular } from "@fluentui/react-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useFinanceSummary, useExpenses, useExpenseCategories, useCreateExpense, useUpdateExpense, useDeleteExpense } from "@/hooks/useFinance";
import { PDVExpense } from "@/services/api";
import { toast } from "sonner";

export function FinanceScreen() {
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PDVExpense | null>(null);
  const [form, setForm] = useState<{ title: string; amount: string; expense_date: string; category_id?: number; description?: string }>({
    title: "",
    amount: "",
    expense_date: format(new Date(), "yyyy-MM-dd"),
  });

  const { data: summary } = useFinanceSummary(startDate, endDate);
  const { data: categories = [] } = useExpenseCategories();
  const { data: expenses = [] } = useExpenses(startDate, endDate, selectedCategory);

  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

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

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 h-full overflow-auto">
      <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold">Finanças / Contabilidade</h1>
          <p className="text-sm text-muted-foreground">Controle simples de entradas (vendas) e saídas (despesas).</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <Select value={selectedCategory ? String(selectedCategory) : "todas"} onValueChange={(v) => setSelectedCategory(v === "todas" ? undefined : Number(v))}>
            <SelectTrigger className="w-[160px]">
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
          <Button onClick={openNew}>Registrar despesa</Button>
        </div>
      </div>

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
