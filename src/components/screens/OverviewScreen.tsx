import { useDashboard } from "@/hooks/useDashboard";
import { useSales as useSalesList } from "@/hooks/useSales";
import { parseISO, getDay } from "date-fns";
import {
  Money24Regular,
  Receipt24Regular,
  Box24Regular,
  ArrowTrendingLines24Regular,
  Print24Regular,
  Clock24Regular,
  DataTrending24Regular,
} from "@fluentui/react-icons";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: "up" | "down";
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

function StatCard({ title, value, change, trend, icon: Icon }: StatCardProps) {
  return (
    <div className="fluent-card p-3 md:p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] md:text-sm text-muted-foreground mb-0.5 md:mb-1">{title}</p>
          <p className="text-base md:text-2xl font-bold text-foreground">{value}</p>
          {change && (
            <p className={`text-[10px] md:text-sm mt-0.5 md:mt-1 ${trend === "up" ? "text-success" : "text-destructive"}`}>
              {trend === "up" ? "↑" : "↓"} {change}
            </p>
          )}
        </div>
        <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <Icon className="w-4 h-4 md:w-6 md:h-6" />
        </div>
      </div>
    </div>
  );
}

export function OverviewScreen() {
  const { data: dashboard, isLoading } = useDashboard();
  const { data: recentSales = [] } = useSalesList({ limit: 5, status: "completed" });

  const stats = dashboard ? [
    {
      title: "Vendas Hoje",
      value: `${parseFloat(dashboard.today_revenue).toFixed(2)} MT`,
      change: undefined,
      trend: undefined,
      icon: Money24Regular,
    },
    {
      title: "Pedidos Hoje",
      value: dashboard.today_sales.toString(),
      change: undefined,
      trend: undefined,
      icon: Receipt24Regular,
    },
    {
      title: "Estoque Baixo",
      value: dashboard.low_stock_alerts.toString(),
      change: undefined,
      trend: undefined,
      icon: Box24Regular,
    },
    {
      title: "Receita do Mês",
      value: `${parseFloat(dashboard.month_revenue).toFixed(2)} MT`,
      change: undefined,
      trend: undefined,
      icon: ArrowTrendingLines24Regular,
    },
  ] : [];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Fixed Header */}
      <div className="p-3 md:p-6 border-b border-border bg-background/80 backdrop-blur-md z-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary flex items-center justify-center text-white">
              <DataTrending24Regular className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-foreground">Visão Geral</h1>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Resumo do dia</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="fluent-button gap-2 px-3 justify-center">
              <Print24Regular className="w-5 h-5" />
              <span className="hidden sm:inline">Relatório</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 p-3 md:p-6 overflow-auto windows-scrollbar">


        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 md:mb-6">
          <div className="lg:col-span-2 fluent-card p-4 md:p-5">
            <h3 className="text-sm md:text-base font-semibold text-foreground mb-4">Vendas da Semana</h3>
            <div className="h-40 md:h-48 flex items-end justify-between gap-1 md:gap-2 px-1 md:px-4">
              {(() => {
                const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
                const dailyRevenues = new Array(7).fill(0);

                if (dashboard?.weekly_breakdown) {
                  dashboard.weekly_breakdown.forEach(item => {
                    const date = parseISO(item.period);
                    // getDay() is 0 (Sun) to 6 (Sat)
                    // We want 0 (Mon) to 6 (Sun)
                    let dayIndex = getDay(date) - 1;
                    if (dayIndex === -1) dayIndex = 6; // Sunday

                    if (dayIndex >= 0 && dayIndex < 7) {
                      dailyRevenues[dayIndex] = parseFloat(item.total_revenue.toString());
                    }
                  });
                }

                const maxRevenue = Math.max(...dailyRevenues, 100); // Mínimo de 100 para não estourar se for tudo 0

                return weekDays.map((day, i) => {
                  const revenue = dailyRevenues[i];
                  const heightPercent = (revenue / maxRevenue) * 100;

                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full bg-primary/20 rounded-t-lg relative overflow-hidden group"
                        style={{ height: `100%` }}
                      >
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-lg transition-all duration-500"
                          style={{ height: `${heightPercent}%` }}
                        />
                        {/* Tooltip simples no hover */}
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] py-1 px-2 rounded shadow-lg whitespace-nowrap z-20 pointer-events-none transition-opacity">
                          {revenue.toFixed(2)} MT
                        </div>
                      </div>
                      <span className="text-[10px] md:text-xs text-muted-foreground">{day}</span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          <div className="fluent-card p-4 md:p-5">
            <h3 className="text-sm md:text-base font-semibold text-foreground mb-4">Por Categoria</h3>
            <div className="space-y-2 md:space-y-3">
              {[
                { name: "Bebidas", percent: 35, color: "bg-primary" },
                { name: "Lanches", percent: 28, color: "bg-success" },
                { name: "Doces", percent: 22, color: "bg-warning" },
                { name: "Outros", percent: 15, color: "bg-muted-foreground" },
              ].map((cat) => (
                <div key={cat.name}>
                  <div className="flex justify-between text-xs md:text-sm mb-1">
                    <span className="text-foreground">{cat.name}</span>
                    <span className="text-muted-foreground">{cat.percent}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${cat.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Sales */}
        <div className="fluent-card p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm md:text-base font-semibold text-foreground">Vendas Recentes</h3>
            <button className="text-xs md:text-sm text-primary hover:underline">Ver todas</button>
          </div>
          <div className="space-y-2">
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground">Carregando...</div>
            ) : recentSales.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">Nenhuma venda recente</div>
            ) : (
              recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-2 md:p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Receipt24Regular className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs md:text-sm font-medium text-foreground">Venda #{sale.id}</p>
                      <p className="text-[10px] md:text-xs text-muted-foreground">
                        {sale.customer_name || "Cliente Avulso"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs md:text-sm font-semibold text-foreground">
                      {parseFloat(sale.total).toFixed(2)} MT
                    </p>
                    <p className="text-[10px] md:text-xs text-muted-foreground">
                      {new Date(sale.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
