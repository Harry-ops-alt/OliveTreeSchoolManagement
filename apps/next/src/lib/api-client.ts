'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { API_BASE, AUTH_COOKIE_NAME } from './constants';
import { MissingAuthTokenError, UnauthorizedError } from './errors';

export interface ApiFetchOptions extends RequestInit {
  /**
   * When true (default), the current access token will be attached and 401 responses trigger a redirect.
   */
  auth?: boolean;
  /**
   * When true (default) the helper will redirect to the login page if authentication fails.
   */
  redirectOnUnauthorized?: boolean;
}

const SESSION_EXPIRED_MESSAGE = encodeURIComponent(
  'Your session has expired. Please sign in again to continue.',
);

function resolveUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const base = API_BASE.replace(/\/$/, '');
  const normalisedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalisedPath}`;
}

export async function apiFetch(
  path: string,
  { auth = true, redirectOnUnauthorized = true, headers, cache = 'no-store', ...init }: ApiFetchOptions = {},
): Promise<Response> {
  const requestHeaders = new Headers(headers ?? {});

  if (init.body && !(init.body instanceof FormData) && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  let token: string | undefined;

  if (auth) {
    token = cookies().get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      if (redirectOnUnauthorized) {
        redirect(`/login?error=${SESSION_EXPIRED_MESSAGE}`);
      }

      throw new MissingAuthTokenError();
    }

    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(resolveUrl(path), {
    ...init,
    headers: requestHeaders,
    cache,
  });

  if (auth && response.status === 401) {
    if (redirectOnUnauthorized) {
      redirect(`/login?error=${SESSION_EXPIRED_MESSAGE}`);
    }

    throw new UnauthorizedError();
  }

  return response;
}
