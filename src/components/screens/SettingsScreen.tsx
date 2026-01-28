import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import type { DrawerProps } from "@fluentui/react-components";
import {
  Hamburger,
  NavDivider,
  NavDrawer,
  NavDrawerBody,
  NavDrawerHeader,
  NavItem,
  NavSectionHeader,
  makeStyles,
  tokens,
  Tooltip,
  useRestoreFocusTarget,
} from "@fluentui/react-components";
import {
  Settings24Regular,
  Building24Regular,
  Receipt24Regular,
  Print24Regular,
  Color24Regular,
  LockClosed24Regular,
  Camera24Regular,
  CheckmarkCircle24Regular,
  Box24Regular,
  PeopleTeam24Regular,
  Link24Regular,
  Call24Regular,
  Money24Regular,
  SignOut24Regular,
  Info24Regular,
  Checkmark24Regular,
  ArrowSync24Regular,
  PersonAdd24Regular,
  PersonDelete24Regular,
  Edit24Regular,
} from "@fluentui/react-icons";
import { resolveAvatar } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useHardwarePlugin } from "@/hooks/useHardwarePlugin";
import { getHardwarePlugin } from "@/lib/hardwarePlugin";
import { toast } from "sonner";
import { TerminalUsersSettings } from "./TerminalUsersSettings";
import { useIsMobile } from "@/hooks/use-mobile";

