import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  PeopleTeam24Regular,
  Add24Regular,
  Checkmark24Regular,
  Edit24Regular,
  Delete24Regular,
  Money24Regular,
  Phone24Regular,
  Calendar24Regular,
  Person24Regular,
  Eye24Regular,
  Print24Regular,
} from "@fluentui/react-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  useAccount,
  useAccounts,
  useCloseAccount,
  useCreateAccount,
  useDeleteAccount,
  useUpdateAccount,
} from "@/hooks/useAccounts";
import { useHardwarePlugin } from "@/hooks/useHardwarePlugin";
import { formatAccountReceipt } from "@/lib/receiptFormat";
import { Account, CreateAccount, PaymentMethod, terminalApi } from "@/services/api";
import { toast } from "sonner";

export function TabsScreen() {
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">("all");
  const [selectedAccountId, setSelectedAccountId] = useState<number | undefined>(undefined);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [accountForm, setAccountForm] = useState<CreateAccount>({ client_name: "", client_phone: "" });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");

  const { data: accounts = [], isLoading, refetch } = useAccounts(statusFilter);
  const { data: selectedAccount } = useAccount(selectedAccountId);
  const { data: terminal } = useQuery({
    queryKey: ["terminal"],
    queryFn: terminalApi.get,
  });
  const { printReceipt } = useHardwarePlugin();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const closeAccount = useCloseAccount();
  const deleteAccount = useDeleteAccount();

  const openAccounts = accounts.filter((account) => account.status === "open");
  const openBalance = openAccounts.reduce((sum, account) => sum + Number(account.current_balance), 0);

  const formatCurrency = (value: string | number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "MZN" }).format(Number(value || 0));

  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    return new Date(value).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const resetForm = () => setAccountForm({ client_name: "", client_phone: "" });

  const handleCreate = async () => {
    if (!accountForm.client_name?.trim()) {
      toast.error("Nome do cliente e obrigatorio");
      return;
    }
    await createAccount.mutateAsync(accountForm);
    setIsCreateModalOpen(false);
    resetForm();
    refetch();
  };

  const handleEdit = async () => {
    if (!selectedAccountId || !accountForm.client_name?.trim()) return;
    await updateAccount.mutateAsync({
      id: selectedAccountId,
      data: {
        client_name: accountForm.client_name,
        client_phone: accountForm.client_phone,
        notes: accountForm.notes,
      },
    });
    setIsEditModalOpen(false);
    resetForm();
    refetch();
  };

  const handleDelete = async (accountId: number) => {
    await deleteAccount.mutateAsync(accountId);
    if (selectedAccountId === accountId) {
      setSelectedAccountId(undefined);
      setIsDetailModalOpen(false);
    }
    refetch();
  };

  const handleClose = async () => {
    if (!selectedAccountId) return;
    const closedAccount = await closeAccount.mutateAsync({ id: selectedAccountId, payment_method: paymentMethod });
    try {
      const receiptContent = formatAccountReceipt(closedAccount, {
        terminal,
        paymentMethod,
      });
      await printReceipt(receiptContent);
    } catch (error) {
      console.error("Erro ao imprimir recibo da conta:", error);
    }
    setIsCloseModalOpen(false);
    setPaymentMethod("cash");
    refetch();
  };

  const handlePrintAccount = async (account: Account) => {
    try {
      const receiptContent = formatAccountReceipt(account, {
        terminal,
        paymentMethod: account.status === "closed" ? undefined : paymentMethod,
      });
      await printReceipt(receiptContent);
    } catch (error) {
      console.error("Erro ao imprimir conta:", error);
    }
  };

  const openDetail = (account: Account) => {
    setSelectedAccountId(account.id);
    setIsDetailModalOpen(true);
  };

  const openEdit = (account: Account) => {
    setSelectedAccountId(account.id);
    setAccountForm({
      client_name: account.client_name,
      client_phone: account.client_phone || "",
      notes: account.notes || "",
    });
    setIsEditModalOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      <div className="p-3 md:p-6 border-b border-border bg-background/80 backdrop-blur-md z-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary flex items-center justify-center text-white">
              <PeopleTeam24Regular className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-foreground">Contas</h1>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
                Contas abertas e fechadas persistidas no backend do SkyPDV
              </p>
            </div>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 px-3 h-9 md:h-10">
            <Add24Regular className="w-5 h-5" />
            <span className="hidden sm:inline">Nova Conta</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 p-3 md:p-6 overflow-auto windows-scrollbar">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="fluent-card p-3 md:p-4 bg-primary/5 border-l-4 border-l-primary">
            <p className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase">Saldo em Aberto</p>
            <p className="text-sm md:text-xl font-bold text-primary">{formatCurrency(openBalance)}</p>
          </div>
          <div className="fluent-card p-3 md:p-4 bg-emerald-500/5 border-l-4 border-l-emerald-500">
            <p className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase">Contas Abertas</p>
            <p className="text-sm md:text-xl font-bold text-emerald-600">{openAccounts.length}</p>
          </div>
          <div className="fluent-card p-3 md:p-4 bg-secondary/50 border-l-4 border-l-muted-foreground hidden sm:block">
            <p className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase">Total de Contas</p>
            <p className="text-sm md:text-xl font-bold text-foreground">{accounts.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <Select value={statusFilter} onValueChange={(v: "all" | "open" | "closed") => setStatusFilter(v)}>
            <SelectTrigger className="w-[160px] md:w-[190px] h-9 md:h-10 text-xs md:text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="open">Abertas</SelectItem>
              <SelectItem value="closed">Fechadas</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-[10px] md:text-sm text-muted-foreground">
            {accounts.length} encontrada{accounts.length !== 1 ? "s" : ""}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">Carregando contas...</div>
            </div>
          ) : accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <PeopleTeam24Regular className="w-16 h-16 mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma conta encontrada</h3>
              <p className="text-muted-foreground mb-4">Crie uma conta para guardar vendas pendentes no backend.</p>
              <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
                <Add24Regular className="w-4 h-4" />
                Criar Conta
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className={`fluent-card p-3 md:p-4 hover:shadow-md transition-shadow flex flex-col ${
                    account.status === "open" ? "border-l-4 border-l-success" : "border-l-4 border-l-muted-foreground"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2 md:mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm md:text-lg mb-0.5 md:mb-1 truncate">{account.client_name}</h3>
                      {account.client_phone && (
                        <div className="flex items-center gap-1 text-[10px] md:text-sm text-muted-foreground">
                          <Phone24Regular className="w-3 h-3 md:w-4 md:h-4" />
                          {account.client_phone}
                        </div>
                      )}
                    </div>
                    <Badge
                      variant={account.status === "open" ? "default" : "secondary"}
                      className={account.status === "open" ? "bg-success text-white" : "bg-muted-foreground text-white"}
                    >
                      {account.status === "open" ? "Aberta" : "Fechada"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3 md:mb-4 bg-secondary/30 p-2 rounded-lg text-xs">
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Money24Regular className="w-3 h-3" />
                        Saldo
                      </p>
                      <p className="font-bold text-base md:text-lg text-primary">{formatCurrency(account.current_balance)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Person24Regular className="w-3 h-3" />
                        Caixa
                      </p>
                      <p className="font-medium truncate">{account.opened_by_name || "Sem nome"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Calendar24Regular className="w-3 h-3" />
                        Abertura
                      </p>
                      <p className="font-medium">{formatDate(account.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Produtos</p>
                      <p className="font-medium">{account.items.length}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-auto">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => openDetail(account)}>
                      <Eye24Regular className="w-4 h-4" />
                      Ver
                    </Button>
                    {account.status === "open" ? (
                      <Button size="sm" className="gap-2" onClick={() => { setSelectedAccountId(account.id); setIsCloseModalOpen(true); }}>
                        <Checkmark24Regular className="w-4 h-4" />
                        Fechar
                      </Button>
                    ) : (
                      <Button variant="secondary" size="sm" disabled>
                        Fechada
                      </Button>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="gap-2 mt-2" onClick={() => handlePrintAccount(account)}>
                    <Print24Regular className="w-4 h-4" />
                    Imprimir
                  </Button>
                  {account.status === "open" && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Button variant="ghost" size="sm" className="gap-2" onClick={() => openEdit(account)}>
                        <Edit24Regular className="w-4 h-4" />
                        Editar
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-2 text-destructive" onClick={() => handleDelete(account.id)}>
                        <Delete24Regular className="w-4 h-4" />
                        Excluir
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Conta</DialogTitle>
            <DialogDescription>Abra uma conta no backend do SkyPDV para acumular produtos antes de fechar a venda.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create_client_name">Nome do Cliente *</Label>
              <Input
                id="create_client_name"
                value={accountForm.client_name}
                onChange={(e) => setAccountForm((prev) => ({ ...prev, client_name: e.target.value }))}
                placeholder="Ex: Joao Silva"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create_client_phone">Telefone</Label>
              <Input
                id="create_client_phone"
                value={accountForm.client_phone || ""}
                onChange={(e) => setAccountForm((prev) => ({ ...prev, client_phone: e.target.value }))}
                placeholder="84..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createAccount.isPending}>
              {createAccount.isPending ? "Criando..." : "Criar Conta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Conta</DialogTitle>
            <DialogDescription>Atualize os dados do cliente antes do fechamento.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_client_name">Nome do Cliente *</Label>
              <Input
                id="edit_client_name"
                value={accountForm.client_name}
                onChange={(e) => setAccountForm((prev) => ({ ...prev, client_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_client_phone">Telefone</Label>
              <Input
                id="edit_client_phone"
                value={accountForm.client_phone || ""}
                onChange={(e) => setAccountForm((prev) => ({ ...prev, client_phone: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleEdit} disabled={updateAccount.isPending}>
              {updateAccount.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCloseModalOpen} onOpenChange={setIsCloseModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fechar Conta</DialogTitle>
            <DialogDescription>
              O fechamento cria uma venda real no SkyPDV com os produtos desta conta.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="payment_method">Metodo de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="mpesa">M-pesa</SelectItem>
                  <SelectItem value="skywallet">E-Mola</SelectItem>
                  <SelectItem value="card">BCI POS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCloseModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleClose} disabled={closeAccount.isPending}>
              {closeAccount.isPending ? "Fechando..." : "Fechar Conta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Detalhes da Conta</DialogTitle>
            <DialogDescription>Veja o caixa que abriu, os produtos consumidos e o estado atual da conta.</DialogDescription>
          </DialogHeader>
          {selectedAccount ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-muted-foreground">Cliente</p>
                  <p className="font-semibold">{selectedAccount.client_name}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-muted-foreground">Caixa que abriu</p>
                  <p className="font-semibold">{selectedAccount.opened_by_name || "Sem nome"}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-muted-foreground">Abertura</p>
                  <p className="font-semibold">{formatDate(selectedAccount.created_at)}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-muted-foreground">Fechamento</p>
                  <p className="font-semibold">{formatDate(selectedAccount.closed_at)}</p>
                </div>
              </div>

              <div className="rounded-xl border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border font-semibold">Produtos da Conta</div>
                {selectedAccount.items.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">Nenhum produto adicionado.</div>
                ) : (
                  <div className="divide-y divide-border">
                    {selectedAccount.items.map((item) => (
                      <div key={item.id} className="px-4 py-3 flex items-center justify-between gap-3 text-sm">
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-muted-foreground">
                            {item.quantity} x {formatCurrency(item.unit_price)}
                          </p>
                        </div>
                        <div className="font-semibold">{formatCurrency(item.subtotal)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between rounded-lg bg-muted/30 p-4">
                <span className="text-muted-foreground">Total da Conta</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(selectedAccount.current_balance)}</span>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" className="gap-2" onClick={() => handlePrintAccount(selectedAccount)}>
                  <Print24Regular className="w-4 h-4" />
                  Imprimir Conta
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-6 text-muted-foreground">Carregando detalhes...</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
