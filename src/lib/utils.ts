import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const HOTEL_IMAGE_PLACEHOLDER = "/images/hotel-placeholder.png";

export function getHotelImageUrl(path: string | null | undefined): string {
  if (!path) return HOTEL_IMAGE_PLACEHOLDER;

  const trimmedPath = path.trim();
  if (!trimmedPath) return HOTEL_IMAGE_PLACEHOLDER;

  if (
    trimmedPath.startsWith("http://") ||
    trimmedPath.startsWith("https://") ||
    trimmedPath.startsWith("data:") ||
    trimmedPath.startsWith("blob:")
  ) {
    return trimmedPath;
  }

  if (trimmedPath.startsWith("/images/")) {
    return trimmedPath;
  }

  const cleanPath = trimmedPath.startsWith("/") ? trimmedPath : `/${trimmedPath}`;
  const query = new URLSearchParams({ path: cleanPath });

  return `https://api.myhotel.mn/image?${query.toString()}`;
}
