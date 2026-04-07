import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { financeApi } from "@/services/api";
import { PDVExpense, PDVExpenseCreate, PDVExpenseUpdate, PDVExpenseCategory, FinancialSummary, PDVTaxSummaryUpdate } from "@/services/api";

export function useFinanceSummary(start_date?: string, end_date?: string, user_id?: number) {
  return useQuery({
    queryKey: ["financeSummary", start_date, end_date, user_id],
    queryFn: () => financeApi.summary(start_date, end_date, user_id),
  });
}

export function useExpenseCategories() {
  return useQuery({
    queryKey: ["expenseCategories"],
    queryFn: () => financeApi.listCategories(),
  });
}

export function useExpenses(start_date?: string, end_date?: string, category_id?: number) {
  return useQuery({
    queryKey: ["expenses", start_date, end_date, category_id],
    queryFn: () => financeApi.listExpenses(start_date, end_date, category_id),
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PDVExpenseCreate) => financeApi.createExpense(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["financeSummary"] });
    },
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: PDVExpenseUpdate }) => financeApi.updateExpense(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["financeSummary"] });
    },
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => financeApi.deleteExpense(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["financeSummary"] });
    },
  });
}

export function useTaxSummary(year: number, month: number) {
  return useQuery({
    queryKey: ["taxSummary", year, month],
    queryFn: () => financeApi.taxSummary(year, month),
    enabled: !!year && !!month,
  });
}

export function useUpdateTaxSummary(year: number, month: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PDVTaxSummaryUpdate) => financeApi.updateTaxSummary(year, month, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["taxSummary", year, month] });
      qc.invalidateQueries({ queryKey: ["financeSummary"] });
    },
  });
}
