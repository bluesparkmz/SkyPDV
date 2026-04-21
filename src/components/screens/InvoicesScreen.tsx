import { InvoiceSection } from "./SettingsScreen";

export function InvoicesScreen() {
  return (
    <div className="flex-1 p-3 md:p-6 overflow-auto windows-scrollbar">
      <div className="mb-4 md:mb-6">
        <h1 className="text-lg md:text-2xl font-bold text-foreground">Faturas</h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          Gestao de faturas fora do menu de configuracoes.
        </p>
      </div>
      <InvoiceSection />
    </div>
  );
}
