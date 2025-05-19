import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
// Application time zone for formatting dates consistently
export const TIME_ZONE = process.env.NEXT_PUBLIC_TIME_ZONE || 'America/Santo_Domingo'
