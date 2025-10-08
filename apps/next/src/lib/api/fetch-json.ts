'use client';

import { API_BASE } from '../constants';

export type FetchJsonOptions = {
  method?: string;
  headers?: HeadersInit;
  body?: unknown;
  /**
   * When true (default), includes credentials (cookies) in the request.
   */
  includeCredentials?: boolean;
  /**
   * Optional signal to abort the request.
   */
  signal?: AbortSignal;
};

export type FetchJsonInit<TBody> = Omit<FetchJsonOptions, 'body'> & {
  body?: TBody;
};

export class ApiError<T = unknown> extends Error {
  readonly status: number;
  readonly data: T | null;

  constructor(status: number, message: string, data: T | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function isApiError<T = unknown>(value: unknown): value is ApiError<T> {
  return value instanceof ApiError;
}

export function isApiNotFoundError(value: unknown): value is ApiError {
  return isApiError(value) && value.status === 404;
}

function resolveUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const base = API_BASE.replace(/\/$/, '');
  const normalisedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalisedPath}`;
}

function normaliseBody(body: unknown): BodyInit | null {
  if (body == null) {
    return null;
  }

  if (body instanceof FormData || body instanceof Blob || body instanceof ArrayBuffer) {
    return body;
  }

  if (typeof body === 'string') {
    return body;
  }

  return JSON.stringify(body);
}

export async function fetchJson<TResponse, TBody = unknown>(
  path: string,
  { method = 'GET', headers, body, includeCredentials = true, signal }: FetchJsonInit<TBody> = {},
): Promise<TResponse> {
  const requestHeaders = new Headers(headers);
  const resolvedBody = normaliseBody(body);

  if (resolvedBody && !requestHeaders.has('Content-Type') && !(resolvedBody instanceof FormData)) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  let response: Response;

  try {
    response = await fetch(resolveUrl(path), {
      method,
      headers: requestHeaders,
      body: resolvedBody ?? undefined,
      credentials: includeCredentials ? 'include' : 'same-origin',
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }

    throw new ApiError(0, 'Unable to reach the Olive Tree API');
  }

  const contentType = response.headers.get('Content-Type') ?? '';
  const isJson = contentType.includes('application/json');

  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
        ? payload.message
        : undefined) ?? `Request failed with status ${response.status}`;

    throw new ApiError(response.status, message, payload);
  }

  return (payload as TResponse) ?? (undefined as TResponse);
}
