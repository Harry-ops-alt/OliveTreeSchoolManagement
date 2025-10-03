import { shutdownServers } from './utils/server';

export default async function globalTeardown() {
  await shutdownServers();
}
