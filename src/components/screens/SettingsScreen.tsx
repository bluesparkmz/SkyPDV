import { useState, useEffect, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { invoiceCustomersApi, invoicesApi, terminalApi } from "@/services/api";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

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
                    onClick={() => setActiveTab("invoice")}
                  >
                    <Building24Regular className="w-4 h-4" />
                    Configurar fatura
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

              {activeTab === "receipt" && <ReceiptSettings />}

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

type InvoiceCustomer = {
  id: string;
  name: string;
  nuit: string;
  address: string;
  phone: string;
  created_at: string;
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

const INVOICE_SETTINGS_STORAGE_KEY = "skypdv_invoice_settings_local";
const INVOICE_CUSTOMERS_STORAGE_KEY = "skypdv_invoice_customers_local";
const RECEIPT_SETTINGS_STORAGE_KEY = "skypdv_receipt_settings_local";

function ReceiptSettings() {
  const queryClient = useQueryClient();
  const { data: terminal } = useQuery({
    queryKey: ["terminal"],
    queryFn: () => terminalApi.get(),
  });

  const localReceiptSettings = (() => {
    try {
      const raw = localStorage.getItem(RECEIPT_SETTINGS_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Record<string, string>) : {};
    } catch {
      return {};
    }
  })();

  const [companyName, setCompanyName] = useState("");
  const [companyNuit, setCompanyNuit] = useState("");
  const [companyContacts, setCompanyContacts] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [footerMessage, setFooterMessage] = useState("");

  useEffect(() => {
    const terminalSettings = (terminal?.settings as Record<string, string> | null) || {};
    setCompanyName(String(terminalSettings.receipt_company_name || localReceiptSettings.receipt_company_name || terminal?.name || ""));
    setCompanyNuit(String(terminalSettings.receipt_nuit || localReceiptSettings.receipt_nuit || ""));
    setCompanyContacts(String(terminalSettings.receipt_contacts || localReceiptSettings.receipt_contacts || terminal?.phone || ""));
    setCompanyAddress(String(terminalSettings.receipt_address || localReceiptSettings.receipt_address || terminal?.address || ""));
    setFooterMessage(String(terminalSettings.receipt_footer || localReceiptSettings.receipt_footer || "Obrigado pela preferencia!"));
  }, [terminal]);

  const handleSave = async () => {
    if (!companyName.trim()) {
      toast.error("Informe o nome da empresa para o recibo");
      return;
    }

    const payload = {
      receipt_company_name: companyName,
      receipt_nuit: companyNuit,
      receipt_contacts: companyContacts,
      receipt_address: companyAddress,
      receipt_footer: footerMessage,
    };

    localStorage.setItem(RECEIPT_SETTINGS_STORAGE_KEY, JSON.stringify(payload));

    try {
      await terminalApi.update({
        settings: {
          ...(terminal?.settings || {}),
          ...payload,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["terminal"] });
      toast.success("Configuracao de recibo guardada");
    } catch (error: any) {
      toast.error(error?.message || "Nao foi possivel guardar no servidor. Configuracao guardada neste dispositivo.");
    }
  };

  return (
    <SettingsPanel
      title="Configuracao de recibo de venda"
      description="Esses dados sao usados na impressao do recibo da venda e sao guardados no terminal."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Nome da empresa</Label>
          <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>NUIT</Label>
          <Input value={companyNuit} onChange={(e) => setCompanyNuit(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Contacto</Label>
          <Input value={companyContacts} onChange={(e) => setCompanyContacts(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Endereco</Label>
          <Input value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Mensagem final</Label>
          <Input value={footerMessage} onChange={(e) => setFooterMessage(e.target.value)} />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={handleSave}>Guardar configuracao</Button>
      </div>
    </SettingsPanel>
  );
}

export function InvoiceSection() {
  const styles = useStyles();
  const isMobile = useIsMobile();
  const drawerType: Required<DrawerProps>["type"] = isMobile ? "overlay" : "inline";
  const [isNavOpen, setIsNavOpen] = useState(false);
  const restoreFocusTargetAttributes = useRestoreFocusTarget();
  const queryClient = useQueryClient();
  const { data: invoices, isLoading } = useInvoices();
  const { data: productsData } = useProducts({ is_fastfood: undefined, limit: 1000 });
  const { data: terminal } = useQuery({
    queryKey: ["terminal"],
    queryFn: () => terminalApi.get(),
  });
  const { data: dbInvoiceCustomers } = useQuery({
    queryKey: ["invoiceCustomers"],
    queryFn: () => invoiceCustomersApi.list(),
  });
  const [open, setOpen] = useState(false);
  const [companyConfigName, setCompanyConfigName] = useState("");
  const [companyConfigNuit, setCompanyConfigNuit] = useState("");
  const [companyConfigContacts, setCompanyConfigContacts] = useState("");
  const [companyConfigLogo, setCompanyConfigLogo] = useState("");
  const [companyConfigStamp, setCompanyConfigStamp] = useState("");
  const [companyConfigLocation, setCompanyConfigLocation] = useState("");
  const [invoiceItems, setInvoiceItems] = useState<InvoiceDraftItem[]>([createEmptyInvoiceItem()]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [clientNuit, setClientNuit] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyNuit, setCompanyNuit] = useState("");
  const [companyContacts, setCompanyContacts] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [logoUrl, setLogoUrl] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "mpesa" | "skywallet" | "mixed">("cash");
  const [taxIncludedInPrice, setTaxIncludedInPrice] = useState(true);
  const [invoiceView, setInvoiceView] = useState<"clients" | "receipts" | "invoices" | "settings">("invoices");
  const [invoiceCustomers, setInvoiceCustomers] = useState<InvoiceCustomer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("manual");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerNuit, setNewCustomerNuit] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerAddress, setNewCustomerAddress] = useState("");
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const createInvoice = useCreateInvoice();
  const payInvoice = usePayInvoice();

  useEffect(() => {
    setIsNavOpen(!isMobile);
  }, [isMobile]);

  const products = productsData || [];
  const localInvoiceSettings = (() => {
    try {
      const raw = localStorage.getItem(INVOICE_SETTINGS_STORAGE_KEY);
      return raw ? JSON.parse(raw) as Record<string, string> : {};
    } catch {
      return {};
    }
  })();
  const localInvoiceCustomers = (() => {
    try {
      const raw = localStorage.getItem(INVOICE_CUSTOMERS_STORAGE_KEY);
      if (!raw) return [] as InvoiceCustomer[];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [] as InvoiceCustomer[];
      return parsed
        .filter((row) => row && typeof row === "object")
        .map((row: any) => ({
          id: String(row.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
          name: String(row.name || "").trim(),
          nuit: String(row.nuit || "").trim(),
          address: String(row.address || "").trim(),
          phone: String(row.phone || "").trim(),
          created_at: String(row.created_at || new Date().toISOString()),
        }))
        .filter((row) => row.name.length > 0);
    } catch {
      return [] as InvoiceCustomer[];
    }
  })();

  useEffect(() => {
    const invoiceSettings = (terminal?.settings as Record<string, string> | null) || {};
    setCompanyConfigName(String(invoiceSettings.invoice_company_name || localInvoiceSettings.invoice_company_name || terminal?.name || ""));
    setCompanyConfigNuit(String(invoiceSettings.invoice_nuit || localInvoiceSettings.invoice_nuit || ""));
    setCompanyConfigContacts(String(invoiceSettings.invoice_contacts || localInvoiceSettings.invoice_contacts || terminal?.phone || ""));
    setCompanyConfigLogo(String(invoiceSettings.invoice_logo || localInvoiceSettings.invoice_logo || terminal?.logo || ""));
    setCompanyConfigStamp(String(invoiceSettings.invoice_stamp || localInvoiceSettings.invoice_stamp || ""));
    setCompanyConfigLocation(String(invoiceSettings.invoice_location || localInvoiceSettings.invoice_location || ""));

    let customersFromSettings: InvoiceCustomer[] = [];
    try {
      const raw = invoiceSettings.invoice_customers || "[]";
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        customersFromSettings = parsed
          .filter((row) => row && typeof row === "object")
          .map((row: any) => ({
            id: String(row.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
            name: String(row.name || "").trim(),
            nuit: String(row.nuit || "").trim(),
            address: String(row.address || "").trim(),
            phone: String(row.phone || "").trim(),
            created_at: String(row.created_at || new Date().toISOString()),
          }))
          .filter((row) => row.name.length > 0);
      }
    } catch {
      customersFromSettings = [];
    }
    const customersFromDb: InvoiceCustomer[] = (dbInvoiceCustomers || []).map((row: any) => ({
      id: String(row.id),
      name: String(row.name || "").trim(),
      nuit: String(row.nuit || "").trim(),
      address: String(row.address || "").trim(),
      phone: String(row.phone || "").trim(),
      created_at: String(row.created_at || new Date().toISOString()),
    })).filter((row) => row.name.length > 0);

    const mergedCustomers =
      customersFromDb.length > 0
        ? customersFromDb
        : customersFromSettings.length > 0
          ? customersFromSettings
          : localInvoiceCustomers;
    setInvoiceCustomers(mergedCustomers);
  }, [terminal, dbInvoiceCustomers]);

  useEffect(() => {
    if (!open) return;
    const invoiceSettings = (terminal?.settings as Record<string, string> | null) || {};
    setCompanyName(String(invoiceSettings.invoice_company_name || companyConfigName || terminal?.name || ""));
    setCompanyNuit(String(invoiceSettings.invoice_nuit || companyConfigNuit || ""));
    setCompanyContacts(String(invoiceSettings.invoice_contacts || companyConfigContacts || terminal?.phone || ""));
    setLogoUrl(String(invoiceSettings.invoice_logo || companyConfigLogo || terminal?.logo || ""));
    setInvoiceDate(new Date().toISOString().split("T")[0]);
    setInvoiceNumber(String(invoiceSettings.invoice_last_number || `FT-${Date.now().toString().slice(-6)}`));
    setCustomerName("");
    setCustomerPhone("");
    setClientNuit("");
    setClientAddress("");
    setSelectedCustomerId("manual");
    setPaymentMethod("cash");
    setTaxIncludedInPrice(true);
    setInvoiceItems([createEmptyInvoiceItem()]);
  }, [open, terminal, companyConfigContacts, companyConfigLocation, companyConfigLogo, companyConfigName, companyConfigNuit]);

  const invoiceItemsWithProducts = invoiceItems.map((item) => {
    const product = products.find((p) => p.id === item.product_id) || null;
    const unitPrice = item.unit_price !== "" ? parseFloat(item.unit_price) || 0 : parseFloat(product?.price || "0") || 0;
    const quantity = parseFloat(item.quantity || "0") || 0;
    const total = quantity * unitPrice;
    return { ...item, product, unitPrice, quantity, total };
  });

  const taxRate = terminal?.tax_rate ? parseFloat(terminal.tax_rate) || 0 : 16;
  const taxFactor = 1 + (taxRate / 100);
  const grossTotal = invoiceItemsWithProducts.reduce((sum, item) => sum + item.total, 0);
  const subtotal = taxIncludedInPrice ? grossTotal : grossTotal;
  const taxAmount = taxIncludedInPrice ? 0 : (subtotal * (taxRate / 100));
  const totalAmount = taxIncludedInPrice ? grossTotal : (subtotal + taxAmount);

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

  const handleSaveInvoiceConfig = async () => {
    if (!companyConfigName.trim()) {
      toast.error("Informe o nome da empresa");
      return;
    }
    if (!companyConfigNuit.trim()) {
      toast.error("Informe o NUIT da empresa");
      return;
    }

    const invoiceSettingsPayload = {
      invoice_company_name: companyConfigName,
      invoice_nuit: companyConfigNuit,
      invoice_contacts: companyConfigContacts,
      invoice_logo: companyConfigLogo,
      invoice_stamp: companyConfigStamp,
      invoice_location: companyConfigLocation,
    };

    localStorage.setItem(INVOICE_SETTINGS_STORAGE_KEY, JSON.stringify(invoiceSettingsPayload));

    try {
      await terminalApi.update({
        settings: {
          ...(terminal?.settings || {}),
          ...invoiceSettingsPayload,
        },
      });

      queryClient.invalidateQueries({ queryKey: ["terminal"] });
      toast.success("Configuracao da fatura guardada");
    } catch (error: any) {
      toast.error(error?.message || "Nao foi possivel guardar no servidor. A configuracao ficou guardada neste dispositivo");
    }
  };

  const handleUploadInvoiceAsset = async (file: File, kind: "logo" | "stamp") => {
    try {
      const { url } = await invoicesApi.uploadAsset(file);
      if (kind === "logo") {
        setCompanyConfigLogo(url);
        setLogoUrl(url);
      } else {
        setCompanyConfigStamp(url);
      }
      toast.success(kind === "logo" ? "Logotipo enviado" : "Carimbo enviado");
    } catch (error: any) {
      toast.error(error?.message || "Nao foi possivel enviar a imagem");
    }
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
      company_location: companyConfigLocation || localInvoiceSettings.invoice_location || "",
      invoice_number: invoiceNumber,
      invoice_date: invoiceDate,
      client_name: customerName,
      client_nuit: clientNuit,
      client_address: clientAddress,
      payment_method_label: paymentMethod,
      logo_url: logoUrl || companyConfigLogo || localInvoiceSettings.invoice_logo || "",
      stamp_url: companyConfigStamp || localInvoiceSettings.invoice_stamp || "",
      tax_rate: String(taxRate),
      tax_included_in_price: taxIncludedInPrice ? "yes" : "no",
    };

    console.info("[invoice-create] terminal settings", terminal?.settings || {});
    console.info("[invoice-create] invoice meta payload", invoiceMeta);

    const nextInvoiceDefaults = {
      invoice_company_name: companyName,
      invoice_nuit: companyNuit,
      invoice_contacts: companyContacts,
      invoice_logo: logoUrl,
      invoice_stamp: companyConfigStamp,
      invoice_location: companyConfigLocation,
      invoice_last_number: invoiceNumber,
    };
    localStorage.setItem(INVOICE_SETTINGS_STORAGE_KEY, JSON.stringify(nextInvoiceDefaults));

    try {
      await terminalApi.update({
        settings: {
          ...(terminal?.settings || {}),
          ...nextInvoiceDefaults,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["terminal"] });
    } catch {
      // Se a gravacao no servidor falhar, a fatura ainda deve ser criada
      // com os dados manuais e a configuracao local mantida.
    }

    await createInvoice.mutateAsync({
      items: validItems.map((item) => ({
        product_id: item.product_id as number,
        quantity: String(item.quantity),
        // Backend de vendas trabalha com preco unitario com IVA incluso.
        unit_price: String(
          taxIncludedInPrice
            ? item.unitPrice
            : (item.unitPrice * taxFactor)
        ),
      })),
      customer_name: customerName || undefined,
      customer_phone: customerPhone || undefined,
      payment_method: paymentMethod,
      sale_type: "local",
      notes: JSON.stringify({ invoice_meta: invoiceMeta }),
    });
    setOpen(false);
  };

  const handleDownload = async (id: number, documentType: "invoice" | "receipt" = "invoice") => {
    try {
      const { blob, filename } = await invoicesApi.downloadPdf(id, undefined, documentType);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || (documentType === "receipt" ? `recibo-${id}.pdf` : `fatura-${id}.pdf`);
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(`Erro ao gerar PDF: ${e.message}`);
    }
  };

  const paidInvoices = (invoices || []).filter((inv) => inv.payment_status === "paid");
  const totalInvoices = (invoices || []).length;
  const totalPaidInvoices = paidInvoices.length;
  const totalUnpaidInvoices = Math.max(0, totalInvoices - totalPaidInvoices);
  const totalCustomers = invoiceCustomers.length;
  const customersWithNuit = invoiceCustomers.filter((c) => c.nuit).length;
  const customersWithContact = invoiceCustomers.filter((c) => c.phone).length;

  const handleSelectCustomer = (value: string) => {
    setSelectedCustomerId(value);
    if (value === "manual") {
      setCustomerName("");
      setClientNuit("");
      setClientAddress("");
      setCustomerPhone("");
      return;
    }
    const selected = invoiceCustomers.find((c) => c.id === value);
    if (!selected) return;
    setCustomerName(selected.name);
    setClientNuit(selected.nuit);
    setClientAddress(selected.address);
    setCustomerPhone(selected.phone);
  };

  const persistCustomersLocal = (nextCustomers: InvoiceCustomer[]) => {
    localStorage.setItem(INVOICE_CUSTOMERS_STORAGE_KEY, JSON.stringify(nextCustomers));
    setInvoiceCustomers(nextCustomers);
  };

  const handleRegisterCustomer = async () => {
    const normalizedName = newCustomerName.trim();
    if (!normalizedName) {
      toast.error("Informe o nome do cliente");
      return;
    }

    const duplicate = invoiceCustomers.some(
      (c) =>
        c.id !== editingCustomerId &&
        c.name.toLowerCase() === normalizedName.toLowerCase() &&
        c.phone === newCustomerPhone.trim()
    );
    if (duplicate) {
      toast.error("Cliente ja cadastrado");
      return;
    }

    if (editingCustomerId) {
      try {
        const updated = await invoiceCustomersApi.update(Number(editingCustomerId), {
          name: normalizedName,
          nuit: newCustomerNuit.trim() || undefined,
          phone: newCustomerPhone.trim() || undefined,
          address: newCustomerAddress.trim() || undefined,
        });
        const nextCustomers = invoiceCustomers.map((row) =>
          row.id === editingCustomerId
            ? {
                ...row,
                name: String(updated.name || "").trim(),
                nuit: String(updated.nuit || "").trim(),
                phone: String(updated.phone || "").trim(),
                address: String(updated.address || "").trim(),
              }
            : row
        );
        persistCustomersLocal(nextCustomers);
        queryClient.invalidateQueries({ queryKey: ["invoiceCustomers"] });
      } catch {
        const nextCustomers = invoiceCustomers.map((row) =>
          row.id === editingCustomerId
            ? {
                ...row,
                name: normalizedName,
                nuit: newCustomerNuit.trim(),
                phone: newCustomerPhone.trim(),
                address: newCustomerAddress.trim(),
              }
            : row
        );
        persistCustomersLocal(nextCustomers);
      }
      setEditingCustomerId(null);
      setNewCustomerName("");
      setNewCustomerNuit("");
      setNewCustomerPhone("");
      setNewCustomerAddress("");
      toast.success("Cliente atualizado");
      return;
    }

    try {
      const created = await invoiceCustomersApi.create({
        name: normalizedName,
        nuit: newCustomerNuit.trim() || undefined,
        phone: newCustomerPhone.trim() || undefined,
        address: newCustomerAddress.trim() || undefined,
      });
      const customer: InvoiceCustomer = {
        id: String(created.id),
        name: String(created.name || "").trim(),
        nuit: String(created.nuit || "").trim(),
        address: String(created.address || "").trim(),
        phone: String(created.phone || "").trim(),
        created_at: String(created.created_at || new Date().toISOString()),
      };
      const nextCustomers = [customer, ...invoiceCustomers];
      persistCustomersLocal(nextCustomers);
      queryClient.invalidateQueries({ queryKey: ["invoiceCustomers"] });
    } catch {
      const customer: InvoiceCustomer = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: normalizedName,
        nuit: newCustomerNuit.trim(),
        address: newCustomerAddress.trim(),
        phone: newCustomerPhone.trim(),
        created_at: new Date().toISOString(),
      };
      const nextCustomers = [customer, ...invoiceCustomers];
      persistCustomersLocal(nextCustomers);
    }
    setNewCustomerName("");
    setNewCustomerNuit("");
    setNewCustomerPhone("");
    setNewCustomerAddress("");
    setCustomerModalOpen(false);
    toast.success("Cliente cadastrado");
  };

  const handleEditCustomer = (row: InvoiceCustomer) => {
    setEditingCustomerId(row.id);
    setNewCustomerName(row.name);
    setNewCustomerNuit(row.nuit || "");
    setNewCustomerPhone(row.phone || "");
    setNewCustomerAddress(row.address || "");
    setCustomerModalOpen(true);
  };

  const handleCancelEditCustomer = () => {
    setEditingCustomerId(null);
    setNewCustomerName("");
    setNewCustomerNuit("");
    setNewCustomerPhone("");
    setNewCustomerAddress("");
    setCustomerModalOpen(false);
  };

  const handleDeleteCustomer = async (customerId: string) => {
    try {
      await invoiceCustomersApi.delete(Number(customerId));
      const nextCustomers = invoiceCustomers.filter((row) => row.id !== customerId);
      persistCustomersLocal(nextCustomers);
      queryClient.invalidateQueries({ queryKey: ["invoiceCustomers"] });
    } catch {
      const nextCustomers = invoiceCustomers.filter((row) => row.id !== customerId);
      persistCustomersLocal(nextCustomers);
    }
    if (selectedCustomerId === customerId) {
      setSelectedCustomerId("manual");
      setCustomerName("");
      setClientNuit("");
      setClientAddress("");
      setCustomerPhone("");
    }
    toast.success("Cliente apagado");
  };

  return (
    <div className={styles.root}>
      <NavDrawer
        selectedValue={invoiceView}
        open={isNavOpen}
        type={drawerType}
        className={styles.nav}
        onOpenChange={(_, data) => setIsNavOpen(data.open)}
        onNavItemSelect={(_, data) => {
          setInvoiceView(data.value as typeof invoiceView);
          if (isMobile) setIsNavOpen(false);
        }}
      >
        <NavDrawerHeader>
          <Hamburger onClick={() => setIsNavOpen((v) => !v)} />
        </NavDrawerHeader>
        <NavDrawerBody>
          <NavSectionHeader>Faturacao</NavSectionHeader>
          <NavItem value="invoices" icon={<Receipt24Regular />}>
            Faturas
          </NavItem>
          <NavItem value="clients" icon={<PeopleTeam24Regular />}>
            Clientes
          </NavItem>
          <NavItem value="receipts" icon={<Print24Regular />}>
            Recibos
          </NavItem>
          <NavItem value="settings" icon={<Settings24Regular />}>
            Configuracao
          </NavItem>
        </NavDrawerBody>
      </NavDrawer>

      <div className={styles.content + " flex flex-col h-full overflow-hidden"}>
        <div className="p-3 md:p-6 border-b border-border bg-background/80 backdrop-blur-md z-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {(isMobile || !isNavOpen) && (
                <Tooltip content="Abrir menu" relationship="label">
                  <Hamburger
                    onClick={() => setIsNavOpen(true)}
                    {...restoreFocusTargetAttributes}
                    aria-expanded={isNavOpen}
                    className="md:hidden"
                  />
                </Tooltip>
              )}
              <div className="flex items-center gap-2">
                <Receipt24Regular className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                <div>
                  <h1 className="text-lg md:text-2xl font-bold text-foreground">Faturas</h1>
                  <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
                    Gestao de faturas, recibos e clientes
                  </p>
                </div>
              </div>
            </div>
            {!isNavOpen && !isMobile && (
              <Tooltip content="Abrir menu" relationship="label">
                <Hamburger
                  onClick={() => setIsNavOpen(true)}
                  {...restoreFocusTargetAttributes}
                  aria-expanded={isNavOpen}
                />
              </Tooltip>
            )}
          </div>
        </div>

        <div className="flex-1 p-3 md:p-6 overflow-auto windows-scrollbar">
          <section className="space-y-4 min-w-0">
          {invoiceView === "settings" && (
            <SettingsPanel
              title="Empresa da fatura"
              description="Defina os dados padrao da empresa para preencher automaticamente ao criar faturas."
            >
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome da empresa</Label>
                  <Input value={companyConfigName} onChange={(e) => setCompanyConfigName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>NUIT</Label>
                  <Input value={companyConfigNuit} onChange={(e) => setCompanyConfigNuit(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Contacto</Label>
                  <Input value={companyConfigContacts} onChange={(e) => setCompanyConfigContacts(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Logotipo</Label>
                  <div className="flex items-center gap-2">
                    <Input value={companyConfigLogo} readOnly placeholder="Envie o logotipo do dispositivo" />
                    <Input
                      type="file"
                      accept="image/*"
                      className="max-w-[220px]"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleUploadInvoiceAsset(file, "logo");
                        e.currentTarget.value = "";
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Carimbo</Label>
                  <div className="flex items-center gap-2">
                    <Input value={companyConfigStamp} readOnly placeholder="Envie o carimbo do dispositivo" />
                    <Input
                      type="file"
                      accept="image/*"
                      className="max-w-[220px]"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleUploadInvoiceAsset(file, "stamp");
                        e.currentTarget.value = "";
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Morada curta da empresa</Label>
                  <Input
                    value={companyConfigLocation}
                    onChange={(e) => setCompanyConfigLocation(e.target.value)}
                    placeholder="Ex: LICHINGA-NIASSA"
                  />
                  <p className="text-xs text-muted-foreground">
                    Essa linha aparece abaixo do contacto no PDF da fatura.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={handleSaveInvoiceConfig}>Guardar configuracao</Button>
              </div>
            </SettingsPanel>
          )}

          {invoiceView === "invoices" && (
            <>
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

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-border bg-card px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Total de faturas</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{totalInvoices}</p>
                </div>
                <div className="rounded-xl border border-border bg-card px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Faturas nao pagas</p>
                  <p className="mt-1 text-2xl font-bold text-amber-600">{totalUnpaidInvoices}</p>
                </div>
                <div className="rounded-xl border border-border bg-card px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Faturas pagas</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-600">{totalPaidInvoices}</p>
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
            </>
          )}

          {invoiceView === "receipts" && (
            <>
              <div>
                <h2 className="text-base md:text-lg font-semibold text-foreground">Recibos</h2>
                <p className="text-sm text-muted-foreground">Recibos pagos, prontos para impressao.</p>
              </div>
              <div className="rounded-2xl border border-border overflow-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-secondary/50">
                    <tr className="text-left">
                      <th className="px-3 py-2">Recibo</th>
                      <th className="px-3 py-2">Data</th>
                      <th className="px-3 py-2">Cliente</th>
                      <th className="px-3 py-2">Total</th>
                      <th className="px-3 py-2">Pagamento</th>
                      <th className="px-3 py-2">Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!isLoading && paidInvoices.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-3 py-4 text-center text-muted-foreground">Nenhum recibo encontrado</td>
                      </tr>
                    )}
                    {paidInvoices.map((inv) => (
                      <tr key={inv.id} className="border-t border-border">
                        <td className="px-3 py-2 font-semibold">
                          {parseInvoiceMeta(inv.notes)?.invoice_number || `#${inv.id}`}
                        </td>
                        <td className="px-3 py-2">
                          {parseInvoiceMeta(inv.notes)?.invoice_date || new Date(inv.created_at).toLocaleString()}
                        </td>
                        <td className="px-3 py-2">{inv.customer_name || "Consumidor Final"}</td>
                        <td className="px-3 py-2">{Number(inv.total).toFixed(2)} MZN</td>
                        <td className="px-3 py-2 capitalize">{inv.payment_method}</td>
                        <td className="px-3 py-2">
                          <Button size="sm" variant="ghost" onClick={() => handleDownload(inv.id, "receipt")}>
                            PDF
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {invoiceView === "clients" && (
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base md:text-lg font-semibold text-foreground">Clientes</h2>
                  <p className="text-sm text-muted-foreground">Cadastro e consulta de clientes para faturacao rapida.</p>
                </div>
                <Button onClick={() => setCustomerModalOpen(true)} className="fluent-button fluent-button-primary">
                  <PersonAdd24Regular className="mr-2 h-4 w-4" />
                  Novo cliente
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-border bg-card px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Total de clientes</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{totalCustomers}</p>
                </div>
                <div className="rounded-xl border border-border bg-card px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Clientes com NUIT</p>
                  <p className="mt-1 text-2xl font-bold text-primary">{customersWithNuit}</p>
                </div>
                <div className="rounded-xl border border-border bg-card px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Clientes com contacto</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-600">{customersWithContact}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-border overflow-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-secondary/50">
                    <tr className="text-left">
                      <th className="px-3 py-2">Cliente</th>
                      <th className="px-3 py-2">Contacto</th>
                      <th className="px-3 py-2">NUIT</th>
                      <th className="px-3 py-2">Morada</th>
                      <th className="px-3 py-2">Ultimo cadastro</th>
                      <th className="px-3 py-2">Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!isLoading && invoiceCustomers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-3 py-4 text-center text-muted-foreground">Nenhum cliente cadastrado</td>
                      </tr>
                    )}
                    {invoiceCustomers.map((row) => (
                      <tr key={row.id} className="border-t border-border">
                        <td className="px-3 py-2 font-medium">{row.name}</td>
                        <td className="px-3 py-2">{row.phone || "-"}</td>
                        <td className="px-3 py-2">{row.nuit || "-"}</td>
                        <td className="px-3 py-2">{row.address || "-"}</td>
                        <td className="px-3 py-2">{new Date(row.created_at).toLocaleDateString()}</td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditCustomer(row)}>
                              Editar
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => void handleDeleteCustomer(row.id)}>
                              Apagar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
      </div>

      <Dialog open={customerModalOpen} onOpenChange={(open) => {
        setCustomerModalOpen(open);
        if (!open) handleCancelEditCustomer();
      }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingCustomerId ? "Editar cliente" : "Cadastrar cliente"}</DialogTitle>
            <DialogDescription>
              Os dados do cliente serao usados para preencher automaticamente ao criar fatura.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Nome</Label>
              <Input value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} placeholder="Nome do cliente" />
            </div>
            <div className="space-y-2">
              <Label>NUIT</Label>
              <Input value={newCustomerNuit} onChange={(e) => setNewCustomerNuit(e.target.value)} placeholder="Opcional" />
            </div>
            <div className="space-y-2">
              <Label>Contacto</Label>
              <Input value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} placeholder="Ex: 2588..." />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Morada</Label>
              <Input value={newCustomerAddress} onChange={(e) => setNewCustomerAddress(e.target.value)} placeholder="Morada" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCancelEditCustomer}>Cancelar</Button>
            <Button onClick={() => void handleRegisterCustomer()}>
              {editingCustomerId ? "Salvar edicao" : "Cadastrar cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                <div className="space-y-2">
                  <Label>Carimbo (URL)</Label>
                  <Input value={companyConfigStamp} readOnly placeholder="Link do carimbo padrao" />
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
                  <Select value={selectedCustomerId} onValueChange={handleSelectCustomer}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Preencher manualmente</SelectItem>
                      {invoiceCustomers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>NUIT do cliente</Label>
                  <Input
                    value={clientNuit}
                    onChange={(e) => setClientNuit(e.target.value)}
                    placeholder="Opcional"
                    readOnly={selectedCustomerId !== "manual"}
                  />
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <Label>Morada do cliente</Label>
                  <Input
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    placeholder="Morada"
                    readOnly={selectedCustomerId !== "manual"}
                  />
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <Label>Contactos do cliente</Label>
                  <Input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Ex: 2588..."
                    readOnly={selectedCustomerId !== "manual"}
                  />
                </div>
                {selectedCustomerId === "manual" && (
                  <div className="space-y-2 lg:col-span-2">
                    <Label>Nome do cliente</Label>
                    <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nome do cliente" />
                  </div>
                )}
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
                <div className="space-y-2 lg:col-span-2">
                  <Label>Modo de IVA</Label>
                  <div className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
                    <span className="text-sm text-muted-foreground">Nao incluso</span>
                    <Switch
                      checked={taxIncludedInPrice}
                      onCheckedChange={setTaxIncludedInPrice}
                    />
                    <span className="text-sm font-medium text-foreground">Incluso no preco</span>
                  </div>
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
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {taxIncludedInPrice ? "Subtotal" : "Subtotal"}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{subtotal.toFixed(2)} MZN</p>
                </div>
                <div className="rounded-xl border border-border bg-background px-3 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {taxIncludedInPrice ? "IVA Incluso" : `IVA (${taxRate.toFixed(0)}%)`}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {taxIncludedInPrice ? "" : `${taxAmount.toFixed(2)} MZN`}
                  </p>
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


