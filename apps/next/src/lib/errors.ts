export class MissingAuthTokenError extends Error {
  constructor() {
    super('Missing authentication token');
    this.name = 'MissingAuthTokenError';
  }
}

export class UnauthorizedError extends Error {
  constructor() {
    super('Authentication token is invalid or expired');
    this.name = 'UnauthorizedError';
  }
}
