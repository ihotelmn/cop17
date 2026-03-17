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

export function roundCurrencyAmount(value: number | string | null | undefined): number {
  const numericValue = typeof value === "string" ? Number(value) : value ?? 0;

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.round(numericValue * 100) / 100;
}

export function formatUsd(value: number | string | null | undefined): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(roundCurrencyAmount(value));
}
