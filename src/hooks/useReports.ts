import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/services/api";

export function useSalesSummary(startDate?: string, endDate?: string, userId?: number) {
    return useQuery({
        queryKey: ["salesSummary", startDate, endDate, userId],
        queryFn: () => dashboardApi.getSalesSummary(startDate, endDate, userId),
        enabled: true,
    });
}

export function useSalesByDay(startDate?: string, endDate?: string, userId?: number) {
    return useQuery({
        queryKey: ["salesByDay", startDate, endDate, userId],
        queryFn: () => dashboardApi.getSalesByDay(startDate, endDate, userId),
        enabled: true,
    });
}

export function usePeriodicReport(period: "day" | "month" | "year", date: string, userId?: number) {
    return useQuery({
        queryKey: ["periodicReport", period, date, userId],
        queryFn: () => dashboardApi.getPeriodicReport(period, date, userId),
        enabled: !!date,
    });
}

export function useDetailedMonthly(year: number, month: number, userId?: number) {
    return useQuery({
        queryKey: ["detailedMonthly", year, month, userId],
        queryFn: () => dashboardApi.getDetailedMonthly(year, month, userId),
        enabled: !!year && !!month,
    });
}

export function useDetailedYearly(year: number, userId?: number) {
    return useQuery({
        queryKey: ["detailedYearly", year, userId],
        queryFn: () => dashboardApi.getDetailedYearly(year, userId),
        enabled: !!year,
    });
}

export function useTopProducts(startDate?: string, endDate?: string, limit = 20, userId?: number) {
    return useQuery({
        queryKey: ["topProducts", startDate, endDate, limit, userId],
        queryFn: () => dashboardApi.getTopProducts(startDate, endDate, limit, userId),
        enabled: true,
    });
}

export function useDashboardStats(userId?: number) {
    return useQuery({
        queryKey: ["dashboardStats", userId],
        queryFn: () => dashboardApi.get(userId),
    });
}
