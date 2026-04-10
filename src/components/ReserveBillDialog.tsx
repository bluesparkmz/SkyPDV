import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Add24Regular,
  PeopleTeam24Regular,
  Checkmark24Regular,
} from "@fluentui/react-icons";
import { useAccounts, useAddAccountItems, useCreateAccount } from "@/hooks/useAccounts";
import { CartItem } from "@/types/product";
import { toast } from "sonner";

interface ReserveBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  onSuccess: () => void;
}

export function ReserveBillDialog({ open, onOpenChange, items, onSuccess }: ReserveBillDialogProps) {
  const { data: openAccounts = [] } = useAccounts("open");
  const createAccount = useCreateAccount();
  const addAccountItems = useAddAccountItems();

  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  const mappedItems = items.map((item) => ({
    product_id: item.pdv_product_id || Number(item.id),
    quantity: String(item.quantity),
    unit_price: String(item.price),
  }));

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast.error("O carrinho esta vazio.");
      return;
    }

    if (mappedItems.some((item) => !item.product_id || Number.isNaN(item.product_id))) {
      toast.error("Existem produtos invalidos no carrinho.");
      return;
    }

    try {
      if (mode === "existing") {
        if (!selectedAccountId) {
          toast.error("Selecione uma conta aberta.");
          return;
        }
        await addAccountItems.mutateAsync({
          id: Number(selectedAccountId),
          items: mappedItems,
        });
      } else {
        if (!clientName.trim()) {
          toast.error("Nome do cliente e obrigatorio.");
          return;
        }
        await createAccount.mutateAsync({
          client_name: clientName.trim(),
          client_phone: clientPhone.trim() || undefined,
          items: mappedItems,
        });
      }

      onSuccess();
      onOpenChange(false);
      setSelectedAccountId("");
      setClientName("");
      setClientPhone("");
      setMode(openAccounts.length > 0 ? "existing" : "new");
    } catch {
      // handled by hooks
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Guardar em Conta</DialogTitle>
          <DialogDescription>
            Guarde os produtos do carrinho numa conta aberta do cliente e finalize a venda apenas ao fechar a conta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={mode === "existing" ? "default" : "outline"}
              className="gap-2"
              onClick={() => setMode("existing")}
            >
              <PeopleTeam24Regular className="w-4 h-4" />
              Conta Aberta
            </Button>
            <Button
              type="button"
              variant={mode === "new" ? "default" : "outline"}
              className="gap-2"
              onClick={() => setMode("new")}
            >
              <Add24Regular className="w-4 h-4" />
              Nova Conta
            </Button>
          </div>

          {mode === "existing" ? (
            <div className="space-y-2">
              <Label>Conta aberta</Label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha uma conta..." />
                </SelectTrigger>
                <SelectContent>
                  {openAccounts.length === 0 ? (
                    <SelectItem value="__empty__" disabled>
                      Nenhuma conta aberta
                    </SelectItem>
                  ) : (
                    openAccounts.map((account) => (
                      <SelectItem key={account.id} value={String(account.id)}>
                        {account.client_name} - {Number(account.current_balance).toFixed(2)} MT
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client_name">Nome do Cliente *</Label>
                <Input
                  id="client_name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ex: Joao Silva"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_phone">Telefone</Label>
                <Input
                  id="client_phone"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="84..."
                />
              </div>
            </div>
          )}

          <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm text-muted-foreground">
            {items.length} item(ns) serao guardados nesta conta.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            className="gap-2"
            disabled={createAccount.isPending || addAccountItems.isPending}
          >
            <Checkmark24Regular className="w-4 h-4" />
            Guardar Conta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
