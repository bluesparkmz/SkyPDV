import { useMemo, useState, useEffect } from "react";
import { profileApi } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

export type WhatsappPrefs = {
  enabled: boolean;
  phone: string;
  saved?: boolean;
};

export function useWhatsappPrefs() {
  const { user, refreshUser } = useAuth();
  const [prefs, setPrefs] = useState<WhatsappPrefs>({ enabled: false, phone: "", saved: false });

  useEffect(() => {
    const phone = user?.user?.phone || "";
    if (phone) {
      setPrefs((p) => ({ ...p, phone, saved: true }));
    }
  }, [user?.user?.phone]);

  const update = (partial: Partial<WhatsappPrefs>) => {
    setPrefs({ ...prefs, ...partial });
  };

  const isReady = useMemo(() => prefs.enabled && !!prefs.phone.trim(), [prefs.enabled, prefs.phone]);

  const saveToBackend = async (phone: string) => {
    try {
      await profileApi.updatePhone(phone);
      setPrefs({ ...prefs, phone, saved: true });
      await refreshUser();
    } catch {
      // ignore errors
    }
  };

  return { prefs, setPrefs: update, isReady, saveToBackend };
}
