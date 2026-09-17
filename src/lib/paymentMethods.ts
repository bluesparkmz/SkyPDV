export interface PaymentMethodOption {
  value: string;
  label: string;
}

export const LOCAL_PAYMENT_METHODS: PaymentMethodOption[] = [
  { value: "cash", label: "Dinheiro" },
  { value: "emola", label: "E-mola" },
  { value: "mpesa", label: "Mpesa" },
  { value: "bci_pos", label: "BCI-POS" },
  { value: "bim_pos", label: "BIM-POS" },
  { value: "mozabanco", label: "MozaBanco" },
  { value: "standerback", label: "StanderBack" },
];

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Dinheiro",
  Dinheiro: "Dinheiro",
  dinheiro: "Dinheiro",
  emola: "E-mola",
  "E-mola": "E-mola",
  "e-mola": "E-mola",
  skywallet: "E-mola",
  SkyWallet: "E-mola",
  mpesa: "Mpesa",
  Mpesa: "Mpesa",
  "M-Pesa": "Mpesa",
  "M-pesa": "Mpesa",
  bci_pos: "BCI-POS",
  "BCI-POS": "BCI-POS",
  "bci-pos": "BCI-POS",
  card: "BCI-POS",
  bim_pos: "BIM-POS",
  "BIM-POS": "BIM-POS",
  "bim-pos": "BIM-POS",
  mozabanco: "MozaBanco",
  MozaBanco: "MozaBanco",
  standerback: "StanderBack",
  StanderBack: "StanderBack",
  mixed: "Misto",
};

export function getPaymentMethodLabel(method: string | undefined | null): string {
  if (!method) return "";
  return PAYMENT_METHOD_LABELS[method] || method;
}

/**
 * Mapeia métodos de pagamento locais para os tipos suportados pelo backend PDV
 * (cash, card, skywallet, mpesa, mixed) evitando erro 422 da API remota.
 */
export function mapToApiPaymentMethod(method: string): "cash" | "card" | "skywallet" | "mpesa" | "mixed" {
  switch (method) {
    case "cash":
    case "Dinheiro":
      return "cash";
    case "emola":
    case "E-mola":
    case "skywallet":
      return "skywallet";
    case "mpesa":
    case "Mpesa":
    case "M-Pesa":
      return "mpesa";
    case "bci_pos":
    case "BCI-POS":
    case "bim_pos":
    case "BIM-POS":
    case "mozabanco":
    case "MozaBanco":
    case "standerback":
    case "StanderBack":
    case "card":
      return "card";
    case "mixed":
      return "mixed";
    default:
      return "cash";
  }
}
