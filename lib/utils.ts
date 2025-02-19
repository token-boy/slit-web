import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { IS_DEV } from "./constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))  
}

export function isMobileDevice() {
  return window.innerWidth < 768
}

export function getStorage() {
    return IS_DEV ? sessionStorage : localStorage
}
