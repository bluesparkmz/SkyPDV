import { useEffect, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
  useAccount,
  useAccounts,
  useCloseAccount,
  useCreateAccount,
  useDeleteAccount,
  useUpdateAccount,
} from "@/hooks/useAccounts";
import { useHardwarePlugin } from "@/hooks/useHardwarePlugin";
import { formatAccountReceipt, formatAccountItemsReceipt, formatKitchenTicket } from "@/lib/receiptFormat";
import { Account, CreateAccount, PaymentMethod, terminalApi } from "@/services/api";
import { toast } from "sonner";

export function TabsScreen() {
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<number | undefined>(undefined);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [accountForm, setAccountForm] = useState<CreateAccount>({ client_name: "", client_phone: "" });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [changeStatus, setChangeStatus] = useState<"given" | "not_given">("given");
  const [selectedKitchenItems, setSelectedKitchenItems] = useState<number[]>([]);
  const [kitchenSentByAccount, setKitchenSentByAccount] = useState<Record<number, number[]>>({});
  const [kitchenTicketCountByAccount, setKitchenTicketCountByAccount] = useState<Record<number, number>>({});

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
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredAccounts = accounts.filter((account) => {
    if (!normalizedSearch) return true;
    const parts = [
      account.client_name,
      account.client_phone || "",
      account.opened_by_name || "",
    ].join(" ").toLowerCase();
    return parts.includes(normalizedSearch);
  });
  const openBalance = openAccounts.reduce((sum, account) => sum + Number(account.current_balance), 0);
  const closeChangeAmount = Math.max(
    0,
    Number(amountPaid || 0) - Number(selectedAccount?.current_balance || 0)
  );

  useEffect(() => {
    if (closeChangeAmount <= 0 && changeStatus !== "given") {
      setChangeStatus("given");
    }
  }, [closeChangeAmount, changeStatus]);

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
    const total = selectedAccount?.current_balance ? Number(selectedAccount.current_balance) : 0;
    const paid = Number(amountPaid || 0);
    if (!paid || paid < total) {
      toast.error("Valor entregue deve ser igual ou maior que o total.");
      return;
    }
    const closedAccount = await closeAccount.mutateAsync({ id: selectedAccountId, payment_method: paymentMethod, amount_paid: amountPaid, change_status: changeStatus });
    try {
      const receiptContent = formatAccountReceipt(closedAccount, {
        terminal,
        paymentMethod,
        amountPaid: paid,
      });
      await printReceipt(receiptContent);
    } catch (error) {
      console.error("Erro ao imprimir recibo da conta:", error);
    }
    setIsCloseModalOpen(false);
    setPaymentMethod("cash");
    setAmountPaid("");
    setChangeStatus("given");
    refetch();
  };

  const handlePrintAccount = async (account: Account) => {
    try {
      const receiptContent =
        account.status === "open"
          ? formatAccountItemsReceipt(account, { terminal })
          : formatAccountReceipt(account, { terminal, paymentMethod });
      await printReceipt(receiptContent);
    } catch (error) {
      console.error("Erro ao imprimir conta:", error);
    }
  };

  const handlePrintKitchen = async () => {
    if (!selectedAccount) return;
    const alreadySent = kitchenSentByAccount[selectedAccount.id] || [];
    const selectedItems = selectedAccount.items.filter(
      (item) => selectedKitchenItems.includes(item.id) && !alreadySent.includes(item.id)
    );
    if (selectedItems.length === 0) {
      toast.error("Selecione os itens para enviar a cozinha.");
      return;
    }
    try {
      const nextTicketNumber = (kitchenTicketCountByAccount[selectedAccount.id] || 0) + 1;
      const receiptContent = formatKitchenTicket(selectedAccount, selectedItems, { terminal, ticketNumber: nextTicketNumber });
      await printReceipt(receiptContent);
      setKitchenSentByAccount((prev) => ({
        ...prev,
        [selectedAccount.id]: Array.from(new Set([...(prev[selectedAccount.id] || []), ...selectedItems.map((i) => i.id)])),
      }));
      setKitchenTicketCountByAccount((prev) => ({
        ...prev,
        [selectedAccount.id]: nextTicketNumber,
      }));
      setSelectedKitchenItems([]);
    } catch (error) {
      console.error("Erro ao imprimir cozinha:", error);
    }
  };

  const handlePrintSingleKitchen = async (itemId: number) => {
    if (!selectedAccount) return;
    const alreadySent = kitchenSentByAccount[selectedAccount.id] || [];
    if (alreadySent.includes(itemId)) return;
    const item = selectedAccount.items.find((i) => i.id === itemId);
    if (!item) return;
    try {
      const nextTicketNumber = (kitchenTicketCountByAccount[selectedAccount.id] || 0) + 1;
      const receiptContent = formatKitchenTicket(selectedAccount, [item], { terminal, ticketNumber: nextTicketNumber });
      await printReceipt(receiptContent);
      setKitchenSentByAccount((prev) => ({
        ...prev,
        [selectedAccount.id]: Array.from(new Set([...(prev[selectedAccount.id] || []), itemId])),
      }));
      setKitchenTicketCountByAccount((prev) => ({
        ...prev,
        [selectedAccount.id]: nextTicketNumber,
      }));
    } catch (error) {
      console.error("Erro ao imprimir cozinha:", error);
    }
  };

  const openDetail = (account: Account) => {
    setSelectedAccountId(account.id);
    setSelectedKitchenItems([]);
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
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar conta..."
            className="w-[200px] md:w-[260px] h-9 md:h-10 text-xs md:text-sm"
          />
          <div className="text-[10px] md:text-sm text-muted-foreground">
            {filteredAccounts.length} encontrada{filteredAccounts.length !== 1 ? "s" : ""}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">Carregando contas...</div>
            </div>
          ) : filteredAccounts.length === 0 ? (
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2">
              {filteredAccounts.map((account) => (
                <div
                  key={account.id}
                  className={`fluent-card p-2 hover:shadow-md transition-shadow flex flex-col ${
                    account.status === "open" ? "border-l-4 border-l-success" : "border-l-4 border-l-muted-foreground"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm mb-0.5 truncate">{account.client_name}</h3>
                      {account.client_phone && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Phone24Regular className="w-3 h-3" />
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

                  <div className="grid grid-cols-2 gap-1 mb-2 bg-secondary/30 p-2 rounded-lg text-[10px]">
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Money24Regular className="w-3 h-3" />
                        Saldo
                      </p>
                      <p className="font-bold text-sm text-primary">{formatCurrency(account.current_balance)}</p>
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
                    {account.status === "closed" && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Troco</p>
                        <p
                          className={`font-medium ${
                            account.change_status === "given" ? "text-emerald-600" : "text-amber-600"
                          }`}
                        >
                          {account.change_status === "given" ? "Entregue" : "Pendente"}
                        </p>
                      </div>
                    )}
                    {account.status === "closed" && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Troco</p>
                        <p className="font-medium">
                          {account.change_status === "given" ? "Entregue" : "Nao entregue"}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-1 mt-auto">
                    <Button variant="outline" size="sm" className="gap-1 text-[10px] h-7" onClick={() => openDetail(account)}>
                      <Eye24Regular className="w-4 h-4" />
                      Ver
                    </Button>
                    {account.status === "open" ? (
                      <Button
                        size="sm"
                        className="gap-1 text-[10px] h-7"
                        onClick={() => {
                          setSelectedAccountId(account.id);
                          setChangeStatus("given");
                          setIsCloseModalOpen(true);
                        }}
                      >
                        <Checkmark24Regular className="w-4 h-4" />
                        Fechar
                      </Button>
                    ) : (
                      <Button variant="secondary" size="sm" disabled className="text-[10px] h-7">
                        Fechada
                      </Button>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="gap-1 mt-1 text-[10px] h-7" onClick={() => handlePrintAccount(account)}>
                    <Print24Regular className="w-4 h-4" />
                    Imprimir
                  </Button>
                  {account.status === "open" && (
                    <div className="grid grid-cols-2 gap-1 mt-1">
                      <Button variant="ghost" size="sm" className="gap-1 text-[10px] h-7" onClick={() => openEdit(account)}>
                        <Edit24Regular className="w-4 h-4" />
                        Editar
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-1 text-[10px] h-7 text-destructive" onClick={() => handleDelete(account.id)}>
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
                  <SelectItem value="emola">E-Mola</SelectItem>
                  <SelectItem value="bci_pos">BCI POS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {closeChangeAmount > 0 && (
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <div>
                  <Label htmlFor="change_status">Troco nao entregue</Label>
                  <p className="text-xs text-muted-foreground">Ative se nao entregou o troco</p>
                </div>
                <Switch
                  id="change_status"
                  checked={changeStatus === "not_given"}
                  onCheckedChange={(checked) => setChangeStatus(checked ? "not_given" : "given")}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="amount_paid">Valor Entregue</Label>
              <Input
                id="amount_paid"
                type="number"
                step="0.01"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="0.00"
              />
              <div className="text-xs text-muted-foreground">
                Troco: {closeChangeAmount.toFixed(2)} MT
              </div>
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
                {selectedAccount.status === "closed" && (
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-muted-foreground">Estado do Troco</p>
                    <p className="font-semibold">
                      {selectedAccount.change_status === "given" ? "Entregue" : "Nao entregue"}
                    </p>
                  </div>
                )}
                {selectedAccount.status === "closed" && (
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-muted-foreground">Valor Entregue</p>
                    <p className="font-semibold">{formatCurrency(selectedAccount.amount_paid)}</p>
                  </div>
                )}
                {selectedAccount.status === "closed" && (
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-muted-foreground">Troco</p>
                    <p className="font-semibold">{formatCurrency(selectedAccount.change_amount)}</p>
                  </div>
                )}
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
                        <div className="flex items-center gap-2">
                          {(kitchenSentByAccount[selectedAccount.id] || []).includes(item.id) ? (
                            <span className="text-xs text-emerald-600 font-semibold">Enviado</span>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => handlePrintSingleKitchen(item.id)}>
                              Enviar
                            </Button>
                          )}
                          <input
                            type="checkbox"
                            checked={selectedKitchenItems.includes(item.id)}
                            onChange={(e) => {
                              setSelectedKitchenItems((prev) =>
                                e.target.checked ? [...prev, item.id] : prev.filter((id) => id !== item.id)
                              );
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between rounded-lg bg-muted/30 p-4">
                <span className="text-muted-foreground">Total da Conta</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(selectedAccount.current_balance)}</span>
              </div>

              <div className="flex items-center justify-between gap-2">
              {selectedAccount.status === "closed" && selectedAccount.change_status === "not_given" && (
                <Button
                  variant="secondary"
                  className="gap-2"
                  onClick={async () => {
                    await updateAccount.mutateAsync({
                      id: selectedAccount.id,
                      data: { change_status: "given" },
                    });
                    refetch();
                  }}
                >
                  Marcar troco entregue
                </Button>
              )}
              
                <Button
                  variant="secondary"
                  className="gap-2"
                  onClick={() => {
                    const alreadySent = kitchenSentByAccount[selectedAccount.id] || [];
                    const available = selectedAccount.items.filter((item) => !alreadySent.includes(item.id)).map((item) => item.id);
                    setSelectedKitchenItems(
                      selectedKitchenItems.length === available.length ? [] : available
                    );
                  }}
                >
                  {selectedKitchenItems.length === (selectedAccount.items.filter((item) => !(kitchenSentByAccount[selectedAccount.id] || []).includes(item.id)).length) ? "Limpar selecao" : "Selecionar tudo"}
                </Button>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="gap-2" onClick={handlePrintKitchen}>
                    <Print24Regular className="w-4 h-4" />
                    Enviar cozinha
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={() => handlePrintAccount(selectedAccount)}>
                    <Print24Regular className="w-4 h-4" />
                    Imprimir Conta
                  </Button>
                </div>
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
