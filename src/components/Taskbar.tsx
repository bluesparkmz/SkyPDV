import { useState, useEffect } from "react";
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
  GridDots24Regular,
  DocumentText24Regular,
  Tag24Regular,
  DataTrending24Regular,
} from "@fluentui/react-icons";
import { Screen } from "@/types/screen";

interface TaskbarProps {
  onStartClick: () => void;
  isStartOpen: boolean;
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

const taskbarApps: { screen: Screen; icon: React.FC<React.SVGProps<SVGSVGElement>>; title: string }[] = [
  { screen: "pdv", icon: Desktop24Regular, title: "SkyPDV" },
  { screen: "overview", icon: DataTrending24Regular, title: "Visão Geral" },
  { screen: "products", icon: Box24Regular, title: "Produtos" },
  { screen: "stock", icon: ClipboardTaskListLtr24Regular, title: "Estoque" },
  { screen: "tables", icon: Table24Regular, title: "Mesas" },
  { screen: "tabs", icon: DocumentText24Regular, title: "Contas" },
  { screen: "sales", icon: Receipt24Regular, title: "Vendas" },
  { screen: "reports", icon: ChartMultiple24Regular, title: "Relatórios" },
];

export function Taskbar({ onStartClick, isStartOpen, currentScreen, onNavigate }: TaskbarProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-12 bg-white md:bg-taskbar flex items-center justify-center px-2 md:px-3 z-50 mx-2 mb-2 md:mx-0 md:mb-0 rounded-xl md:rounded-none shadow-lg md:shadow-none">
      {/* Center icons */}
      <div className="flex items-center gap-0.5 md:gap-1 bg-white/5 rounded-lg px-1 md:px-2 py-1 overflow-x-auto max-w-full">
        <button
          onClick={onStartClick}
          className={`taskbar-icon shrink-0 ${isStartOpen ? "active" : ""}`}
          title="Menu Iniciar"
        >
          <div className="w-5 h-5 bg-primary rounded-sm flex items-center justify-center text-white">
            <GridDots24Regular className="w-4 h-4" />
          </div>
        </button>


        {taskbarApps.map((app) => (
          <button
            key={app.screen}
            onClick={() => onNavigate(app.screen)}
            className={`taskbar-icon shrink-0 ${currentScreen === app.screen ? "active" : ""}`}
            title={app.title}
          >
            <app.icon className="w-6 h-6" />
          </button>
        ))}

        <button
          onClick={() => onNavigate("settings")}
          className={`taskbar-icon shrink-0 ${currentScreen === "settings" ? "active" : ""}`}
          title="Configurações"
        >
          <Settings24Regular className="w-6 h-6" />
        </button>
      </div>

      {/* Right section - System tray */}
      <div className="absolute right-2 md:right-3 hidden md:flex items-center gap-1 md:gap-3 text-taskbar-foreground text-xs">
        <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded hover:bg-white/10 cursor-pointer text-base">
          <Person24Regular className="w-4 h-4" />
        </div>
        <div className="flex flex-col items-end px-1 md:px-2 py-1 rounded hover:bg-white/10 cursor-pointer">
          <span className="font-medium text-[10px] md:text-xs">{formatTime(currentTime)}</span>
          <span className="text-taskbar-foreground/70 text-[9px] md:text-xs hidden sm:block">{formatDate(currentTime)}</span>
        </div>
      </div>
    </div>
  );
}
