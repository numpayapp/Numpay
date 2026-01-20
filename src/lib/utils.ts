import { clsx, type ClassValue } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";
import { createPublicClient, http } from "viem";
import { sepolia, baseSepolia, base } from "viem/chains";

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

export const publicClient = createPublicClient({
  chain: base,
  transport: http(import.meta.env.VITE_APP_ZERODEV_RPC!),
});
