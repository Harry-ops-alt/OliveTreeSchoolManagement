import { ensureServersUp } from './utils/server';

export default async function globalSetup() {
  await ensureServersUp();
}
