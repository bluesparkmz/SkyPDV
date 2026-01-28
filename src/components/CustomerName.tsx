import { Sale } from "@/services/api";
import { useCustomerName } from "@/hooks/useCustomerName";

interface CustomerNameProps {
  sale: Sale;
  fallback?: string;
  className?: string;
}

export function CustomerName({ sale, fallback = "Cliente não informado", className }: CustomerNameProps) {
  const customerName = useCustomerName(sale);
  
  return (
    <span className={className}>
      {customerName || fallback}
    </span>
  );
}

