import { useState, useEffect } from "react";

interface BatteryState {
  level: number; // 0.0 to 1.0
  charging: boolean;
  chargingTime: number | null;
  dischargingTime: number | null;
}

export function useBattery() {
  const [batteryState, setBatteryState] = useState<BatteryState | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Verificar se a API de bateria está disponível
    if (!("getBattery" in navigator)) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    // Obter a bateria
    (navigator as any).getBattery().then((battery: any) => {
      // Função para atualizar o estado
      const updateBatteryState = () => {
        setBatteryState({
          level: battery.level,
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime,
        });
      };

      // Estado inicial
      updateBatteryState();

      // Event listeners
      battery.addEventListener("chargingchange", updateBatteryState);
      battery.addEventListener("levelchange", updateBatteryState);
      battery.addEventListener("chargingtimechange", updateBatteryState);
      battery.addEventListener("dischargingtimechange", updateBatteryState);

      // Cleanup
      return () => {
        battery.removeEventListener("chargingchange", updateBatteryState);
        battery.removeEventListener("levelchange", updateBatteryState);
        battery.removeEventListener("chargingtimechange", updateBatteryState);
        battery.removeEventListener("dischargingtimechange", updateBatteryState);
      };
    }).catch(() => {
      setIsSupported(false);
    });
  }, []);

  return {
    level: batteryState?.level ?? null,
    charging: batteryState?.charging ?? false,
    chargingTime: batteryState?.chargingTime ?? null,
    dischargingTime: batteryState?.dischargingTime ?? null,
    isSupported,
  };
}

