import { useEffect, useState } from "react";
import { Dismiss24Regular, Save24Regular, Wrench24Regular } from "@fluentui/react-icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PDVService } from "@/services/api";

interface ServiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; price: number }) => Promise<void>;
  service?: PDVService | null;
}

export function ServiceDialog({ isOpen, onClose, onSave, service }: ServiceDialogProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (service) {
      setName(service.name);
      setPrice(service.price);
    } else {
      setName("");
      setPrice("");
    }
    setError(null);
  }, [service, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const numPrice = parseFloat(price);

    if (!cleanName) {
      setError("Introduza o nome do serviço.");
      return;
    }
    if (isNaN(numPrice) || numPrice <= 0) {
      setError("Introduza um preço válido maior que zero.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave({ name: cleanName, price: numPrice });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Erro ao gravar serviço.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Wrench24Regular className="w-5 h-5" />
            </div>
            <DialogTitle>{service ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 text-xs rounded-md bg-destructive/10 text-destructive border border-destructive/20">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Nome do Serviço <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              placeholder="ex: Lavagem de Carro - Ranger"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Preço (MT) <span className="text-destructive">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium rounded-md border border-input hover:bg-accent text-foreground flex items-center gap-1.5 transition-colors"
            >
              <Dismiss24Regular className="w-4 h-4" />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Save24Regular className="w-4 h-4" />
              {loading ? "A gravar..." : service ? "Actualizar" : "Criar Serviço"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
