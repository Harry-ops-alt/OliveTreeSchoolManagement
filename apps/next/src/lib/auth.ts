"use server";

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect';
import { API_BASE, AUTH_COOKIE_MAX_AGE, AUTH_COOKIE_NAME } from './constants';

interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export async function loginAction(email: string, password: string) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const text = await res.text();

    if (!res.ok) {
      console.error('Auth failed', { status: res.status, text });
      throw new Error(`Auth API ${res.status}: ${text}`);
    }

    const data = JSON.parse(text) as LoginResponse;

    const expiresAt = new Date(Date.now() + data.expiresIn * 1000);

    cookies().set(AUTH_COOKIE_NAME, data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
      maxAge: AUTH_COOKIE_MAX_AGE,
    });

    return { ok: true as const, data };
  } catch (e: unknown) {
    console.error('Auth request error', e);
    throw new Error('Unable to reach authentication service.');
  }
}

function formatLoginError(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Unable to reach authentication service. Please try again.';
  }

  if (error.message === 'Unable to reach authentication service.') {
    return 'Unable to reach authentication service. Please try again.';
  }

  const apiMatch = error.message.match(/^Auth API (\d+):\s*(.*)$/);
  if (apiMatch) {
    const [, , payload] = apiMatch;
    try {
      const parsed = JSON.parse(payload);
      const message = Array.isArray(parsed?.message)
        ? parsed.message.join(', ')
        : parsed?.message ?? parsed?.error;
      if (typeof message === 'string' && message.trim().length) {
        return message;
      }
    } catch {
      if (payload.trim().length) {
        return payload;
      }
    }
    return 'Invalid credentials.';
  }

  return error.message;
}

export async function login(formData: FormData): Promise<void> {
  const email = formData.get('email');
  const password = formData.get('password');

  if (typeof email !== 'string' || typeof password !== 'string') {
    redirect('/login?error=' + encodeURIComponent('Email and password are required.'));
  }

  try {
    await loginAction(email, password);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    const message = formatLoginError(error);
    redirect('/login?error=' + encodeURIComponent(message));
  }
  redirect('/app');
}

export async function logout(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  redirect('/login');
}
