const env = (import.meta as { env?: { VITE_API_BASE_URL?: string } }).env;

export const API_BASE_URL = env?.VITE_API_BASE_URL ?? "https://sarateal.onrender.com";