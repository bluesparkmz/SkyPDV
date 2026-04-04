import { useMemo } from "react";
import { useLocalStorage } from "./use-local-storage";
import { profileApi } from "@/services/api";

export type WhatsappPrefs = {
  enabled: boolean;
  phone: string;
  saved?: boolean;
};

const DEFAULT_PREFS: WhatsappPrefs = { enabled: false, phone: "" };

export function useWhatsappPrefs() {
  const [prefs, setPrefs] = useLocalStorage<WhatsappPrefs>("whatsapp_prefs", DEFAULT_PREFS);

  const update = (partial: Partial<WhatsappPrefs>) => {
    setPrefs({ ...prefs, ...partial });
  };

  const isReady = useMemo(() => prefs.enabled && !!prefs.phone.trim(), [prefs.enabled, prefs.phone]);

  const saveToBackend = async (phone: string) => {
    try {
      await profileApi.updatePhone(phone);
      setPrefs({ ...prefs, phone, saved: true });
    } catch {
      // ignore errors
    }
  };

  return { prefs, setPrefs: update, isReady, saveToBackend };
}
