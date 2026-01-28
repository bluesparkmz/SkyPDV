import { useState, useEffect } from "react";

interface NetworkQuality {
  effectiveType: string | null; // 'slow-2g', '2g', '3g', '4g'
  downlink: number | null; // Mbps
  rtt: number | null; // Round trip time in ms
  saveData: boolean | null;
  isOnline: boolean;
}

export function useNetworkQuality() {
  const [networkQuality, setNetworkQuality] = useState<NetworkQuality>({
    effectiveType: null,
    downlink: null,
    rtt: null,
    saveData: null,
    isOnline: navigator.onLine,
  });

  useEffect(() => {
    // Verificar se a Connection API está disponível
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    const updateNetworkQuality = () => {
      if (connection) {
        setNetworkQuality({
          effectiveType: connection.effectiveType || null,
          downlink: connection.downlink || null,
          rtt: connection.rtt || null,
          saveData: connection.saveData || null,
          isOnline: navigator.onLine,
        });
      } else {
        // Fallback: apenas verificar se está online
        setNetworkQuality({
          effectiveType: null,
          downlink: null,
          rtt: null,
          saveData: null,
          isOnline: navigator.onLine,
        });
      }
    };

    // Estado inicial
    updateNetworkQuality();

    // Event listeners
    if (connection) {
      connection.addEventListener("change", updateNetworkQuality);
    }

    window.addEventListener("online", updateNetworkQuality);
    window.addEventListener("offline", updateNetworkQuality);

    // Cleanup
    return () => {
      if (connection) {
        connection.removeEventListener("change", updateNetworkQuality);
      }
      window.removeEventListener("online", updateNetworkQuality);
      window.removeEventListener("offline", updateNetworkQuality);
    };
  }, []);

  // Função para obter label da qualidade
  const getQualityLabel = (): string => {
    if (!networkQuality.isOnline) {
      return "Offline";
    }

    if (networkQuality.effectiveType) {
      const types: Record<string, string> = {
        "slow-2g": "2G Lento",
        "2g": "2G",
        "3g": "3G",
        "4g": "4G",
      };
      return types[networkQuality.effectiveType] || networkQuality.effectiveType.toUpperCase();
    }

    if (networkQuality.downlink) {
      if (networkQuality.downlink >= 10) return "4G";
      if (networkQuality.downlink >= 2) return "3G";
      return "2G";
    }

    return "Online";
  };

  // Função para obter cor baseada na qualidade
  const getQualityColor = (): string => {
    if (!networkQuality.isOnline) {
      return "text-destructive";
    }

    if (networkQuality.effectiveType) {
      if (networkQuality.effectiveType === "4g") return "text-emerald-500";
      if (networkQuality.effectiveType === "3g") return "text-blue-500";
      if (networkQuality.effectiveType === "2g") return "text-yellow-500";
      return "text-orange-500";
    }

    if (networkQuality.downlink) {
      if (networkQuality.downlink >= 10) return "text-emerald-500";
      if (networkQuality.downlink >= 2) return "text-blue-500";
      return "text-yellow-500";
    }

    return "text-muted-foreground";
  };

  return {
    ...networkQuality,
    qualityLabel: getQualityLabel(),
    qualityColor: getQualityColor(),
  };
}

