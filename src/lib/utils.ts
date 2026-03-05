import { clsx, type ClassValue } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function showError(message: string, description?: string) {
  toast.error(message, {
    description,
  });
}

export function showSuccess(message: string, description?: string) {
  toast.success(message, {
    description,
  });
}

export function formatNumber(value: number | string) {
  if (typeof value === "string") {
    value = parseFloat(value);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

