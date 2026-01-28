import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function resolveAvatar(photo: string | null | undefined, baseUrl: string) {
  if (!photo) return "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
  if (photo.startsWith("http")) return photo;
  return `${baseUrl}${photo.startsWith("/") ? "" : "/"}${photo}`;
}
