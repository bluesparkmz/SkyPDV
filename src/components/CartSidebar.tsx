import { CartItem } from "@/types/product";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Receipt24Regular,
  Add24Regular,
  Subtract24Regular,
  Delete24Regular,
  Money24Regular,
  Payment24Regular,
  Wallet24Regular,
  Warning24Regular,
  Dismiss24Regular,
  Building24Regular,
  Cart24Filled,
} from "@fluentui/react-icons";
import { useState } from "react";
import { SaleDialog } from "./SaleDialog";
import { ReserveBillDialog } from "./ReserveBillDialog";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { toast } from "sonner";
import { ProductImage } from "./ProductImage";

type ParkedSaleSummary = {
  id: string;
  label: string;
  createdAt: string;
  customerName?: string;
};

interface CartSidebarProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onSaleComplete?: () => void;
  isCashRegisterOpen?: boolean;
  // Vendas em espera (PDV local, não FastFood)
  parkedSales?: ParkedSaleSummary[];
  customerName?: string;
  onCustomerNameChange?: (name: string) => void;
  onParkSale?: () => void;
  onLoadParkedSale?: (id: string) => void;
}

const IVA_RATE = 0.16;

function CartContent({ items, onUpdateQuantity, onRemove, onClear, subtotal, ivaAmount, total, totalItems, onSaleComplete, isCashRegisterOpen, parkedSales, customerName, onCustomerNameChange, onParkSale, onLoadParkedSale }: {
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
  parkedSales?: ParkedSaleSummary[];
  customerName?: string;
  onCustomerNameChange?: (name: string) => void;
  onParkSale?: () => void;
  onLoadParkedSale?: (id: string) => void;
}) {
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [reserveDialogOpen, setReserveDialogOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"cash" | "skywallet" | "mpesa">("cash");
  const [showPendingSales, setShowPendingSales] = useState(false);
  const [isParking, setIsParking] = useState(false);
  const { data: paymentMethods } = usePaymentMethods();

  const handleFinalizeSale = () => {
    if (!isCashRegisterOpen) {
      toast.error("O caixa precisa estar aberto para realizar vendas. Abra o caixa primeiro.");
      return;
    }
    setSaleDialogOpen(true);
  };
  return (
    <>
      {/* Header */}
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

      {/* Cart Items */}
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
                <p className="text-sm font-medium text-foreground truncate">
                  {item.name}
                </p>
                <p className="text-sm text-primary font-semibold">
                  {(item.price * item.quantity).toFixed(2)} MT
                </p>
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
                  <span className="w-8 text-center text-sm font-medium">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="quantity-btn"
                  >
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

      {/* Summary */}
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

        {/* Payment Methods */}
        <div className="grid grid-cols-3 gap-2">
          <button
            className={`fluent-button flex-col gap-1 py-3 ${selectedPaymentMethod === "cash" ? "fluent-button-primary" : ""}`}
            disabled={items.length === 0}
            onClick={() => setSelectedPaymentMethod("cash")}
          >
            <Money24Regular className="w-6 h-6" />
            <span className="text-xs">Dinheiro</span>
          </button>
          <button
            className={`fluent-button flex-col gap-1 py-3 ${showPendingSales ? "fluent-button-primary" : ""}`}
            disabled={!parkedSales || parkedSales.length === 0}
            onClick={() => setShowPendingSales((v) => !v)}
          >
            <Payment24Regular className="w-6 h-6" />
            <span className="text-xs">Vendas pendentes</span>
          </button>
          <button
            className={`fluent-button flex-col gap-1 py-3 ${selectedPaymentMethod === "skywallet" ? "fluent-button-primary" : ""}`}
            disabled={items.length === 0}
            onClick={() => setSelectedPaymentMethod("skywallet")}
          >
            <Wallet24Regular className="w-6 h-6" />
            <span className="text-xs">SkyWallet</span>
          </button>
        </div>

        {/* Lista de vendas pendentes (em espera) */}
        {showPendingSales && parkedSales && parkedSales.length > 0 && onLoadParkedSale && (
          <div className="p-3 rounded-lg bg-card border border-border space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground">
                Vendas pendentes ({parkedSales.length})
              </p>
              <button
                onClick={() => setShowPendingSales(false)}
                className="p-1 rounded hover:bg-muted text-muted-foreground"
                aria-label="Fechar"
              >
                <Dismiss24Regular className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {parkedSales.map((sale) => (
                <button
                  key={sale.id}
                  onClick={() => {
                    onLoadParkedSale(sale.id);
                    setShowPendingSales(false);
                  }}
                  className="px-2 py-1 rounded-full bg-muted text-xs text-foreground hover:bg-muted/80 transition-colors"
                >
                  {sale.customerName ? sale.customerName : sale.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cash Register Warning */}
        {!isCashRegisterOpen && items.length > 0 && (
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-center gap-2 text-sm text-warning">
            <Warning24Regular className="w-5 h-5" />
            <span>Abra o caixa para realizar vendas</span>
          </div>
        )}

        {/* Row 1: Reserva and Em Espera */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setReserveDialogOpen(true)}
            className="fluent-button bg-primary/10 text-primary hover:bg-primary/20 py-2 transition-colors text-xs font-semibold border border-primary/20 gap-2"
          >
            <Building24Regular className="w-4 h-4" />
            Reservar Conta
          </button>
          {onParkSale && (
            <button
              onClick={() => setIsParking(true)}
              className="fluent-button bg-secondary text-foreground hover:bg-secondary/80 py-2 transition-colors text-xs font-semibold border border-border disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={items.length === 0}
            >
              Em Espera
            </button>
          )}
        </div>

        {/* Row 2: Finalizar and Limpar */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleFinalizeSale}
            disabled={!isCashRegisterOpen}
            className="fluent-button fluent-button-primary py-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-xs text-white"
          >
            Finalizar Venda
          </button>
          <button
            onClick={onClear}
            className="fluent-button bg-destructive/10 text-destructive hover:bg-destructive/20 py-2 transition-colors text-xs font-medium border border-destructive/20"
          >
            Limpar Carrinho
          </button>
        </div>

        {/* Form para dar nome e confirmar venda em espera */}
        {isParking && onParkSale && onCustomerNameChange && (
          <div className="p-3 rounded-lg bg-card border border-border space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">
              Identificar venda em espera
            </p>
            <input
              type="text"
              value={customerName || ""}
              onChange={(e) => onCustomerNameChange(e.target.value)}
              placeholder="Nome do cliente (ex: João)"
              className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              autoFocus
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setIsParking(false);
                  onCustomerNameChange("");
                }}
                className="fluent-button bg-muted text-foreground hover:bg-muted/80 py-2 text-sm font-semibold border border-border"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onParkSale();
                  setIsParking(false);
                }}
                className="fluent-button fluent-button-primary py-2 text-sm font-semibold text-white"
              >
                Confirmar
              </button>
            </div>
          </div>
        )}
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

      {/* Reserve Bill Dialog */}
      <ReserveBillDialog
        open={reserveDialogOpen}
        onOpenChange={setReserveDialogOpen}
        items={items}
        onSuccess={() => {
          onClear();
          onSaleComplete?.();
          toast.success("Conta reservada com sucesso!");
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
  parkedSales,
  customerName,
  onCustomerNameChange,
  onParkSale,
  onLoadParkedSale,
}: CartSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  // Os produtos já vêm com IVA incluído no preço
  // Total = soma dos preços (já com IVA)
  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  // Subtotal = valor sem IVA (total / 1.16)
  const subtotal = total / (1 + IVA_RATE);
  // IVA = diferença entre total e subtotal
  const ivaAmount = total - subtotal;
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <>
      {/* Desktop Sidebar */}
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
          parkedSales={parkedSales}
          customerName={customerName}
          onCustomerNameChange={onCustomerNameChange}
          onParkSale={onParkSale}
          onLoadParkedSale={onLoadParkedSale}
        />
      </div>

      {/* Mobile/Tablet Sheet */}
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
                parkedSales={parkedSales}
                customerName={customerName}
                onCustomerNameChange={onCustomerNameChange}
                onParkSale={onParkSale}
                onLoadParkedSale={onLoadParkedSale}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
