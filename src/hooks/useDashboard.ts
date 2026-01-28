import { useQuery } from "@tanstack/react-query";
import { dashboardApi, DashboardStats, SalesSummary, SalesByPeriod, TopProduct } from "@/services/api";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => dashboardApi.get(),
  });
}

export function useSalesSummary(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["salesSummary", startDate, endDate],
    queryFn: () => dashboardApi.getSalesSummary(startDate, endDate),
  });
}

export function useTopProducts(startDate?: string, endDate?: string, limit = 20) {
  return useQuery({
    queryKey: ["topProducts", startDate, endDate, limit],
    queryFn: () => dashboardApi.getTopProducts(startDate, endDate, limit),
  });
}

export function useSalesByDay(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["salesByDay", startDate, endDate],
    queryFn: () => dashboardApi.getSalesByDay(startDate, endDate),
  });
}

