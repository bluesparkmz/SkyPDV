import { Screen } from "@/types/screen";
import {
  Desktop24Regular,
  Home24Regular,
  Box24Regular,
  ClipboardTaskListLtr24Regular,
  PeopleTeam24Regular,
  Table24Regular,
  Receipt24Regular,
  ChartMultiple24Regular,
  Settings24Regular,
  Person24Regular,
  Power24Regular,
  Warning24Regular,
  DocumentText24Regular,
  Tag24Regular,
  DataTrending24Regular,
  Food24Regular,
} from "@fluentui/react-icons";

interface StartMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: Screen) => void;
  currentScreen: Screen;
}

const pinnedApps: { name: string; icon: React.FC<React.SVGProps<SVGSVGElement>>; screen: Screen }[] = [
  { name: "PDV", icon: Desktop24Regular, screen: "pdv" },
  { name: "Visão Geral", icon: DataTrending24Regular, screen: "overview" },
  { name: "Produtos", icon: Box24Regular, screen: "products" },
  { name: "Categorias", icon: Tag24Regular, screen: "categories" },
  { name: "Estoque", icon: ClipboardTaskListLtr24Regular, screen: "stock" },
  { name: "Mesas", icon: Table24Regular, screen: "tables" },
  { name: "Contas", icon: DocumentText24Regular, screen: "tabs" },
  { name: "Vendas", icon: Receipt24Regular, screen: "sales" },
  { name: "Relatórios", icon: ChartMultiple24Regular, screen: "reports" },
  { name: "Fastfood", icon: Food24Regular, screen: "fastfood" },
  { name: "Configurações", icon: Settings24Regular, screen: "settings" },
];

export function StartMenu({ isOpen, onClose, onNavigate, currentScreen }: StartMenuProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Menu */}
      <div className="start-menu z-50 flex flex-col !w-[calc(100%-2rem)] sm:!w-[580px] !left-4 sm:!left-1/2 sm:!-translate-x-1/2 !bottom-14 max-h-[70vh]">
        {/* Search */}
        <div className="p-3 md:p-4 pb-2 md:pb-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Pesquisar aplicativos, configurações..."
              className="w-full px-4 py-2 md:py-2.5 rounded-full bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Pinned */}
        <div className="flex-1 px-4 md:px-6 pb-4 overflow-auto windows-scrollbar">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Fixados</h3>
            <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              Todos os apps →
            </button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {pinnedApps.map((app) => {
              const isActive = currentScreen === app.screen;
              return (
                <button
                  key={app.name}
                  onClick={() => onNavigate(app.screen)}
                  className={`flex flex-col items-center gap-1 md:gap-2 p-2 md:p-3 rounded-lg transition-colors ${isActive
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-secondary text-foreground"
                    }`}
                >
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center ${isActive ? "bg-primary text-white" : "bg-secondary"
                    }`}>
                    <app.icon className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <span className="text-[10px] md:text-xs font-medium truncate w-full text-center">
                    {app.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Recommended */}
          <div className="mt-4 md:mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Recomendado</h3>
              <button className="text-xs text-muted-foreground hover:text-foreground">
                Mais →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => onNavigate("overview")}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary cursor-pointer text-left"
              >
                <div className="w-8 h-8 rounded bg-success/20 flex items-center justify-center shrink-0">
                  <Receipt24Regular className="w-5 h-5 text-success" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">Vendas Hoje</p>
                  <p className="text-xs text-muted-foreground">2.458,00 MT</p>
                </div>
              </button>
              <button
                onClick={() => onNavigate("stock")}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary cursor-pointer text-left"
              >
                <div className="w-8 h-8 rounded bg-warning/20 flex items-center justify-center shrink-0">
                  <Warning24Regular className="w-5 h-5 text-warning" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">Estoque Baixo</p>
                  <p className="text-xs text-muted-foreground">3 produtos</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* User section */}
        <div className="border-t border-border p-2 md:p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3 px-2 py-1.5 rounded-lg hover:bg-secondary cursor-pointer">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary flex items-center justify-center text-white">
              <Person24Regular className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <span className="text-sm font-medium">Operador</span>
          </div>

          <button className="p-2 rounded-lg hover:bg-secondary" title="Desligar">
            <Power24Regular className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
}
