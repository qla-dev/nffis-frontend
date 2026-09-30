import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';

const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const baseUrl = (process.env.NFFIS_BENCHMARK_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const login = process.env.NFFIS_BENCHMARK_LOGIN;
const password = process.env.NFFIS_BENCHMARK_PASSWORD;
const runs = Math.max(1, Number.parseInt(process.env.NFFIS_BENCHMARK_RUNS || '3', 10));
const profile = mkdtempSync(path.join(tmpdir(), 'nffis-map-benchmark-'));
const debugPort = 9333;

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitForJson(url, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch {
      // Chrome has not exposed its debugging endpoint yet.
    }
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

class CdpClient {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.nextId = 1;
    this.pending = new Map();
    this.events = [];
    this.ready = new Promise((resolve, reject) => {
      this.socket.onopen = resolve;
      this.socket.onerror = () => reject(new Error('Unable to connect to Chrome DevTools.'));
    });
    this.socket.onmessage = ({ data }) => {
      const message = JSON.parse(String(data));
      if (!message.id) {
        if (message.method === 'Runtime.exceptionThrown' || message.method === 'Log.entryAdded') this.events.push(message);
        return;
      }
      const request = this.pending.get(message.id);
      if (!request) return;
      this.pending.delete(message.id);
      if (message.error) request.reject(new Error(message.error.message));
      else request.resolve(message.result);
    };
  }

  async send(method, params = {}) {
    await this.ready;
    const id = this.nextId++;
    const result = new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
    this.socket.send(JSON.stringify({ id, method, params }));
    return result;
  }

  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Browser evaluation failed.');
    return result.result?.value;
  }

  close() {
    this.socket.close();
  }
}

async function waitFor(client, expression, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await client.evaluate(expression)) return;
    await delay(150);
  }
  throw new Error(`Timed out waiting for browser condition: ${expression}`);
}

function summarize(samples) {
  const numeric = (field) => samples.map((sample) => Number(sample[field] || 0));
  const average = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
  return {
    renderer: samples[0].renderer,
    runs: samples.length,
    mapLoadMs: Math.round(average(numeric('mapLoadMs'))),
    operationalMs: Math.round(average(numeric('operationalMs'))),
    sourceErrors: Math.round(average(numeric('sourceErrors')) * 10) / 10,
    longTasks: Math.round(average(numeric('longTasks')) * 10) / 10,
    longTaskDurationMs: Math.round(average(numeric('longTaskDurationMs'))),
    resourceTransferKB: Math.round(average(numeric('resourceTransferKB'))),
    resourceCount: Math.round(average(numeric('resourceCount'))),
  };
}

const chrome = spawn(chromePath, [
  '--headless=new',
  '--disable-gpu-sandbox',
  '--no-first-run',
  '--no-default-browser-check',
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${profile}`,
  'about:blank',
], { stdio: 'ignore', windowsHide: true });

try {
  await waitForJson(`http://127.0.0.1:${debugPort}/json/version`);
  const pageResponse = await fetch(`http://127.0.0.1:${debugPort}/json/new?${encodeURIComponent(baseUrl)}`, { method: 'PUT' });
  const page = await pageResponse.json();
  const client = new CdpClient(page.webSocketDebuggerUrl);
  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('Log.enable');
  await client.send('Page.navigate', { url: baseUrl });
  await waitFor(client, `document.readyState === "complete" && location.origin === ${JSON.stringify(new URL(baseUrl).origin)}`);

  const authenticated = await client.evaluate(`fetch('/api/me', { credentials: 'include', headers: { Accept: 'application/json' } }).then(r => r.ok)`);
  if (!authenticated) {
    if (!login || !password) {
      throw new Error('Set NFFIS_BENCHMARK_LOGIN and NFFIS_BENCHMARK_PASSWORD to benchmark the authenticated map.');
    }
    const loginResult = await client.evaluate(`(async () => {
      await fetch('/sanctum/csrf-cookie', { credentials: 'include', headers: { Accept: 'application/json' } });
      const entry = document.cookie.split('; ').find(item => item.startsWith('XSRF-TOKEN='));
      const token = entry ? decodeURIComponent(entry.slice('XSRF-TOKEN='.length)) : '';
      const response = await fetch('/api/login', {
        method: 'POST', credentials: 'include',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-XSRF-TOKEN': token },
        body: JSON.stringify({ login: ${JSON.stringify(login)}, password: ${JSON.stringify(password)} }),
      });
      return { ok: response.ok, status: response.status };
    })()`);
    if (!loginResult?.ok) throw new Error(`Benchmark login failed (${loginResult?.status || 'unknown status'}).`);
  }

  const results = [];
  for (const renderer of ['leaflet', 'mapbox']) {
    const samples = [];
    for (let run = 0; run < runs; run += 1) {
      await client.send('Network.enable');
      await client.send('Network.clearBrowserCache');
      await client.send('Page.navigate', { url: `${baseUrl}/?mapRenderer=${renderer}&benchmarkRun=${run}` });
      try {
        await waitFor(client, `window.__NFFIS_MAP_METRICS__?.renderer === ${JSON.stringify(renderer)} && window.__NFFIS_MAP_METRICS__?.operationalMs !== null`, 45_000);
      } catch (error) {
        const diagnostics = await client.evaluate(`({ metrics: window.__NFFIS_MAP_METRICS__ || null, text: document.body.innerText.slice(0, 1200) })`);
        console.error(JSON.stringify({ renderer, diagnostics, browserEvents: client.events.slice(-10) }, null, 2));
        throw error;
      }
      if (renderer === 'mapbox') {
        const isolation = await client.evaluate(`({
          hasMapboxCanvas: Boolean(document.querySelector('.mapboxgl-canvas')),
          hasLeafletContainer: Boolean(document.querySelector('.leaflet-container')),
        })`);
        if (!isolation?.hasMapboxCanvas || isolation.hasLeafletContainer) {
          throw new Error(`Mapbox renderer isolation failed: ${JSON.stringify(isolation)}`);
        }
      }
      await delay(1_000);
      samples.push(await client.evaluate(`(() => {
        const metrics = structuredClone(window.__NFFIS_MAP_METRICS__);
        const resources = performance.getEntriesByType('resource');
        metrics.resourceTransferKB = resources.reduce((sum, entry) => sum + (entry.transferSize || 0), 0) / 1024;
        metrics.resourceCount = resources.length;
        return metrics;
      })()`));
    }
    results.push(summarize(samples));
  }

  console.table(results);
  console.log(JSON.stringify({ generatedAt: new Date().toISOString(), baseUrl, results }, null, 2));
  client.close();
} finally {
  chrome.kill();
  await delay(250);
  rmSync(profile, { recursive: true, force: true });
}
