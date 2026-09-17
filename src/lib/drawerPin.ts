export const DRAWER_PIN_STORAGE_KEY = "skypdv_drawer_pin_config";

export interface DrawerPinConfig {
  enabled: boolean;
  pin: string; // 4 dígitos
}

export function loadDrawerPinConfig(): DrawerPinConfig {
  if (typeof window === "undefined" || !window.localStorage) {
    return { enabled: false, pin: "" };
  }
  try {
    const raw = localStorage.getItem(DRAWER_PIN_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        enabled: Boolean(parsed.enabled),
        pin: typeof parsed.pin === "string" ? parsed.pin : "",
      };
    }
  } catch (error) {
    console.warn("Erro ao carregar configuracao de PIN da gaveta:", error);
  }
  return { enabled: false, pin: "" };
}

export function saveDrawerPinConfig(cfg: DrawerPinConfig): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    localStorage.setItem(DRAWER_PIN_STORAGE_KEY, JSON.stringify(cfg));
  } catch (error) {
    console.error("Erro ao salvar configuracao de PIN da gaveta:", error);
  }
}

export function isDrawerPinRequired(): boolean {
  const config = loadDrawerPinConfig();
  return Boolean(config.enabled && config.pin && config.pin.length === 4);
}

export function verifyDrawerPin(inputPin: string): boolean {
  const config = loadDrawerPinConfig();
  if (!config.enabled) return true;
  return config.pin === inputPin;
}
