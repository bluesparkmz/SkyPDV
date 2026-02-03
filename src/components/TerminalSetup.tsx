import { useState } from "react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateTerminal, terminalApi } from "@/services/api";
import { fastfoodApi } from "@/services/fastfoodApi";
import { BuildingShop24Regular } from "@fluentui/react-icons";

type Props = { onSuccess: () => void };

type BusinessType = "store" | "pharmacy" | "restaurant" | "cafeteria" | "snackbar" | "";

export function TerminalSetup({ onSuccess }: Props) {
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("MZN");
  const [taxRate, setTaxRate] = useState("16");
  const [description, setDescription] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [restaurantDetails, setRestaurantDetails] = useState<Record<string, any>>({});

  const handleRestaurantDetailChange = (key: string, value: any) => {
    setRestaurantDetails(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!businessType) {
      setError("Por favor, selecione o tipo de estabelecimento");
      return;
    }

    setError("");
    setIsLoading(true);
    try {
      const isFastFoodBusiness = businessType === "restaurant" || businessType === "cafeteria" || businessType === "snackbar";

      if (isFastFoodBusiness) {
        const form = new FormData();
        form.append("name", name.trim());

        const details = restaurantDetails || {};
        if (details.province) form.append("province", String(details.province));
        if (details.district) form.append("district", String(details.district));
        if (details.neighborhood) form.append("neighborhood", String(details.neighborhood));
        if (details.avenue) form.append("avenue", String(details.avenue));
        if (details.location_google_maps) form.append("location_google_maps", String(details.location_google_maps));
        if (details.opening_time) form.append("opening_time", String(details.opening_time));
        if (details.closing_time) form.append("closing_time", String(details.closing_time));
        if (details.open_days) form.append("open_days", String(details.open_days));
        if (details.min_delivery_value !== undefined && details.min_delivery_value !== null && details.min_delivery_value !== "") {
          form.append("min_delivery_value", String(details.min_delivery_value));
        }
        if (details.latitude !== undefined && details.latitude !== null && details.latitude !== "") {
          form.append("latitude", String(details.latitude));
        }
        if (details.longitude !== undefined && details.longitude !== null && details.longitude !== "") {
          form.append("longitude", String(details.longitude));
        }

        await fastfoodApi.createRestaurant(form);

        await terminalApi.update({
          name: name.trim(),
          description: description.trim() ? description.trim() : null,
          currency: currency.trim() || "MZN",
          tax_rate: taxRate.trim() || "0",
          settings: { business_type: businessType },
        });
      } else {
        const payload: CreateTerminal = {
          name: name.trim(),
          description: description.trim() ? description.trim() : null,
          currency: currency.trim() || "MZN",
          tax_rate: taxRate.trim() || "0",
          settings: { business_type: businessType },
        };
        await terminalApi.setup(payload);
      }
      onSuccess();
    } catch (err: any) {
      setError(err?.message || "Erro ao configurar o PDV");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl my-8">
        <Card className="acrylic-surface border-border/50 shadow-strong">
          <CardHeader className="text-center space-y-2 pb-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <BuildingShop24Regular className="w-8 h-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Configurar PDV</CardTitle>
            <CardDescription className="text-base">Configure o seu balcão para começar a vender</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Dados do Balcão</h3>

                  <div className="space-y-2">
                    <Label htmlFor="business-type" className="text-sm font-medium">
                      Tipo de Estabelecimento <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={businessType}
                      onValueChange={(value) => setBusinessType(value as BusinessType)}
                      disabled={isLoading}
                      required
                    >
                      <SelectTrigger id="business-type" className="h-11">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="restaurant">🍽️ Restaurante</SelectItem>
                        <SelectItem value="cafeteria">☕ Cafetaria</SelectItem>
                        <SelectItem value="snackbar">🍔 Lanchonete</SelectItem>
                        <SelectItem value="pharmacy">💊 Farmácia</SelectItem>
                        <SelectItem value="store">🏪 Loja</SelectItem>
                      </SelectContent>
                    </Select>
                    {(businessType === "restaurant" || businessType === "cafeteria" || businessType === "snackbar") && (
                      <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                        ✓ Estabelecimento FastFood será criado automaticamente
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="terminal-name" className="text-sm font-medium">Nome da Loja/Balcão <span className="text-destructive">*</span></Label>
                    <Input
                      id="terminal-name"
                      type="text"
                      placeholder={
                        businessType === "restaurant" ? "Ex: Restaurante Central" :
                          businessType === "cafeteria" ? "Ex: Cafetaria do Centro" :
                            "Ex: Loja Central"
                      }
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-11"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="terminal-description" className="text-sm font-medium">Descrição (opcional)</Label>
                    <Input
                      id="terminal-description"
                      type="text"
                      placeholder="Ex: Balcão principal"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="h-11"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="terminal-currency" className="text-sm font-medium">Moeda</Label>
                      <Input
                        id="terminal-currency"
                        type="text"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="h-11"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="terminal-tax" className="text-sm font-medium">Taxa (%)</Label>
                      <Input
                        id="terminal-tax"
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        value={taxRate}
                        onChange={(e) => setTaxRate(e.target.value)}
                        className="h-11"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                {(businessType === "restaurant" || businessType === "cafeteria" || businessType === "snackbar") && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                    <h3 className="font-semibold text-lg border-b pb-2">Detalhes do Restaurante</h3>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="rest-province" className="text-sm font-medium">Província</Label>
                        <Select disabled={isLoading} onValueChange={(v) => handleRestaurantDetailChange("province", v)}>
                          <SelectTrigger id="rest-province" className="h-11">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Maputo Cidade">Maputo Cidade</SelectItem>
                            <SelectItem value="Maputo Provincia">Maputo Província</SelectItem>
                            <SelectItem value="Gaza">Gaza</SelectItem>
                            <SelectItem value="Inhambane">Inhambane</SelectItem>
                            <SelectItem value="Sofala">Sofala</SelectItem>
                            <SelectItem value="Manica">Manica</SelectItem>
                            <SelectItem value="Tete">Tete</SelectItem>
                            <SelectItem value="Zambézia">Zambézia</SelectItem>
                            <SelectItem value="Nampula">Nampula</SelectItem>
                            <SelectItem value="Niassa">Niassa</SelectItem>
                            <SelectItem value="Cabo Delgado">Cabo Delgado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rest-district" className="text-sm font-medium">Distrito</Label>
                        <Input
                          id="rest-district"
                          className="h-11"
                          placeholder="Ex: Kampfumo"
                          onChange={(e) => handleRestaurantDetailChange("district", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rest-address" className="text-sm font-medium">Endereço / Bairro</Label>
                      <Input
                        id="rest-address"
                        className="h-11"
                        placeholder="Ex: Polana Cimento, Av. 24 de Julho"
                        onChange={(e) => handleRestaurantDetailChange("neighborhood", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rest-avenue" className="text-sm font-medium">Avenida / Rua</Label>
                      <Input
                        id="rest-avenue"
                        className="h-11"
                        placeholder="Ex: Av. Julius Nyerere"
                        onChange={(e) => handleRestaurantDetailChange("avenue", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rest-maps" className="text-sm font-medium">Link Google Maps (Opcional)</Label>
                      <Input
                        id="rest-maps"
                        className="h-11"
                        placeholder="https://maps.google.com/..."
                        onChange={(e) => handleRestaurantDetailChange("location_google_maps", e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="rest-open" className="text-sm font-medium">Abertura</Label>
                        <Input
                          id="rest-open"
                          type="time"
                          className="h-11"
                          onChange={(e) => handleRestaurantDetailChange("opening_time", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rest-close" className="text-sm font-medium">Fecho</Label>
                        <Input
                          id="rest-close"
                          type="time"
                          className="h-11"
                          onChange={(e) => handleRestaurantDetailChange("closing_time", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rest-min-value" className="text-sm font-medium">Taxa Entrega Mínima (MT)</Label>
                      <Input
                        id="rest-min-value"
                        type="number"
                        className="h-11"
                        placeholder="0.00"
                        onChange={(e) => handleRestaurantDetailChange("min_delivery_value", Number(e.target.value))}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full h-12 text-base font-bold" disabled={isLoading}>
                  {isLoading ? "Configurando..." : "Criar PDV e Começar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
