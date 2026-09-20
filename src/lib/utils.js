import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility helper to conditionally merge Tailwind CSS class names
 * compliant with Shadcn UI standards.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
