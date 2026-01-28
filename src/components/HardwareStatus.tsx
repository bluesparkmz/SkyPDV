import { useHardwarePlugin } from "@/hooks/useHardwarePlugin";
import { Print24Regular, CheckmarkCircle24Regular, ErrorCircle24Regular } from "@fluentui/react-icons";
import { Badge } from "@/components/ui/badge";

export function HardwareStatus() {
  const { isConnected, isConnecting } = useHardwarePlugin();

  if (isConnecting) {
    return (
      <Badge variant="outline" className="gap-1.5">
        <Print24Regular className="w-3 h-3 animate-pulse text-yellow-500" />
        Conectando...
      </Badge>
    );
  }

  if (isConnected) {
    return (
      <Badge variant="outline" className="gap-1.5 border-emerald-500 text-emerald-500">
        <CheckmarkCircle24Regular className="w-3 h-3" />
        Hardware Conectado
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1.5 border-muted-foreground/50 text-muted-foreground">
      <ErrorCircle24Regular className="w-3 h-3" />
      Hardware Offline
    </Badge>
  );
}

