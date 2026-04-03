const DEFAULT_API_URL = "https://skypdvmz.bluesparkmz.com";
const DEFAULT_ACCOUNTS_URL = "https://accounts.bluesparkmz.com";
const DEFAULT_PRODUCT_CODE = "skypdv";

export const API_URL = (import.meta.env.VITE_SKYPDV_API_URL || DEFAULT_API_URL).replace(/\/+$/, "");
export const ACCOUNTS_URL = (import.meta.env.VITE_BLUESPARK_ACCOUNTS_URL || DEFAULT_ACCOUNTS_URL).replace(/\/+$/, "");
export const PRODUCT_CODE = import.meta.env.VITE_BLUESPARK_PRODUCT_CODE || DEFAULT_PRODUCT_CODE;

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
