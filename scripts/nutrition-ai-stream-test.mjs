// Run from the repository root: node scripts/nutrition-ai-stream-test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(new URL('../frontend/package.json', import.meta.url));
const ts = require('typescript');
const source = readFileSync(new URL('../frontend/src/services/api.service.ts', import.meta.url), 'utf8');
const code = ts.transpile(source.slice(source.indexOf('export const nutritionAiApi ='),
  source.indexOf('// ===== CUSTOM MIX')).replace('export const nutritionAiApi', 'globalThis.nutritionAiApi'),
  { target: ts.ScriptTarget.ES2022 });
const frame = (value) => `data: ${typeof value === 'string' ? value : JSON.stringify(value)}\n\n`;
const chunk = frame({ event: 'chunk', text: 'Xin chào 🌱' });
const done = frame('[DONE]');

async function check(name, packets, expected, failure) {
  const events = [];
  let body;
  const stream = new ReadableStream({
    start(controller) {
      for (const packet of packets) controller.enqueue(packet);
      if (failure) controller.error(failure);
      else controller.close();
    },
  });
  const context = {
    TextDecoder, API_URL: 'http://mock',
    fetch: async (_url, options) => {
      body = JSON.parse(options.body);
      return { ok: true, body: stream };
    },
  };
  vm.createContext(context);
  vm.runInContext(code, context);
  await context.nutritionAiApi.stream({ message: 'Hello', language: 'en' }, {
    onChunk: text => events.push(['chunk', text]),
    onDone: () => events.push(['done']),
    onError: () => events.push(['error']),
  });
  assert.deepEqual(events, expected, name);
  assert.equal(body.language, 'en');
  assert.equal(stream.locked, false, 'Reader lock released');
  console.log(`PASS: ${name}`);
}
const bytes = text => new TextEncoder().encode(text);
await check('Complete response', [bytes(chunk + done)], [['chunk', 'Xin chào 🌱'], ['done']]);
await check('UTF-8 and SSE frames split at every byte', [...bytes(chunk + done)].map(b => new Uint8Array([b])),
  [['chunk', 'Xin chào 🌱'], ['done']]);
await check('CRLF frames', [bytes((chunk + done).replaceAll('\n', '\r\n'))], [['chunk', 'Xin chào 🌱'], ['done']]);
await check('Empty EOF', [], [['error']]);
await check('Empty completed response', [bytes(done)], [['error']]);
await check('Truncated response', [bytes(chunk)], [['chunk', 'Xin chào 🌱'], ['error']]);
await check('Malformed frame', [bytes('data: {broken}\n\n')], [['error']]);
await check('Server error is terminal', [bytes(frame({ event: 'error', message: 'Unavailable' }) + done)], [['error']]);
await check('Network failure', [], [['error']], new Error('Connection lost'));
await check('Cancellation', [], [], new DOMException('Aborted', 'AbortError'));
