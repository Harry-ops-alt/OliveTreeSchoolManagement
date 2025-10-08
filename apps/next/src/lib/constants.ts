export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3001';

export const API_BASE_URL = API_BASE;

export const AUTH_COOKIE_NAME = "olive.access_token";

export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
