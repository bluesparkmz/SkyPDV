import { useMemo, useState } from "react";
import { Search24Regular } from "@fluentui/react-icons";

import { useAdoptProduct, useCatalogProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { Product } from "@/services/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AdoptProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdoptProductDialog({ open, onOpenChange }: AdoptProductDialogProps) {
  const [search, setSearch] = useState("");
  const [businessType, setBusinessType] = useState<"loja" | "restaurante">("loja");
  const [category, setCategory] = useState("all");
  const { data: categories = [] } = useCategories();
  const { data: products = [], isLoading } = useCatalogProducts({
    search: search || undefined,
    category: category !== "all" ? category : undefined,
    business_type: businessType,
    limit: 100,
  });
  const adoptProduct = useAdoptProduct();

  const filteredProducts = useMemo(
    () => products.filter((product) => product.is_active),
    [products]
  );

  const handleAdopt = async (product: Product) => {
    await adoptProduct.mutateAsync({
      source_product_id: product.id,
      price: product.price,
      cost_price: product.cost_price,
      initial_stock: "0",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>Adicionar Produto Existente</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_220px]">
            <div className="relative">
              <Search24Regular className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar produtos partilhados..."
                className="w-full rounded-lg border border-border bg-secondary/50 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <Select value={businessType} onValueChange={(value: "loja" | "restaurante") => setBusinessType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="loja">Loja</SelectItem>
                <SelectItem value="restaurante">Restaurante</SelectItem>
              </SelectContent>
            </Select>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {categories.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="max-h-[420px] overflow-auto rounded-xl border border-border">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="p-3 text-left text-sm font-semibold text-foreground">Produto</th>
                  <th className="p-3 text-left text-sm font-semibold text-foreground">Categoria</th>
                  <th className="p-3 text-left text-sm font-semibold text-foreground">Tipo</th>
                  <th className="p-3 text-left text-sm font-semibold text-foreground">Preco</th>
                  <th className="p-3 text-right text-sm font-semibold text-foreground">Acao</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-sm text-muted-foreground">
                      Carregando produtos...
                    </td>
                  </tr>
                )}
                {!isLoading && filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-sm text-muted-foreground">
                      Nenhum produto encontrado.
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="border-t border-border">
                      <td className="p-3 text-sm text-foreground">{product.name}</td>
                      <td className="p-3 text-sm text-muted-foreground">{product.category || "-"}</td>
                      <td className="p-3 text-sm text-muted-foreground">{product.is_fastfood ? "Restaurante" : "Loja"}</td>
                      <td className="p-3 text-sm font-medium text-foreground">{parseFloat(product.price).toFixed(2)} MT</td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          onClick={() => handleAdopt(product)}
                          disabled={adoptProduct.isPending}
                        >
                          Adicionar
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