const useStyles = makeStyles({
  root: {
    overflow: "hidden",
    display: "flex",
    flex: 1,
    height: "100%",
    minHeight: 0,
  },
  nav: {
    minWidth: "260px",
    height: "100%",
  },
  content: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
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

type SettingsTab = "general" | "company" | "receipt" | "printer" | "appearance" | "security" | "users";

export function SettingsScreen() {
  const styles = useStyles();
  const isMobile = useIsMobile();
  const drawerType: Required<DrawerProps>["type"] = isMobile ? "overlay" : "inline";
  const [isNavOpen, setIsNavOpen] = useState(false);
  const restoreFocusTargetAttributes = useRestoreFocusTarget();

  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const { logout, user: profileData, baseUrl } = useAuth();

  const u = profileData?.user;
  const stats = profileData?.stats;

  // Verification status check
  const isVerified = u?.verification_status === 'approved' ||
    u?.verification_status === 'verified';

  // Determine the label for the name field
  const nameLabel = u?.user_type === 'restaurant' ? "Nome do restaurante" : "User";
  const displayName = u?.page_name || u?.name || u?.username;

  const tabs = [
    { id: "general" as const, name: "Geral", icon: <Settings24Regular className="w-5 h-5" /> },
    { id: "company" as const, name: "Empresa", icon: <Building24Regular className="w-5 h-5" /> },
    { id: "receipt" as const, name: "Recibos", icon: <Receipt24Regular className="w-5 h-5" /> },
    { id: "printer" as const, name: "Impressora", icon: <Print24Regular className="w-5 h-5" /> },
    { id: "users" as const, name: "Usuários", icon: <PeopleTeam24Regular className="w-5 h-5" /> },
    { id: "appearance" as const, name: "Aparência", icon: <Color24Regular className="w-5 h-5" /> },
    { id: "security" as const, name: "Segurança", icon: <LockClosed24Regular className="w-5 h-5" /> },
  ];

  useEffect(() => {
    setIsNavOpen(!isMobile);
  }, [isMobile]);

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className={styles.root}>
        <NavDrawer
          selectedValue={activeTab}
          open={isNavOpen}
          type={drawerType}
          className={styles.nav}
          onOpenChange={(_, data) => setIsNavOpen(data.open)}
          onNavItemSelect={(_, data) => {
            const next = String(data.value);
            if (next === "__logout") {
              logout();
              return;
            }
            setActiveTab(next as SettingsTab);
            if (isMobile) setIsNavOpen(false); // Fecha no mobile
          }}
        >
          <NavDrawerHeader>
            <Hamburger onClick={() => setIsNavOpen((v) => !v)} />
          </NavDrawerHeader>
          <NavDrawerBody className={styles.drawerContent}>
            <NavSectionHeader>Configurações</NavSectionHeader>
            {tabs.map((tab) => (
              <NavItem key={tab.id} value={tab.id} icon={tab.icon}>
                {tab.name}
              </NavItem>
            ))}

            <div className={styles.footer}>
              <NavDivider />
              <NavItem icon={<SignOut24Regular />} value="__logout">
                Sair do Sistema
              </NavItem>
            </div>
          </NavDrawerBody>
        </NavDrawer>

        <div className={styles.content}>
          <div className="flex-1 min-h-0 p-4 md:p-6 overflow-auto windows-scrollbar">
            <div className="flex items-center gap-3 mb-4 md:mb-6">
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
                <h1 className="text-lg md:text-xl font-bold text-foreground">Configurações</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Personalize o sistema</p>
              </div>
            </div>

            <div className="flex-1 fluent-card p-4 md:p-6 min-w-0">
              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden mb-4 md:mb-8">
                <div className="p-3 md:p-6">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 md:gap-6 mb-3 md:mb-6">
                    <div className="relative group/avatar hidden md:block">
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-tr from-primary via-purple-500 to-pink-500 p-[3px]">
                        <img
                          src={resolveAvatar(u?.profile_image, baseUrl)}
                          className="w-full h-full rounded-full object-cover bg-background"
                          alt="Profile"
                        />
                      </div>
                      <button className="absolute bottom-0 right-0 p-1.5 bg-background rounded-full shadow-md border border-border hover:bg-secondary transition-colors text-primary">
                        <Camera24Regular className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <div className="flex flex-col sm:flex-row items-center gap-2 mb-1">
                        <h2 className="text-lg md:text-2xl font-bold text-foreground truncate max-w-full">
                          {displayName || "Carregando..."}
                        </h2>
                        {isVerified && (
                          <CheckmarkCircle24Regular className="w-5 h-5 text-primary" title="Verificado" />
                        )}
                      </div>
                      <p className="text-muted-foreground text-xs md:text-sm mb-2 md:mb-4">@{u?.username || "..."}</p>

                      <div className="hidden md:flex flex-wrap justify-center sm:justify-start gap-4 text-sm font-medium">
                        <div className="flex items-center gap-1.5 text-foreground">
                          <Box24Regular className="w-4 h-4" />
                          <span>{stats?.total_products || 0}</span>
                          <span className="text-muted-foreground font-normal">Produtos</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-foreground">
                          <PeopleTeam24Regular className="w-4 h-4" />
                          <span>{stats?.total_followers || 0}</span>
                          <span className="text-muted-foreground font-normal">Seguidores</span>
                        </div>
                      </div>
                    </div>

                    <div className="hidden md:flex gap-2">
                      <a
                        href={`https://skyvenda.com/${u?.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-foreground font-semibold text-sm hover:bg-secondary/80 transition-colors border border-border"
                      >
                        <Link24Regular className="w-4 h-4" />
                        <span className="hidden lg:inline">Ver no Site</span>
                      </a>
                      <Button
                        onClick={logout}
                        variant="ghost"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <SignOut24Regular className="w-4 h-4" />
                        <span className="hidden lg:inline">Sair da Conta</span>
                      </Button>
                    </div>
                  </div>

                  {u?.bio && (
                    <p className="hidden md:block text-sm text-muted-foreground mb-6 bg-secondary/50 p-4 rounded-xl border border-border">
                      {u.bio}
                    </p>
                  )}

                  <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{nameLabel}</span>
                      <p className="text-sm font-semibold text-foreground truncate">{displayName || "Não definido"}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tipo de Conta</span>
                      <p className="text-sm font-semibold text-foreground capitalize">{u?.user_type || "Nível Básico"}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Contacto / WhatsApp</span>
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Call24Regular className="w-4 h-4" />
                        {u?.whatsapp_number || u?.phone || "Não configurado"}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Saldo SkyWallet</span>
                      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-500">
                        <Money24Regular className="w-4 h-4" />
                        {u?.wallet_balance?.toLocaleString() || "0"} MZN
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border bg-secondary/30 p-2 md:p-4">
                  <button
                    onClick={() => setActiveTab("company")}
                    className="w-full py-2 md:py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs md:text-sm hover:bg-primary/90 transition-all shadow-sm active:scale-[0.99]"
                  >
                    Editar Informações do Perfil
                  </button>
                </div>
              </div>

              {activeTab === "general" && (
                <div className="space-y-4 md:space-y-6">
                  <h2 className="text-base md:text-lg font-semibold text-foreground">Configurações Gerais</h2>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-2">Idioma</label>
                      <select className="w-full md:max-w-xs px-4 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                        <option>Português (Brasil)</option>
                        <option>English</option>
                        <option>Español</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground block mb-2">Fuso Horário</label>
                      <select className="w-full md:max-w-xs px-4 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                        <option>America/Sao_Paulo (GMT-3)</option>
                        <option>America/Manaus (GMT-4)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground block mb-2">Taxa IVA (%)</label>
                      <input
                        type="number"
                        defaultValue="16"
                        className="w-full md:max-w-xs px-4 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>

                    <div className="flex items-center justify-between md:max-w-xs">
                      <span className="text-sm font-medium text-foreground">Som ao adicionar produto</span>
                      <button className="w-12 h-6 rounded-full bg-primary relative shrink-0 ml-3">
                        <span className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between md:max-w-xs">
                      <span className="text-sm font-medium text-foreground">Confirmar antes de limpar</span>
                      <button className="w-12 h-6 rounded-full bg-primary relative shrink-0 ml-3">
                        <span className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "company" && (
                <div className="space-y-4 md:space-y-6">
                  <h2 className="text-base md:text-lg font-semibold text-foreground">Dados da Empresa</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-2">{u?.user_type === 'restaurant' ? "Nome do Restaurante" : "Nome da Empresa"}</label>
                      <input
                        type="text"
                        defaultValue={displayName || ""}
                        placeholder="Ex: Minha Empresa"
                        className="w-full px-4 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-2">Unique ID (Identificador)</label>
                      <input
                        type="text"
                        disabled
                        value={u?.unique_identifier || ""}
                        className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-muted-foreground cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-2">Telefone / WhatsApp</label>
                      <input
                        type="text"
                        defaultValue={u?.whatsapp_number || u?.phone || ""}
                        placeholder="Ex: +258..."
                        className="w-full px-4 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-2">Email de Contacto</label>
                      <input
                        type="email"
                        defaultValue={u?.email || ""}
                        placeholder="Ex: contacto@empresa.com"
                        className="w-full px-4 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-foreground block mb-2">Bio / Descrição</label>
                      <textarea
                        defaultValue={u?.bio || ""}
                        placeholder="Conte um pouco sobre o seu negócio..."
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "appearance" && (
                <div className="space-y-4 md:space-y-6">
                  <h2 className="text-base md:text-lg font-semibold text-foreground">Aparência</h2>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-3">Tema</label>
                      <div className="flex flex-wrap gap-3">
                        <button className="w-20 md:w-24 h-14 md:h-16 rounded-lg border-2 border-primary bg-background flex items-center justify-center">
                          <span className="text-xs font-medium">Claro</span>
                        </button>
                        <button className="w-20 md:w-24 h-14 md:h-16 rounded-lg border border-border bg-[#1a1a1a] flex items-center justify-center">
                          <span className="text-xs font-medium text-white">Escuro</span>
                        </button>
                        <button className="w-20 md:w-24 h-14 md:h-16 rounded-lg border border-border bg-gradient-to-b from-background to-[#1a1a1a] flex items-center justify-center">
                          <span className="text-xs font-medium">Auto</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground block mb-3">Cor de Destaque</label>
                      <div className="flex flex-wrap gap-2">
                        <button className="w-8 h-8 rounded-full bg-[#6366f1] border-2 border-white shadow" />
                        <button className="w-8 h-8 rounded-full bg-[#3b82f6]" />
                        <button className="w-8 h-8 rounded-full bg-[#10b981]" />
                        <button className="w-8 h-8 rounded-full bg-[#f59e0b]" />
                        <button className="w-8 h-8 rounded-full bg-[#ef4444]" />
                        <button className="w-8 h-8 rounded-full bg-[#8b5cf6]" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "security" && (
                <div className="space-y-4 md:space-y-6">
                  <h2 className="text-base md:text-lg font-semibold text-foreground">Segurança</h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-secondary/50 gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">Bloquear tela após inatividade</p>
                        <p className="text-xs text-muted-foreground hidden sm:block">Bloqueia automaticamente após 5 minutos</p>
                      </div>
                      <button className="w-12 h-6 rounded-full bg-primary relative shrink-0">
                        <span className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-secondary/50 gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">Exigir senha para cancelar venda</p>
                        <p className="text-xs text-muted-foreground hidden sm:block">Solicita senha de supervisor</p>
                      </div>
                      <button className="w-12 h-6 rounded-full bg-primary relative shrink-0">
                        <span className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white" />
                      </button>
                    </div>

                    <button className="fluent-button fluent-button-primary w-full sm:w-auto">
                      Alterar Senha do Sistema
                    </button>

                    <div className="pt-4 border-t border-border">
                      <Button
                        onClick={logout}
                        variant="destructive"
                        className="w-full sm:w-auto"
                      >
                        <SignOut24Regular className="w-4 h-4 mr-2" />
                        Sair da Conta
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "receipt" && (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <Info24Regular className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm">Configurações de Recibos</p>
                  <p className="text-xs">Em desenvolvimento</p>
                </div>
              )}

              {activeTab === "printer" && <PrinterSettings />}

              {activeTab === "users" && <TerminalUsersSettings />}

              <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-border flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                <button className="fluent-button w-full sm:w-auto">Cancelar</button>
                <button className="fluent-button fluent-button-primary w-full sm:w-auto">Salvar Alterações</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrinterSettings() {
  const { isConnected, isConnecting, reconnect } = useHardwarePlugin();
  const [printers, setPrinters] = useState<Array<{ name: string; default: boolean }>>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [savedPrinter, setSavedPrinter] = useState<string | null>(null);

  // Carregar impressora salva do localStorage
  useEffect(() => {
    const saved = localStorage.getItem("skypdv_selected_printer");
    if (saved) {
      setSavedPrinter(saved);
      setSelectedPrinter(saved);
    }
  }, []);

  // Buscar impressoras quando conectar
  useEffect(() => {
    if (isConnected) {
      loadPrinters();
    }
  }, [isConnected]);

  const loadPrinters = async () => {
    if (!isConnected) {
      toast.error("Plugin de hardware não conectado");
      return;
    }

    setLoading(true);
    try {
      const plugin = getHardwarePlugin();
      const result = await plugin.listPrinters();

      if (result.success && result.printers) {
        setPrinters(result.printers);

        // Se não há impressora selecionada, usar a padrão
        if (!selectedPrinter && result.printers.length > 0) {
          const defaultPrinter = result.printers.find(p => p.default);
          if (defaultPrinter) {
            setSelectedPrinter(defaultPrinter.name);
          } else {
            setSelectedPrinter(result.printers[0].name);
          }
        }
      } else {
        toast.error(result.error || "Erro ao listar impressoras");
      }
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrinter = async () => {
    if (!selectedPrinter) {
      toast.error("Selecione uma impressora");
      return;
    }

    if (!isConnected) {
      toast.error("Plugin de hardware não conectado");
      return;
    }

    setLoading(true);
    try {
      const plugin = getHardwarePlugin();
      const result = await plugin.setPrinter(selectedPrinter);

      if (result.success) {
        localStorage.setItem("skypdv_selected_printer", selectedPrinter);
        setSavedPrinter(selectedPrinter);
        toast.success(`Impressora "${selectedPrinter}" configurada com sucesso!`);
      } else {
        toast.error(result.error || "Erro ao configurar impressora");
      }
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base md:text-lg font-semibold text-foreground">Configurações de Impressora</h2>
        {isConnected ? (
          <div className="flex items-center gap-2 text-xs text-emerald-500">
            <CheckmarkCircle24Regular className="w-4 h-4" />
            <span>Plugin Conectado</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Info24Regular className="w-4 h-4" />
              <span>Plugin Offline</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={reconnect}
              disabled={isConnecting}
              className="h-7 text-xs"
            >
              <ArrowSync24Regular className={`w-3 h-3 mr-1 ${isConnecting ? "animate-spin" : ""}`} />
              Reconectar
            </Button>
          </div>
        )}
      </div>

      {!isConnected && (
        <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
          <p className="text-sm text-warning">
            O plugin de hardware não está conectado. Conecte o plugin para configurar a impressora.
          </p>
        </div>
      )}

      {isConnected && (
        <>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Selecionar Impressora para POS
              </label>

              <div className="flex gap-2 mb-2">
                <select
                  value={selectedPrinter}
                  onChange={(e) => setSelectedPrinter(e.target.value)}
                  disabled={loading || printers.length === 0}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {printers.length === 0 ? (
                    <option value="">Carregando impressoras...</option>
                  ) : (
                    <>
                      <option value="">Selecione uma impressora</option>
                      {printers.map((printer) => (
                        <option key={printer.name} value={printer.name}>
                          {printer.name} {printer.default ? "(Padrão)" : ""}
                        </option>
                      ))}
                    </>
                  )}
                </select>

                <Button
                  variant="outline"
                  onClick={loadPrinters}
                  disabled={loading}
                  className="shrink-0"
                >
                  <ArrowSync24Regular className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </div>

              {savedPrinter && savedPrinter === selectedPrinter && (
                <div className="flex items-center gap-2 text-xs text-emerald-500 mt-1">
                  <Checkmark24Regular className="w-3 h-3" />
                  <span>Impressora salva: {savedPrinter}</span>
                </div>
              )}
            </div>

            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <h3 className="text-sm font-semibold text-foreground mb-2">Informações</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• A impressora selecionada será usada para imprimir recibos de vendas</li>
                <li>• A configuração é salva localmente no navegador</li>
                <li>• Você pode alterar a impressora a qualquer momento</li>
                {printers.length > 0 && (
                  <li>• {printers.length} impressora(s) disponível(is)</li>
                )}
              </ul>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            <Button
              onClick={handleSavePrinter}
              disabled={!selectedPrinter || loading || !isConnected}
              className="fluent-button fluent-button-primary"
            >
              {loading ? "Salvando..." : "Salvar Impressora"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
