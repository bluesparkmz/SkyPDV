import { CartItem } from "@/types/product";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Receipt24Regular,
  Add24Regular,
  Subtract24Regular,
  Delete24Regular,
  Warning24Regular,
  Building24Regular,
  Cart24Filled,
} from "@fluentui/react-icons";
import { useState } from "react";
import { SaleDialog } from "./SaleDialog";
import { ReserveBillDialog } from "./ReserveBillDialog";
import { toast } from "sonner";
import { ProductImage } from "./ProductImage";
import { useHardwarePlugin } from "@/hooks/useHardwarePlugin";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CartSidebarProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onSaleComplete?: () => void;
  isCashRegisterOpen?: boolean;
  canSell?: boolean;
}

const IVA_RATE = 0.16;

function CartContent({
  items,
  onUpdateQuantity,
  onRemove,
  onClear,
  subtotal,
  ivaAmount,
  total,
  totalItems,
  onSaleComplete,
  isCashRegisterOpen,
  canSell,
}: {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  subtotal: number;
  ivaAmount: number;
  total: number;
  totalItems: number;
  onSaleComplete?: () => void;
  isCashRegisterOpen?: boolean;
  canSell?: boolean;
}) {
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [reserveDialogOpen, setReserveDialogOpen] = useState(false);
  const [clearCartDialogOpen, setClearCartDialogOpen] = useState(false);
  const { openCashDrawer } = useHardwarePlugin();

  const handleFinalizeSale = () => {
    if (!isCashRegisterOpen) {
      toast.error("O caixa precisa estar aberto para realizar vendas. Abra o caixa primeiro.");
      return;
    }
    if (canSell === false) {
      toast.error("Seu perfil nao tem permissao para vender.");
      return;
    }
    setSaleDialogOpen(true);
  };

  const handleOpenCashDrawer = async () => {
    try {
      await openCashDrawer();
    } catch (error) {
      console.error("Erro ao abrir gaveta:", error);
    }
  };

  return (
    <>
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt24Regular className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            <h2 className="font-semibold text-foreground">Carrinho</h2>
          </div>
          <span className="text-sm text-muted-foreground">
            {totalItems} {totalItems === 1 ? "item" : "itens"}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-2 windows-scrollbar">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Receipt24Regular className="w-16 h-16 mb-2 opacity-30" />
            <p className="text-sm">Carrinho vazio</p>
            <p className="text-xs">Selecione produtos para adicionar</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="cart-item">
              <ProductImage
                image={item.image}
                alt={item.name}
                size="md"
                productName={item.name}
                color="bg-primary/10"
                textColor="text-primary"
              />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                <p className="text-sm text-primary font-semibold">{(item.price * item.quantity).toFixed(2)} MT</p>
              </div>

              <div className="flex items-center gap-1">
                <div className="quantity-control">
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    className="quantity-btn"
                    disabled={item.quantity <= 1}
                  >
                    <Subtract24Regular className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} className="quantity-btn">
                    <Add24Regular className="w-3 h-3" />
                  </button>
                </div>

                <button
                  onClick={() => onRemove(item.id)}
                  className="p-1.5 rounded hover:bg-destructive/10 text-destructive transition-colors ml-1"
                >
                  <Delete24Regular className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-border p-4 space-y-3 bg-secondary/30">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{subtotal.toFixed(2)} MT</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>IVA (16%)</span>
            <span>{ivaAmount.toFixed(2)} MT</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-foreground pt-2 border-t border-border">
            <span>Total</span>
            <span className="text-primary">{total.toFixed(2)} MT</span>
          </div>
        </div>

        {!isCashRegisterOpen && items.length > 0 && (
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-center gap-2 text-sm text-warning">
            <Warning24Regular className="w-5 h-5" />
            <span>Abra o caixa para realizar vendas</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => setReserveDialogOpen(true)}
            disabled={items.length === 0}
            className="fluent-button bg-secondary text-foreground hover:bg-secondary/80 py-2 transition-colors text-xs font-semibold border border-border gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Receipt24Regular className="w-4 h-4" />
            Vendas Pendentes
          </button>
          <button
            onClick={handleOpenCashDrawer}
            className="fluent-button bg-primary/10 text-primary hover:bg-primary/20 py-2 transition-colors text-xs font-semibold border border-primary/20 gap-2"
          >
            <Building24Regular className="w-4 h-4" />
            Abrir Gaveta
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleFinalizeSale}
            disabled={!isCashRegisterOpen}
            className="fluent-button fluent-button-primary py-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-xs text-white"
          >
            Finalizar Venda
          </button>
          <button
            onClick={() => setClearCartDialogOpen(true)}
            className="fluent-button bg-destructive/10 text-destructive hover:bg-destructive/20 py-2 transition-colors text-xs font-medium border border-destructive/20"
          >
            Limpar Carrinho
          </button>
        </div>

        <AlertDialog open={clearCartDialogOpen} onOpenChange={setClearCartDialogOpen}>
          <AlertDialogContent className="sm:left-auto sm:right-6 sm:top-auto sm:bottom-24 sm:w-[380px] sm:translate-x-0 sm:translate-y-0">
            <AlertDialogHeader>
              <AlertDialogTitle>Limpar carrinho?</AlertDialogTitle>
              <AlertDialogDescription>
                Todos os itens adicionados serao removidos do carrinho atual. Esta acao nao pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  onClear();
                  setClearCartDialogOpen(false);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Sim, limpar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <SaleDialog
        open={saleDialogOpen}
        onOpenChange={setSaleDialogOpen}
        items={items}
        subtotal={subtotal}
        onSuccess={() => {
          onClear();
          onSaleComplete?.();
        }}
      />

      <ReserveBillDialog
        open={reserveDialogOpen}
        onOpenChange={setReserveDialogOpen}
        items={items}
        onSuccess={() => {
          onClear();
          onSaleComplete?.();
        }}
      />
    </>
  );
}

export function CartSidebar({
  items,
  onUpdateQuantity,
  onRemove,
  onClear,
  onSaleComplete,
  isCashRegisterOpen,
  canSell,
}: CartSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const subtotal = total / (1 + IVA_RATE);
  const ivaAmount = total - subtotal;
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <>
      <div className="hidden lg:flex w-[340px] h-full bg-card border-l border-border flex-col">
        <CartContent
          items={items}
          onUpdateQuantity={onUpdateQuantity}
          onRemove={onRemove}
          onClear={onClear}
          subtotal={subtotal}
          ivaAmount={ivaAmount}
          total={total}
          totalItems={totalItems}
          onSaleComplete={onSaleComplete}
          isCashRegisterOpen={isCashRegisterOpen}
          canSell={canSell}
        />
      </div>

      <div className="lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button className="fixed bottom-16 right-4 z-40 w-14 h-14 bg-primary rounded-full shadow-lg flex items-center justify-center text-primary-foreground text-2xl">
              <Cart24Filled className="w-7 h-7" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="p-0 w-full sm:w-[400px] bg-card border-l border-border flex flex-col">
            <div className="flex flex-col h-full">
              <CartContent
                items={items}
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemove}
                onClear={onClear}
                subtotal={subtotal}
                ivaAmount={ivaAmount}
                total={total}
                totalItems={totalItems}
                onSaleComplete={onSaleComplete}
                isCashRegisterOpen={isCashRegisterOpen}
                canSell={canSell}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
