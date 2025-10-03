import type { SessionUserData } from '../users/users.service.js';

export interface AuthTokenPayload extends SessionUserData {
  sub: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: SessionUserData;
}
