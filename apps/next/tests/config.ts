export const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
export const apiUrl = process.env.API_BASE_URL ?? 'http://localhost:3001';

export const e2eUser = {
  email: process.env.E2E_USER_EMAIL ?? 'admin@olive.school',
  password: process.env.E2E_USER_PASSWORD ?? 'AdminPass123!',
};

