/**
 * Smoke E2E sanity: verifies server health, SPA route serving, simple-auth session,
 * and Socket.IO basic contract: driver online -> admin receives status_changed.
 *
 * Run with: npm run test:smoke
 */

import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { io as ioc } from 'socket.io-client';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5100';

async function waitForServer(timeoutMs = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BASE_URL}/api/health`, { method: 'GET' });
      if (res.ok) return true;
    } catch {}
    await delay(500);
  }
  return false;
}

async function ensureServerRunning() {
  // Always spawn an isolated dev server for the test on a dedicated port
  const proc = spawn('npm', ['run', 'dev'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      SIMPLE_AUTH: 'true',
      ALLOW_SIMPLE_AUTH_ROUTES: 'true',
      NODE_ENV: 'development',
      PORT: new URL(BASE_URL).port || '5100',
    },
    stdio: 'pipe',
  });

  // Wait until health endpoint responds
  const ok = await waitForServer(40_000);
  if (!ok) {
    proc.kill('SIGKILL');
    throw new Error('Dev server failed to start within timeout');
  }
  return { proc };
}

async function getWithCookies(path: string, cookies?: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: cookies ? { cookie: cookies } : undefined,
    redirect: 'manual',
  });
  return res;
}

async function postJsonWithCookies(path: string, body: any, cookies?: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(cookies ? { cookie: cookies } : {}),
    },
    body: JSON.stringify(body),
    redirect: 'manual',
  });
  // Node/undici exposes getSetCookie(); fall back to single header
  const h: any = res.headers as any;
  const arr: string[] | undefined = typeof h.getSetCookie === 'function' ? h.getSetCookie() : undefined;
  const setCookie = arr?.join('; ') || res.headers.get('set-cookie') || undefined;
  return { res, setCookie };
}

function assert(condition: any, msg: string) {
  if (!condition) throw new Error(msg);
}

async function testHealthAndSpa() {
  const res = await fetch(`${BASE_URL}/api/health`);
  assert(res.ok, 'health endpoint not OK');
  const data = await res.json();
  assert(data && typeof data.ok === 'boolean', 'health payload malformed');

  // Check SPA routes return index.html content
  for (const path of ['/', '/rider', '/driver', '/admin']) {
    const r = await fetch(`${BASE_URL}${path}`);
    assert(r.ok, `${path} did not return 200`);
    const html = await r.text();
    assert(html.includes('<div id="root"></div>'), `${path} did not serve SPA index`);
  }
}

async function testSimpleAuthSession() {
  // Only available when SIMPLE_AUTH=true or ALLOW_SIMPLE_AUTH_ROUTES=true
  const { res } = await postJsonWithCookies('/api/auth/login', {
    email: 'test+rider@example.com',
    name: 'Test Rider',
    role: 'rider',
  });
  assert(res.ok, `/api/auth/login failed: ${res.status}`);
  const body = await res.json().catch(() => ({}));
  assert(body?.success === true, 'login did not return success=true');
}

async function testSocketContract() {
  const adminSocket = ioc(BASE_URL, {
    forceNew: true,
    timeout: 10_000,
    auth: { userId: 'admin-1', userType: 'admin' },
  });

  const driverSocket = ioc(BASE_URL, {
    forceNew: true,
    timeout: 10_000,
    auth: { userId: 'driver-1', userType: 'driver' },
  });

  let adminSawOnline = false;
  const gotOnline = new Promise<void>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('admin did not receive driver:status_changed')), 10_000);
    adminSocket.on('driver:status_changed', (evt: any) => {
      if (evt?.driverId === 'driver-1' && evt?.status === 'online') {
        adminSawOnline = true;
        clearTimeout(t);
        resolve();
      }
    });
  });

  await new Promise<void>((resolve, reject) => {
    adminSocket.on('connect', () => resolve());
    adminSocket.on('connect_error', reject);
  });
  await new Promise<void>((resolve, reject) => {
    driverSocket.on('connect', () => resolve());
    driverSocket.on('connect_error', reject);
  });

  // Emit driver online with a sample location
  driverSocket.emit('driver:online', { location: { lat: 28.61, lng: 77.21, speed: 0, heading: 0 } });

  await gotOnline;
  assert(adminSawOnline, 'admin did not observe driver online');

  adminSocket.disconnect();
  driverSocket.disconnect();
}

async function main() {
  console.log('🧪 Smoke E2E starting...');
  const { proc } = await ensureServerRunning();
  try {
    // Give the server a brief moment to settle
    await waitForServer(5000);
    await testHealthAndSpa();
    console.log('✅ Health and SPA routes OK');
  await testSimpleAuthSession();
  console.log('✅ Simple auth login OK');
    await testSocketContract();
    console.log('✅ Socket.IO contract OK');
    console.log('\n🎉 Smoke E2E PASS');
  } finally {
    if (proc) {
      proc.kill('SIGTERM');
      await delay(500);
    }
  }
}

// Run if invoked directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('❌ Smoke E2E FAIL:', err);
    process.exit(1);
  });
}

export default main;
