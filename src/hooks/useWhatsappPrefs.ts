import { useMemo } from "react";
import { useLocalStorage } from "./use-local-storage";

export type WhatsappPrefs = {
  enabled: boolean;
  phone: string;
};

const DEFAULT_PREFS: WhatsappPrefs = { enabled: false, phone: "" };

export function useWhatsappPrefs() {
  const [prefs, setPrefs] = useLocalStorage<WhatsappPrefs>("whatsapp_prefs", DEFAULT_PREFS);

  const update = (partial: Partial<WhatsappPrefs>) => {
    setPrefs({ ...prefs, ...partial });
  };

  const isReady = useMemo(() => prefs.enabled && !!prefs.phone.trim(), [prefs.enabled, prefs.phone]);

  return { prefs, setPrefs: update, isReady };
}
