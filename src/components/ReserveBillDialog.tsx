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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Building24Regular,
    PeopleTeam24Regular,
    Add24Regular,
    Checkmark24Regular
} from "@fluentui/react-icons";
import { useRestaurants, useTables, useTabs, useCreateTab, useCreateRestaurantOrder } from "@/hooks/useFastFood";
import { CartItem } from "@/types/product";
import { toast } from "sonner";

interface ReserveBillDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    items: CartItem[];
    onSuccess: () => void;
}

export function ReserveBillDialog({ open, onOpenChange, items, onSuccess }: ReserveBillDialogProps) {
    const { data: restaurants = [] } = useRestaurants();
    const restaurantId = restaurants[0]?.id; // Default to first restaurant

    const { data: tables = [] } = useTables(restaurantId);
    const { data: tabs = [] } = useTabs(restaurantId);

    const createTab = useCreateTab();
    const createOrder = useCreateRestaurantOrder();

    const [activeType, setActiveType] = useState<"table" | "tab">("table");
    const [selectedTableId, setSelectedTableId] = useState<string>("");
    const [selectedTabId, setSelectedTabId] = useState<string>("");

    const [newTabName, setNewTabName] = useState("");
    const [newTabPhone, setNewTabPhone] = useState("");
    const [showNewTabForm, setShowNewTabForm] = useState(false);

    const [guestName, setGuestName] = useState("");
    const [guestPhone, setGuestPhone] = useState("");

    const handleReserve = async () => {
        if (!restaurantId) return;

        // Filter only FastFood products and map them correctly
        const fastfoodItems = items.filter(item => item.source_type === "fastfood");
        
        if (fastfoodItems.length === 0) {
            // Show error if no FastFood products in cart
            toast.error("Apenas produtos FastFood podem ser reservados em contas. Adicione produtos do restaurante ao carrinho.");
            return;
        }

        const orderData = {
            restaurant_id: restaurantId,
            order_type: "local" as const,
            payment_method: "cash", // Cash payment for reserved bills (will be paid when closing tab)
            items: fastfoodItems.map(item => {
                // Use external_product_id if available, otherwise use PDV product ID (backend will map it)
                const itemId = item.external_product_id || item.pdv_product_id || parseInt(item.id);
                
                // Try to determine if it's a drink based on category
                // Drinks are typically in categories like "Bebidas", "Drinks", etc.
                let itemType: "menu_item" | "drink" = "menu_item";
                const categoryLower = (item.category || "").toLowerCase();
                if (categoryLower.includes("bebida") || categoryLower.includes("drink") || categoryLower === "bebidas") {
                    itemType = "drink";
                }
                
                return {
                    item_type: itemType,
                    item_id: itemId,
                    quantity: item.quantity,
                };
            }),
            customer_name: activeType === "table" ? guestName : undefined,
            customer_phone: activeType === "table" ? guestPhone : undefined,
            table_id: activeType === "table" ? parseInt(selectedTableId) : undefined,
            tab_id: activeType === "tab" ? parseInt(selectedTabId) : undefined,
        };

        try {
            await createOrder.mutateAsync(orderData);
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            // Error handled by hook
        }
    };

    const handleCreateTab = async () => {
        if (!restaurantId || !newTabName) return;
        try {
            const tab = await createTab.mutateAsync({
                restaurantId,
                data: { client_name: newTabName, client_phone: newTabPhone }
            });
            setSelectedTabId(tab.id.toString());
            setShowNewTabForm(false);
            setNewTabName("");
            setNewTabPhone("");
        } catch (error) {
            // Error handled by hook
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Reservar Conta (Venda Suspensa)</DialogTitle>
                    <DialogDescription>
                        Associe os itens do carrinho a uma mesa ou conta de cliente para finalizar depois.
                    </DialogDescription>
                </DialogHeader>

                {!restaurantId ? (
                    <div className="py-8 text-center text-muted-foreground">
                        <Building24Regular className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p>Nenhum restaurante conectado para reservar contas.</p>
                    </div>
                ) : (
                    <div className="py-4">
                        <Tabs value={activeType} onValueChange={(v: any) => setActiveType(v)} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="table" className="gap-2">
                                    <Building24Regular className="w-4 h-4" />
                                    Mesa
                                </TabsTrigger>
                                <TabsTrigger value="tab" className="gap-2">
                                    <PeopleTeam24Regular className="w-4 h-4" />
                                    Conta (Fiado)
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="table" className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label>Selecione a Mesa</Label>
                                    <Select value={selectedTableId} onValueChange={setSelectedTableId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Escolha uma mesa..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {tables.map(table => (
                                                <SelectItem key={table.id} value={table.id.toString()}>
                                                    Mesa {table.table_number} ({table.status === 'occupied' ? 'Ocupada' : 'Livre'})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3 pt-2 border-t border-border mt-4">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase">Dados do Hóspede / Cliente (Opcional)</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="guestName" className="text-xs">Nome</Label>
                                            <Input
                                                id="guestName"
                                                size={30}
                                                value={guestName}
                                                onChange={e => setGuestName(e.target.value)}
                                                placeholder="Ex: João Silva"
                                                className="h-9 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="guestPhone" className="text-xs">Telefone</Label>
                                            <Input
                                                id="guestPhone"
                                                size={30}
                                                value={guestPhone}
                                                onChange={e => setGuestPhone(e.target.value)}
                                                placeholder="84..."
                                                className="h-9 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="tab" className="space-y-4 pt-4">
                                {showNewTabForm ? (
                                    <div className="space-y-4 p-4 border rounded-lg bg-secondary/30">
                                        <div className="font-semibold text-sm">Nova Conta de Cliente</div>
                                        <div className="space-y-2">
                                            <Label htmlFor="tabName">Nome do Cliente *</Label>
                                            <Input
                                                id="tabName"
                                                value={newTabName}
                                                onChange={e => setNewTabName(e.target.value)}
                                                placeholder="Ex: João Silva"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="tabPhone">Telefone</Label>
                                            <Input
                                                id="tabPhone"
                                                value={newTabPhone}
                                                onChange={e => setNewTabPhone(e.target.value)}
                                                placeholder="Opcional"
                                            />
                                        </div>
                                        <div className="flex gap-2 justify-end">
                                            <Button variant="ghost" size="sm" onClick={() => setShowNewTabForm(false)}>Cancelar</Button>
                                            <Button size="sm" onClick={handleCreateTab} disabled={!newTabName || createTab.isPending}>
                                                {createTab.isPending ? "Criando..." : "Criar Conta"}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Selecione a Conta</Label>
                                            <div className="flex gap-2">
                                                <Select value={selectedTabId} onValueChange={setSelectedTabId}>
                                                    <SelectTrigger className="flex-1">
                                                        <SelectValue placeholder="Escolha uma conta aberta..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {tabs.map(tab => (
                                                            <SelectItem key={tab.id} value={tab.id.toString()}>
                                                                {tab.client_name} (Saldo: {tab.current_balance} MT)
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Button variant="outline" size="icon" onClick={() => setShowNewTabForm(true)}>
                                                    <Add24Regular className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div >
                )
                }

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleReserve}
                        disabled={!restaurantId || (activeType === "table" ? !selectedTableId : !selectedTabId) || createOrder.isPending}
                        className="gap-2"
                    >
                        {createOrder.isPending ? "Processando..." : (
                            <>
                                <Checkmark24Regular className="w-4 h-4" />
                                Confirmar Reserva
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent >
        </Dialog >
    );
}
