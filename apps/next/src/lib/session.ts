'use server';

import { cache } from 'react';
import { apiFetch } from './api-client';
import { MissingAuthTokenError, UnauthorizedError } from './errors';

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  orgId?: string | null;
  branchId?: string | null;
}

export const getSession = cache(async (): Promise<SessionUser | null> => {
  try {
    const response = await apiFetch('/auth/me', {
      redirectOnUnauthorized: false,
    });

    if (!response.ok) {
      return null;
    }

    const user = (await response.json()) as SessionUser;
    return user;
  } catch (error) {
    if (error instanceof MissingAuthTokenError || error instanceof UnauthorizedError) {
      return null;
    }
    console.error('Failed to fetch session', error);
    return null;
  }
});
