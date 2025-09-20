import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const getAccessToken = (): string | null => {
  const tokenString = localStorage.getItem("access_token");
  if (!tokenString) return null;

  try {
    const tokenObj = JSON.parse(tokenString);
    if (new Date().getTime() > tokenObj.expiry) {
      localStorage.removeItem("access_token"); // Remove expired token
      return null;
    }
    return tokenObj.value;
  } catch (e) {
    return null;
  }
};
