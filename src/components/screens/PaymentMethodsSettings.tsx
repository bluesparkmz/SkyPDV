import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreatePaymentMethod, useDeletePaymentMethod, usePaymentMethods, useUpdatePaymentMethod } from "@/hooks/usePaymentMethods";

export function PaymentMethodsSettings() {
  const { data: methods = [], isLoading } = usePaymentMethods();
  const createMethod = useCreatePaymentMethod();
  const updateMethod = useUpdatePaymentMethod();
  const deleteMethod = useDeletePaymentMethod();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const save = async () => {
    if (!name.trim()) return;
    if (editingId) await updateMethod.mutateAsync({ id: editingId, data: { name: name.trim(), description: description || undefined } });
    else await createMethod.mutateAsync({ name: name.trim(), description: description || undefined });
    setName(""); setDescription(""); setEditingId(null);
  };

  return <section className="rounded-2xl border border-border bg-card shadow-sm">
    <div className="border-b border-border px-4 py-4 md:px-5">
      <h2 className="text-base md:text-lg font-semibold">Métodos de pagamento</h2>
      <p className="mt-1 text-sm text-muted-foreground">Somente a sua empresa vê e utiliza estes métodos nas vendas e recibos.</p>
    </div>
    <div className="space-y-5 p-4 md:p-5">
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <div className="space-y-2"><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Dinheiro, POS Loja, Transferência" /></div>
        <div className="space-y-2"><Label>Descrição</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opcional" /></div>
        <Button onClick={() => void save()} disabled={!name.trim() || createMethod.isPending || updateMethod.isPending}>{editingId ? "Guardar" : "Adicionar"}</Button>
      </div>
      {editingId && <Button variant="ghost" size="sm" onClick={() => { setEditingId(null); setName(""); setDescription(""); }}>Cancelar edição</Button>}
      <div className="divide-y rounded-xl border border-border">
        {isLoading && <p className="p-4 text-sm text-muted-foreground">A carregar métodos...</p>}
        {!isLoading && methods.length === 0 && <p className="p-4 text-sm text-muted-foreground">Ainda não há métodos. Cadastre um para poder finalizar vendas.</p>}
        {methods.map((method) => <div key={method.id} className="flex items-center justify-between gap-3 p-4">
          <div><p className="font-medium">{method.name}</p>{method.description && <p className="text-sm text-muted-foreground">{method.description}</p>}</div>
          <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => { setEditingId(method.id); setName(method.name); setDescription(method.description || ""); }}>Editar</Button><Button size="sm" variant="destructive" onClick={() => void deleteMethod.mutateAsync(method.id)}>Desativar</Button></div>
        </div>)}
      </div>
    </div>
  </section>;
}
