import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Copy, LogOut, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Login } from "@/components/Login";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiError } from "@/services/api";
import {
  createManagerInvoice,
  getManagerBillingOptions,
  getManagerOverview,
  listManagerTerminals,
  markManagerInvoicePaid,
  updateManagerTerminal,
  type ManagerBillingOptions,
  type ManagerInvoice,
  type ManagerOverview,
  type ManagerTerminal,
} from "@/services/managerApi";

type Access = "checking" | "login" | "denied" | "ready";
type SubFilter = "all" | "trial" | "active" | "suspended";

const PAGE_SIZE = 50;

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-MZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusClass(status: string) {
  if (status === "active") return "text-emerald-700";
  if (status === "suspended") return "text-destructive";
  if (status === "trial") return "text-amber-700";
  return "text-muted-foreground";
}

export default function ManagerPage() {
  const { user, token, isAuthenticated, isLoading, logout, loginWithBlueSpark } = useAuth();
  const [access, setAccess] = useState<Access>("checking");
  const [overview, setOverview] = useState<ManagerOverview | null>(null);
  const [items, setItems] = useState<ManagerTerminal[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [subFilter, setSubFilter] = useState<SubFilter>("all");
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [billingOptions, setBillingOptions] = useState<ManagerBillingOptions | null>(null);
  const [invoiceTerminal, setInvoiceTerminal] = useState<ManagerTerminal | null>(null);
  const [invoicePlan, setInvoicePlan] = useState<"basic" | "pro">("basic");
  const [invoiceMonths, setInvoiceMonths] = useState(1);
  const [invoiceBusy, setInvoiceBusy] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<ManagerInvoice | null>(null);

  const loadData = useCallback(
    async (overrides: { q?: string; subFilter?: SubFilter; offset?: number } = {}) => {
      const nextQ = overrides.q ?? q;
      const nextSub = overrides.subFilter ?? subFilter;
      const nextOffset = overrides.offset ?? offset;
      setLoading(true);
      setError(null);
      try {
        const [nextOverview, page] = await Promise.all([
          getManagerOverview(),
          listManagerTerminals({
            q: nextQ,
            subscription_status: nextSub === "all" ? undefined : nextSub,
            limit: PAGE_SIZE,
            offset: nextOffset,
          }),
        ]);
        setOverview(nextOverview);
        setItems(page.items);
        setTotal(page.total);
        setOffset(page.offset);
        setAccess("ready");
      } catch (cause) {
        if (cause instanceof ApiError && (cause.status === 401 || cause.status === 403)) {
          setAccess("denied");
          return;
        }
        setError(cause instanceof Error ? cause.message : "Falha ao carregar");
        setAccess("ready");
      } finally {
        setLoading(false);
      }
    },
    [offset, q, subFilter],
  );

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !token) {
      setAccess("login");
      return;
    }
    setAccess("checking");
    void loadData({ offset: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isLoading, token]);

  async function setSubscription(terminal: ManagerTerminal, subscription_status: string) {
    setBusyId(terminal.id);
    try {
      const updated = await updateManagerTerminal(terminal.id, { subscription_status });
      setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      await loadData();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao atualizar");
    } finally {
      setBusyId(null);
    }
  }

  async function openInvoice(terminal: ManagerTerminal) {
    setInvoiceTerminal(terminal);
    setLastInvoice(null);
    setInvoicePlan("basic");
    setInvoiceMonths(1);
    try {
      if (!billingOptions) {
        setBillingOptions(await getManagerBillingOptions());
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao carregar opções de cobrança");
    }
  }

  async function createInvoice() {
    if (!invoiceTerminal) return;
    setInvoiceBusy(true);
    setError(null);
    try {
      const invoice = await createManagerInvoice(invoiceTerminal.id, {
        plan: invoicePlan,
        months: invoiceMonths,
      });
      setLastInvoice(invoice);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao criar fatura");
    } finally {
      setInvoiceBusy(false);
    }
  }

  async function confirmTransferPaid() {
    if (!lastInvoice) return;
    setInvoiceBusy(true);
    try {
      const paid = await markManagerInvoicePaid(lastInvoice.id, "Transferência M-Pesa confirmada no manager");
      setLastInvoice(paid);
      await loadData();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao marcar pago");
    } finally {
      setInvoiceBusy(false);
    }
  }

  function copyText(value: string) {
    void navigator.clipboard?.writeText(value);
  }

  if (access === "checking" || isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <span className="size-7 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  if (access === "login") {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-md px-4 pt-8 text-center">
          <p className="mb-4 text-sm text-muted-foreground">
            Manager SkyPDV — entre com a conta admin BlueSpark.
          </p>
          <Button className="mb-6 w-full" onClick={() => loginWithBlueSpark("/manager")}>
            Entrar com Google / BlueSpark
          </Button>
        </div>
        <Login />
      </div>
    );
  }

  if (access === "denied") {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center">
          <ShieldCheck className="mx-auto size-10 text-primary" />
          <h1 className="mt-4 text-2xl font-bold">Acesso restrito</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Só o admin da plataforma BlueSpark pode gerir o SkyPDV.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/">Voltar</Link>
            </Button>
            <Button
              onClick={() => {
                logout();
                setAccess("login");
              }}
            >
              Trocar conta
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const pageStart = total === 0 ? 0 : offset + 1;
  const pageEnd = Math.min(offset + items.length, total);

  return (
    <div className="min-h-screen bg-[#F7F6FB]">
      <header className="border-b border-border/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-4 sm:px-6">
          <Link to="/" className="text-lg font-bold text-primary">
            SkyPDV
          </Link>
          <span className="hidden text-sm text-muted-foreground sm:inline">/ Manager</span>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{user?.user?.name || user?.user?.email}</p>
              <p className="text-xs text-muted-foreground">admin plataforma</p>
            </div>
            <Button variant="outline" size="sm" disabled={loading} onClick={() => void loadData()}>
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sair"
              onClick={() => {
                logout();
                setAccess("login");
              }}
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Terminais SkyPDV</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Gestão de plataforma: faturação SkyWallet / transferência. Por agora a loja não é desligada por falta de pagamento.
          </p>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border/70 bg-white px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Terminais</p>
            <p className="mt-2 text-3xl font-bold">{overview?.total_terminals ?? "—"}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-white px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Activos</p>
            <p className="mt-2 text-3xl font-bold">{overview?.active_terminals ?? "—"}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-white px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Trial</p>
            <p className="mt-2 text-3xl font-bold">{overview?.trial ?? "—"}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-white px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Suspensos</p>
            <p className="mt-2 text-3xl font-bold">{overview?.suspended ?? "—"}</p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-border/70 bg-white">
          <div className="flex flex-col gap-3 border-b border-border/70 p-4 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                value={q}
                onChange={(event) => setQ(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    setOffset(0);
                    void loadData({ q, offset: 0 });
                  }
                }}
                placeholder="Pesquisar loja, email, username ou telefone"
              />
            </div>
            <select
              aria-label="Assinatura"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={subFilter}
              onChange={(event) => {
                const next = event.target.value as SubFilter;
                setSubFilter(next);
                setOffset(0);
                void loadData({ subFilter: next, offset: 0 });
              }}
            >
              <option value="all">Todas assinaturas</option>
              <option value="trial">Trial</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
            <Button
              variant="outline"
              onClick={() => {
                setOffset(0);
                void loadData({ offset: 0 });
              }}
            >
              Filtrar
            </Button>
          </div>

          {error ? (
            <p className="border-b border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-border/70 bg-[#F7F6FB] text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Terminal</th>
                  <th className="px-4 py-3 font-medium">Dono</th>
                  <th className="px-4 py-3 font-medium">Assinatura</th>
                  <th className="px-4 py-3 font-medium">Equipa / Vendas</th>
                  <th className="px-4 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                      {loading ? "A carregar…" : "Nenhum terminal encontrado."}
                    </td>
                  </tr>
                ) : (
                  items.map((terminal) => (
                    <tr key={terminal.id} className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-4 align-top">
                        <p className="font-semibold">{terminal.name}</p>
                        <p className="text-xs text-muted-foreground">
                          #{terminal.id} · desde {formatDate(terminal.created_at)}
                        </p>
                        <p className={terminal.active ? "text-xs text-emerald-700" : "text-xs text-muted-foreground"}>
                          {terminal.active ? "Loja activa" : "Loja inactiva"}
                        </p>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <p className="font-medium">{terminal.owner.name || terminal.owner.username}</p>
                        <p className="text-xs text-muted-foreground">{terminal.owner.email}</p>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <p className={`font-medium capitalize ${statusClass(terminal.subscription_status)}`}>
                          {terminal.subscription_status}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Próx. cobrança: {formatDate(terminal.next_billing_date)}
                        </p>
                      </td>
                      <td className="px-4 py-4 align-top text-muted-foreground">
                        {terminal.staff_count} · {terminal.sales_count}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-wrap gap-1.5">
                          <Button
                            size="sm"
                            disabled={busyId === terminal.id}
                            onClick={() => void openInvoice(terminal)}
                          >
                            Cobrar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busyId === terminal.id}
                            onClick={() => void setSubscription(terminal, "active")}
                          >
                            Activar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border/70 px-4 py-3 text-sm text-muted-foreground">
            <p>
              {pageStart}–{pageEnd} de {total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={offset <= 0 || loading}
                onClick={() => {
                  const next = Math.max(0, offset - PAGE_SIZE);
                  setOffset(next);
                  void loadData({ offset: next });
                }}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={offset + PAGE_SIZE >= total || loading}
                onClick={() => {
                  const next = offset + PAGE_SIZE;
                  setOffset(next);
                  void loadData({ offset: next });
                }}
              >
                Seguinte
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Dialog
        open={!!invoiceTerminal}
        onOpenChange={(open) => {
          if (!open) {
            setInvoiceTerminal(null);
            setLastInvoice(null);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Cobrar {invoiceTerminal?.name}</DialogTitle>
            <DialogDescription>
              Cria fatura + link SkyWallet para {invoiceTerminal?.owner.email}. Quando pagar, a assinatura activa.
            </DialogDescription>
          </DialogHeader>

          {!lastInvoice ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">Plano</span>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3"
                    value={invoicePlan}
                    onChange={(event) => setInvoicePlan(event.target.value as "basic" | "pro")}
                  >
                    <option value="basic">
                      Básico ({billingOptions?.plans.basic.amount_mzn ?? 1300} MZN)
                    </option>
                    <option value="pro">
                      Pro ({billingOptions?.plans.pro.amount_mzn ?? 1950} MZN)
                    </option>
                  </select>
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">Meses</span>
                  <Input
                    type="number"
                    min={1}
                    max={24}
                    value={invoiceMonths}
                    onChange={(event) => setInvoiceMonths(Math.max(1, Number(event.target.value) || 1))}
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                Alternativa: transferência para {(billingOptions?.transfer.numbers || ["860716912", "852411827"]).join(" · ")}
              </p>
              <Button className="w-full" disabled={invoiceBusy} onClick={() => void createInvoice()}>
                {invoiceBusy ? "A criar link…" : "Criar link de cobrança"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 text-sm">
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <p className="font-semibold capitalize">
                  Fatura {lastInvoice.plan} · {lastInvoice.months} mês(es)
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {lastInvoice.amount} {lastInvoice.currency}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Ref: {lastInvoice.order_id}</p>
                <p className="mt-1 text-xs capitalize text-muted-foreground">Estado: {lastInvoice.status}</p>
              </div>

              <div className="space-y-2">
                <p className="font-medium">Link de pagamento</p>
                <div className="flex gap-2">
                  <Input readOnly value={lastInvoice.payment_url || ""} />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copyText(lastInvoice.payment_url || "")}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
                {lastInvoice.payment_url ? (
                  <Button className="w-full" asChild>
                    <a href={lastInvoice.payment_url} target="_blank" rel="noreferrer">
                      Abrir link
                    </a>
                  </Button>
                ) : null}
              </div>

              <div className="rounded-xl border border-border p-4">
                <p className="font-medium">Ou transferência M-Pesa</p>
                <div className="mt-2 space-y-1">
                  {(lastInvoice.transfer?.numbers || ["860716912", "852411827"]).map((number) => (
                    <button
                      key={number}
                      type="button"
                      className="flex w-full items-center justify-between rounded-lg bg-muted/50 px-3 py-2 font-mono text-sm hover:bg-muted"
                      onClick={() => copyText(number)}
                    >
                      {number}
                      <Copy className="size-3.5 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>

              {lastInvoice.status === "paid" ? (
                <p className="text-center font-medium text-emerald-700">Pago — assinatura activada.</p>
              ) : (
                <Button variant="outline" className="w-full" disabled={invoiceBusy} onClick={() => void confirmTransferPaid()}>
                  {invoiceBusy ? "A confirmar…" : "Marcar transferência como paga"}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
