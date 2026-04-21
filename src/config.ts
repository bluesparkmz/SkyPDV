const DEFAULT_API_URL = "https://skypdvmz.bluesparkmz.com";
const DEFAULT_ACCOUNTS_URL = "https://accounts.bluesparkmz.com";
const DEFAULT_PRODUCT_CODE = "skypdv";
const DEFAULT_HARDWARE_PLUGIN_URL = "";

function normalize(url: string | undefined): string {
  if (!url) return DEFAULT_API_URL;
  const trimmed = url.replace(/\/+$/, "");
  // Migração automática: se alguém ainda deixou api.skyvenda.com em variáveis de ambiente,
  // redirecionamos para o novo backend standalone.
  if (trimmed.includes("api.skyvenda.com")) {
    return DEFAULT_API_URL;
  }
  return trimmed;
}

export const API_URL = normalize(import.meta.env.VITE_SKYPDV_API_URL);
export const ACCOUNTS_URL = (import.meta.env.VITE_BLUESPARK_ACCOUNTS_URL || DEFAULT_ACCOUNTS_URL).replace(/\/+$/, "");
export const PRODUCT_CODE = import.meta.env.VITE_BLUESPARK_PRODUCT_CODE || DEFAULT_PRODUCT_CODE;
export const HARDWARE_PLUGIN_URL = (import.meta.env.VITE_SKYPDV_HARDWARE_PLUGIN_URL || DEFAULT_HARDWARE_PLUGIN_URL).trim();

export function buildWsUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (API_URL.startsWith("https://")) {
    return `wss://${API_URL.slice("https://".length)}${normalizedPath}`;
  }
  if (API_URL.startsWith("http://")) {
    return `ws://${API_URL.slice("http://".length)}${normalizedPath}`;
  }
  return `ws://${API_URL}${normalizedPath}`;
}
