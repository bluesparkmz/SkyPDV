import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateTerminal, terminalApi } from "@/services/api";
import { BuildingShop24Regular } from "@fluentui/react-icons";

type Props = { onSuccess: () => void };

export function TerminalSetup({ onSuccess }: Props) {
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("MZN");
  const [taxRate, setTaxRate] = useState("16");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const payload: CreateTerminal = {
        name: name.trim(),
        description: description.trim() ? description.trim() : null,
        currency: currency.trim() || "MZN",
        tax_rate: taxRate.trim() || "0",
        settings: {},
      };
      await terminalApi.setup(payload);
      onSuccess();
    } catch (err: any) {
      setError(err?.message || "Erro ao configurar o PDV");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md">
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
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>
              )}

              <div className="space-y-2">
                <Label htmlFor="terminal-name" className="text-sm font-medium">Nome da Loja/Balcão</Label>
                <Input
                  id="terminal-name"
                  type="text"
                  placeholder="Ex: Farmácia Central"
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

              <Button type="submit" className="w-full h-11 text-base font-medium" disabled={isLoading}>
                {isLoading ? "Configurando..." : "Criar PDV"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
