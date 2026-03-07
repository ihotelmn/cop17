import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getHotelImageUrl(path: string | null | undefined): string {
  if (!path) return "/images/hotel-placeholder.png";
  if (path.startsWith('http')) return path;

  // Ensure we have a leading slash for the API path
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `https://api.myhotel.mn/image?path=${cleanPath}`;
}
