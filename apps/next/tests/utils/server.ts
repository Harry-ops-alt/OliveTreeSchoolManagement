import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { apiUrl, baseUrl } from '../config';

const repoRoot = path.resolve(__dirname, '..', '..', '..');

const spawned: { name: 'api' | 'next'; process: ChildProcess }[] = [];
const startedByTests = { api: false, next: false };
let ensurePromise: Promise<void> | null = null;

function healthUrl(url: string): string {
  const normalised = url.endsWith('/') ? url.slice(0, -1) : url;
  return `${normalised}/healthz`;
}

async function isHealthy(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const response = await fetch(healthUrl(url), { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) {
      return false;
    }

    const payload = await response.json().catch(() => null);
    return Boolean(payload?.ok);
  } catch (error) {
    return false;
  }
}

async function waitForHealth(url: string, timeoutMs = 60_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (await isHealthy(url)) {
      return;
    }
    await delay(1_000);
  }

  throw new Error(`Timed out waiting for ${healthUrl(url)} to become healthy`);
}

function spawnProcess(
  name: 'api' | 'next',
  args: string[],
  extraEnv: Record<string, string | undefined> = {},
): ChildProcess {
  const proc = spawn('pnpm', args, {
    cwd: repoRoot,
    env: { ...process.env, NODE_ENV: process.env.NODE_ENV ?? 'development', ...extraEnv },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  proc.stdout?.on('data', (chunk: Buffer) => {
    process.stdout.write(`[${name}] ${chunk}`);
  });

  proc.stderr?.on('data', (chunk: Buffer) => {
    process.stderr.write(`[${name}] ${chunk}`);
  });

  spawned.push({ name, process: proc });
  return proc;
}

async function ensureStarted(): Promise<void> {
  const apiHealthy = await isHealthy(apiUrl);
  const nextHealthy = await isHealthy(baseUrl);

  if (!apiHealthy) {
    spawnProcess('api', ['--filter', 'api', 'start:dev'], { PORT: '3001' });
    startedByTests.api = true;
  }

  if (!nextHealthy) {
    spawnProcess('next', ['--filter', 'next', 'dev', '--', '-p', '3000'], {
      PORT: '3000',
    });
    startedByTests.next = true;
  }

  await Promise.all([
    waitForHealth(apiUrl),
    waitForHealth(baseUrl),
  ]);
}

export async function ensureServersUp(): Promise<void> {
  if (!ensurePromise) {
    ensurePromise = ensureStarted().catch((error) => {
      ensurePromise = null;
      throw error;
    });
  }

  await ensurePromise;
}

export async function shutdownServers(): Promise<void> {
  const processesToStop = spawned.filter((entry) => {
    if (entry.name === 'api' && startedByTests.api) {
      return true;
    }
    if (entry.name === 'next' && startedByTests.next) {
      return true;
    }
    return false;
  });

  if (!processesToStop.length) {
    return;
  }

  for (const entry of processesToStop) {
    entry.process.kill();
  }

  await Promise.all(
    processesToStop.map((entry) => once(entry.process, 'exit').catch(() => undefined)),
  );

  spawned.length = 0;
  startedByTests.api = false;
  startedByTests.next = false;
  ensurePromise = null;
}
