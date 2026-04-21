import { useState, useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { BuildingShop24Regular } from "@fluentui/react-icons";
import { HARDWARE_PLUGIN_URL } from "@/config";
import { useInvoices, useCreateInvoice, usePayInvoice } from "@/hooks/useInvoices";
import { useProducts } from "@/hooks/useProducts";
import { invoicesApi, terminalApi } from "@/services/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

type SettingsTab = "general" | "company" | "receipt" | "invoice" | "printer" | "appearance" | "security" | "users";

type Props = {
  onOpenSetup?: () => void;
};

function SettingsPanel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-4 py-4 md:px-5">
        <h2 className="text-base md:text-lg font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="mt-1 text-xs md:text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="p-4 md:p-5">{children}</div>
    </section>
  );
}

export function SettingsScreen({ onOpenSetup }: Props) {
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
    { id: "invoice" as const, name: "Fatura", icon: <Receipt24Regular className="w-5 h-5" /> },
    { id: "printer" as const, name: "Impressora", icon: <Print24Regular className="w-5 h-5" /> },
    { id: "users" as const, name: "Usuarios", icon: <PeopleTeam24Regular className="w-5 h-5" /> },
    { id: "appearance" as const, name: "Aparencia", icon: <Color24Regular className="w-5 h-5" /> },
    { id: "security" as const, name: "Seguranca", icon: <LockClosed24Regular className="w-5 h-5" /> },
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
            <NavSectionHeader>Configuracoes</NavSectionHeader>
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
                <h1 className="text-lg md:text-xl font-bold text-foreground">Configuracoes</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Personalize o sistema</p>
              </div>
              {onOpenSetup && (
                <div className="ml-auto">
                  <Button
                    size="sm"
                    variant="default"
                    className="flex items-center gap-2"
                    onClick={onOpenSetup}
                  >
                    <Building24Regular className="w-4 h-4" />
                    Abrir Setup do PDV
                  </Button>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-6">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_320px]">
                <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  <div className="border-b border-border px-4 py-4 md:px-5 md:py-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="relative shrink-0">
                          <div className="w-16 h-16 rounded-2xl border border-border bg-secondary/60 p-1.5">
                            <img
                              src={resolveAvatar(u?.profile_image, baseUrl)}
                              className="w-full h-full rounded-xl object-cover bg-background"
                              alt="Perfil"
                            />
                          </div>
                          <button className="absolute -bottom-2 -right-2 rounded-full border border-border bg-background p-1.5 text-primary shadow-sm transition-colors hover:bg-secondary">
                            <Camera24Regular className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="truncate text-xl font-bold text-foreground md:text-2xl">
                              {displayName || "Conta do PDV"}
                            </h2>
                            {isVerified && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600">
                                <CheckmarkCircle24Regular className="w-4 h-4" />
                                Verificado
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">@{u?.username || "usuario"}</p>
                          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                            Centro de configuracoes do terminal, dados da empresa e preferencias operacionais.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          className="flex items-center gap-2"
                          onClick={() => setActiveTab("company")}
                        >
                          <Edit24Regular className="w-4 h-4" />
                          Editar dados
                        </Button>
                        <a
                          href={`https://skyvenda.com/${u?.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80"
                        >
                          <Link24Regular className="w-4 h-4" />
                          Ver no site
                        </a>
                        <Button
                          onClick={logout}
                          variant="ghost"
                          className="flex items-center gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <SignOut24Regular className="w-4 h-4" />
                          Sair
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4 md:p-5">
                    <div className="rounded-xl border border-border bg-background/80 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{nameLabel}</p>
                      <p className="mt-2 truncate text-sm font-semibold text-foreground">{displayName || "Nao definido"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Conta principal do terminal</p>
                    </div>
                    <div className="rounded-xl border border-border bg-background/80 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Tipo de conta</p>
                      <p className="mt-2 text-sm font-semibold capitalize text-foreground">{u?.user_type || "Nivel basico"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Classificacao atual da conta</p>
                    </div>
                    <div className="rounded-xl border border-border bg-background/80 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Contacto / WhatsApp</p>
                      <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Call24Regular className="w-4 h-4 text-primary" />
                        <span className="truncate">{u?.whatsapp_number || u?.phone || "Nao configurado"}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">Canal principal de comunicacao</p>
                    </div>
                    <div className="rounded-xl border border-border bg-background/80 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Saldo E-Mola</p>
                      <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-emerald-600">
                        <Money24Regular className="w-4 h-4" />
                        {u?.wallet_balance?.toLocaleString() || "0"} MZN
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">Disponivel para operacoes</p>
                    </div>
                  </div>
                </section>

                <div className="space-y-4">
                  <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <BuildingShop24Regular className="w-4 h-4 text-primary" />
                      Resumo do sistema
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="rounded-xl border border-border bg-background/80 p-3">
                        <p className="text-xs text-muted-foreground">Produtos cadastrados</p>
                        <p className="mt-1 text-xl font-bold text-foreground">{stats?.total_products || 0}</p>
                      </div>
                      <div className="rounded-xl border border-border bg-background/80 p-3">
                        <p className="text-xs text-muted-foreground">Estado da conta</p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {isVerified ? "Conta validada" : "Aguardando validacao"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border bg-background/80 p-3">
                        <p className="text-xs text-muted-foreground">Identificador</p>
                        <p className="mt-1 break-all text-sm font-semibold text-foreground">
                          {u?.unique_identifier || "Nao definido"}
                        </p>
                      </div>
                    </div>
                  </section>

                  {u?.bio && (
                    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Info24Regular className="w-4 h-4 text-primary" />
                        Descricao
                      </div>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">{u.bio}</p>
                    </section>
                  )}
                </div>
              </div>

              {activeTab === "general" && (
                <SettingsPanel
                  title="Configuracoes gerais"
                  description="Preferencias do terminal, idioma e comportamento padrao do PDV."
                >
                <div className="space-y-4 md:space-y-6">

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-2">Idioma</label>
                      <select className="w-full md:max-w-xs px-4 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                        <option>Portugues (Brasil)</option>
                        <option>English</option>
                        <option>Espanol</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground block mb-2">Fuso horario</label>
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
                </SettingsPanel>
              )}

              {activeTab === "company" && (
                <SettingsPanel
                  title="Dados da empresa"
                  description="Informacoes usadas em documentos, contacto e identificacao do negocio."
                >
                <div className="space-y-4 md:space-y-6">

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
                      <label className="text-sm font-medium text-foreground block mb-2">Bio / Descricao</label>
                      <textarea
                        defaultValue={u?.bio || ""}
                        placeholder="Conte um pouco sobre o seu negocio..."
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                      />
                    </div>
                  </div>
                </div>
                </SettingsPanel>
              )}

              {activeTab === "appearance" && (
                <SettingsPanel
                  title="Aparencia"
                  description="Tema visual e cor de destaque da interface."
                >
                <div className="space-y-4 md:space-y-6">

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
                </SettingsPanel>
              )}

              {activeTab === "security" && (
                <SettingsPanel
                  title="Seguranca"
                  description="Protecoes do terminal e regras para operacoes sensiveis."
                >
                <div className="space-y-4 md:space-y-6">

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-secondary/50 gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">Bloquear tela apos inatividade</p>
                        <p className="text-xs text-muted-foreground hidden sm:block">Bloqueia automaticamente apos 5 minutos</p>
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
                </SettingsPanel>
              )}

              {activeTab === "receipt" && (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <Info24Regular className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm">Configuracoes de Recibos</p>
                  <p className="text-xs">Em desenvolvimento</p>
                </div>
              )}

              {activeTab === "invoice" && <InvoiceSection />}

              {activeTab === "printer" && <PrinterSettings />}

              {activeTab === "users" && <TerminalUsersSettings />}

              <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-border flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                <button className="fluent-button w-full sm:w-auto">Cancelar</button>
                <button className="fluent-button fluent-button-primary w-full sm:w-auto">Salvar alteracoes</button>
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

  const handleDownloadPlugin = () => {
    if (!HARDWARE_PLUGIN_URL) {
      toast.error("Link do plugin nao configurado");
      return;
    }
    window.open(HARDWARE_PLUGIN_URL, "_blank", "noopener,noreferrer");
  };

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
      toast.error("Plugin de hardware nao conectado");
      return;
    }

    setLoading(true);
    try {
      const plugin = getHardwarePlugin();
      const result = await plugin.listPrinters();

      if (result.success && result.printers) {
        setPrinters(result.printers);

        // Se nao ha impressora selecionada, usar a padrao
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
      toast.error("Plugin de hardware nao conectado");
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
        <h2 className="text-base md:text-lg font-semibold text-foreground">Configuracoes de Impressora</h2>
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

      <div className="rounded-xl border border-border bg-secondary/30 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Plugin de Hardware</h3>
            <p className="text-xs text-muted-foreground">
              Baixe e instale o plugin para habilitar impressora termica e gaveta.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPlugin}
            disabled={!HARDWARE_PLUGIN_URL}
            className="shrink-0"
          >
            Download do Plugin
          </Button>
        </div>
        {!HARDWARE_PLUGIN_URL && (
          <p className="mt-2 text-[11px] text-muted-foreground">
            Link nao configurado. Defina `VITE_SKYPDV_HARDWARE_PLUGIN_URL` no ambiente.
          </p>
        )}
        <div className="mt-4 rounded-lg border border-border bg-background/70 p-3">
          <p className="text-xs font-semibold text-foreground">Como instalar</p>
          <ol className="mt-2 space-y-1 text-xs text-muted-foreground list-decimal pl-4">
            <li>Baixe o ZIP do plugin.</li>
            <li>Extraia a pasta em qualquer local do Windows.</li>
            <li>Dentro do ZIP devem existir: `skypdv_plugin.exe` e `skypdv.bat`.</li>
            <li>Execute `skypdv.bat` para instalar e iniciar o servico.</li>
          </ol>
        </div>
      </div>

      {!isConnected && (
        <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
          <p className="text-sm text-warning">
            O plugin de hardware nao esta conectado. Conecte o plugin para configurar a impressora.
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
                          {printer.name} {printer.default ? "(Padrao)" : ""}
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
              <h3 className="text-sm font-semibold text-foreground mb-2">Informacoes</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>- A impressora selecionada sera usada para imprimir recibos de vendas</li>
                <li>- A configuracao e salva localmente no navegador</li>
                <li>- Voce pode alterar a impressora a qualquer momento</li>
                {printers.length > 0 && (
                  <li>- {printers.length} impressora(s) disponivel(is)</li>
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

type InvoiceDraftItem = {
  id: string;
  product_id: number | null;
  quantity: string;
  unit_price: string;
};

function parseInvoiceMeta(notes?: string | null) {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes);
    if (parsed && typeof parsed === "object" && parsed.invoice_meta) {
      return parsed.invoice_meta as Record<string, string>;
    }
  } catch {
    return null;
  }
  return null;
}

function createEmptyInvoiceItem(): InvoiceDraftItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    product_id: null,
    quantity: "1",
    unit_price: "",
  };
}

function InvoiceSection() {
  const { data: invoices, isLoading } = useInvoices();
  const { data: productsData } = useProducts({ is_fastfood: undefined, limit: 1000 });
  const { data: terminal } = useQuery({
    queryKey: ["terminal"],
    queryFn: () => terminalApi.get(),
  });
  const [open, setOpen] = useState(false);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceDraftItem[]>([createEmptyInvoiceItem()]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [clientNuit, setClientNuit] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyNuit, setCompanyNuit] = useState("");
  const [companyContacts, setCompanyContacts] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [logoUrl, setLogoUrl] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "mpesa" | "skywallet" | "mixed">("cash");
  const createInvoice = useCreateInvoice();
  const payInvoice = usePayInvoice();

  const products = productsData || [];

  useEffect(() => {
    if (!open) return;
    const invoiceSettings = (terminal?.settings as Record<string, string> | null) || {};
    setCompanyName(String(invoiceSettings.invoice_company_name || terminal?.name || ""));
    setCompanyNuit(String(invoiceSettings.invoice_nuit || ""));
    setCompanyContacts(String(invoiceSettings.invoice_contacts || terminal?.phone || ""));
    setLogoUrl(String(invoiceSettings.invoice_logo || terminal?.logo || ""));
    setInvoiceDate(new Date().toISOString().split("T")[0]);
    setInvoiceNumber(String(invoiceSettings.invoice_last_number || `FT-${Date.now().toString().slice(-6)}`));
    setCustomerName("");
    setCustomerPhone("");
    setClientNuit("");
    setPaymentMethod("cash");
    setInvoiceItems([createEmptyInvoiceItem()]);
  }, [open, terminal]);

  const invoiceItemsWithProducts = invoiceItems.map((item) => {
    const product = products.find((p) => p.id === item.product_id) || null;
    const unitPrice = item.unit_price !== "" ? parseFloat(item.unit_price) || 0 : parseFloat(product?.price || "0") || 0;
    const quantity = parseFloat(item.quantity || "0") || 0;
    const total = quantity * unitPrice;
    return { ...item, product, unitPrice, quantity, total };
  });

  const subtotal = invoiceItemsWithProducts.reduce((sum, item) => sum + item.total, 0);
  const taxRate = terminal?.tax_rate ? parseFloat(terminal.tax_rate) || 0 : 16;
  const taxAmount = subtotal * (taxRate / 100);
  const totalAmount = subtotal + taxAmount;

  const handleItemChange = (id: string, field: keyof InvoiceDraftItem, value: string | number | null) => {
    setInvoiceItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item, [field]: value };
        if (field === "product_id") {
          const selected = products.find((p) => p.id === Number(value));
          if (selected && !item.unit_price) {
            next.unit_price = String(selected.price);
          }
        }
        return next;
      })
    );
  };

  const addInvoiceItem = () => {
    setInvoiceItems((current) => [...current, createEmptyInvoiceItem()]);
  };

  const removeInvoiceItem = (id: string) => {
    setInvoiceItems((current) => (current.length > 1 ? current.filter((item) => item.id !== id) : current));
  };

  const handleCreate = async () => {
    if (!companyName.trim()) {
      toast.error("Informe o nome da empresa");
      return;
    }
    if (!companyNuit.trim()) {
      toast.error("O NUIT da empresa e obrigatorio");
      return;
    }

    const validItems = invoiceItemsWithProducts.filter((item) => item.product_id && item.quantity > 0);
    if (validItems.length === 0) {
      toast.error("Adicione pelo menos um produto ou servico");
      return;
    }

    const invoiceMeta = {
      company_name: companyName,
      company_nuit: companyNuit,
      company_contacts: companyContacts,
      invoice_number: invoiceNumber,
      invoice_date: invoiceDate,
      client_name: customerName,
      client_nuit: clientNuit,
      payment_method_label: paymentMethod,
      logo_url: logoUrl,
      tax_rate: String(taxRate),
    };

    await terminalApi.update({
      settings: {
        ...(terminal?.settings || {}),
        invoice_company_name: companyName,
        invoice_nuit: companyNuit,
        invoice_contacts: companyContacts,
        invoice_logo: logoUrl,
        invoice_last_number: invoiceNumber,
      },
    });

    await createInvoice.mutateAsync({
      items: validItems.map((item) => ({
        product_id: item.product_id as number,
        quantity: String(item.quantity),
        unit_price: String(item.unitPrice),
      })),
      customer_name: customerName || undefined,
      customer_phone: customerPhone || undefined,
      payment_method: paymentMethod,
      sale_type: "local",
      notes: JSON.stringify({ invoice_meta: invoiceMeta }),
    });
    setOpen(false);
  };

  const handleDownload = async (id: number) => {
    try {
      const { blob, filename } = await invoicesApi.downloadPdf(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || `fatura-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(`Erro ao gerar PDF: ${e.message}`);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base md:text-lg font-semibold text-foreground">Faturas</h2>
          <p className="text-sm text-muted-foreground">
            Liste e gere faturas. Os itens sao os produtos do PDV.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/products" className="fluent-button">Produtos</Link>
          <Button className="fluent-button fluent-button-primary" onClick={() => setOpen(true)}>
            Criar Fatura
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-secondary/50">
            <tr className="text-left">
              <th className="px-3 py-2">Fatura</th>
              <th className="px-3 py-2">Data</th>
              <th className="px-3 py-2">Cliente</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Pagamento</th>
              <th className="px-3 py-2">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center text-muted-foreground">Carregando...</td>
              </tr>
            )}
            {!isLoading && invoices && invoices.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center text-muted-foreground">Nenhuma fatura encontrada</td>
              </tr>
            )}
            {invoices?.map((inv) => (
              <tr key={inv.id} className="border-t border-border">
                <td className="px-3 py-2 font-semibold">
                  {parseInvoiceMeta(inv.notes)?.invoice_number || `#${inv.id}`}
                </td>
                <td className="px-3 py-2">
                  {parseInvoiceMeta(inv.notes)?.invoice_date || new Date(inv.created_at).toLocaleString()}
                </td>
                <td className="px-3 py-2">{inv.customer_name || "Consumidor Final"}</td>
                <td className="px-3 py-2">{Number(inv.total).toFixed(2)} MZN</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${inv.payment_status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {inv.payment_status === "paid" ? "Pago" : "Pendente"}
                  </span>
                </td>
                <td className="px-3 py-2 capitalize">{inv.payment_method}</td>
                <td className="px-3 py-2 flex gap-2">
                  {inv.payment_status !== "paid" && (
                    <Button size="sm" variant="outline" onClick={() => payInvoice.mutate(inv.id)}>
                      Marcar pago
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => handleDownload(inv.id)}>
                    PDF
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Fatura</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="rounded-2xl border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Dados da empresa</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome da empresa</Label>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>NUIT</Label>
                  <Input value={companyNuit} onChange={(e) => setCompanyNuit(e.target.value)} placeholder="Muito importante" />
                </div>
                <div className="space-y-2">
                  <Label>Contactos</Label>
                  <Input value={companyContacts} onChange={(e) => setCompanyContacts(e.target.value)} placeholder="Telefone, celular ou email" />
                </div>
                <div className="space-y-2">
                  <Label>Logotipo (URL)</Label>
                  <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Cabecalho da fatura</h3>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Numero da fatura</Label>
                  <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nome do cliente" />
                </div>
                <div className="space-y-2">
                  <Label>NUIT do cliente</Label>
                  <Input value={clientNuit} onChange={(e) => setClientNuit(e.target.value)} placeholder="Opcional" />
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <Label>Contactos do cliente</Label>
                  <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Ex: 2588..." />
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <Label>Forma de pagamento</Label>
                  <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="card">Cartao</SelectItem>
                      <SelectItem value="mpesa">M-Pesa</SelectItem>
                      <SelectItem value="skywallet">SkyWallet</SelectItem>
                      <SelectItem value="mixed">Misto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-foreground">Lista de produtos/servicos</h3>
                <Button type="button" variant="outline" onClick={addInvoiceItem}>
                  Adicionar linha
                </Button>
              </div>
              <div className="space-y-3">
                {invoiceItems.map((item, index) => (
                  <div key={item.id} className="grid gap-3 rounded-xl border border-border p-3 md:grid-cols-[2fr,110px,140px,120px,auto]">
                    <div className="space-y-2">
                      <Label>Produto/servico {index + 1}</Label>
                      <Select
                        value={item.product_id ? String(item.product_id) : ""}
                        onValueChange={(value) => handleItemChange(item.id, "product_id", Number(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={String(p.id)}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Quantidade</Label>
                      <Input
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, "quantity", e.target.value)}
                        type="number"
                        min="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Preco unitario</Label>
                      <Input
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(item.id, "unit_price", e.target.value)}
                        type="number"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Total</Label>
                      <div className="flex h-10 items-center rounded-md border border-input bg-muted/40 px-3 text-sm font-medium">
                        {invoiceItemsWithProducts.find((entry) => entry.id === item.id)?.total.toFixed(2) || "0.00"} MZN
                      </div>
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeInvoiceItem(item.id)}
                        disabled={invoiceItems.length === 1}
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-secondary/20 p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Resumo</h3>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-border bg-background px-3 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Subtotal</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{subtotal.toFixed(2)} MZN</p>
                </div>
                <div className="rounded-xl border border-border bg-background px-3 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">IVA ({taxRate.toFixed(0)}%)</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{taxAmount.toFixed(2)} MZN</p>
                </div>
                <div className="rounded-xl border border-border bg-background px-3 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
                  <p className="mt-1 text-lg font-semibold text-primary">{totalAmount.toFixed(2)} MZN</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createInvoice.isPending}>
              {createInvoice.isPending ? "Criando..." : "Criar fatura"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


