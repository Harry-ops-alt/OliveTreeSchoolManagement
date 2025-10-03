import { spawn } from 'node:child_process';
import { once } from 'node:events';
import path from 'node:path';
import process from 'node:process';

import { ensureServersUp, shutdownServers } from './utils/server';

async function runPlaywright() {
  const repoRoot = path.resolve(__dirname, '..', '..', '..');

  const proc = spawn('pnpm', ['--filter', 'next', 'exec', 'playwright', 'test'], {
    cwd: repoRoot,
    env: {
      ...process.env,
      PLAYWRIGHT_BASE_URL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
      API_BASE_URL: process.env.API_BASE_URL ?? 'http://localhost:3001',
      E2E_USER_EMAIL: process.env.E2E_USER_EMAIL ?? 'admin@olive.school',
      E2E_USER_PASSWORD: process.env.E2E_USER_PASSWORD ?? 'AdminPass123!',
    },
    stdio: 'inherit',
  });

  const [code] = (await once(proc, 'exit')) as [number | null, NodeJS.Signals | null];
  return code ?? 0;
}

async function main() {
  await ensureServersUp();
  const code = await runPlaywright();
  await shutdownServers();

  process.exit(code);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
