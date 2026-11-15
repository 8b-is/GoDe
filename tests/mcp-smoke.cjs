const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { createInterface } = require('node:readline');

test('standalone MCP lists color groups over stdio', { timeout: 10000 }, async () => {
  const server = spawn(process.execPath, ['out/mcp/standalone.js'], {
    env: { ...process.env, BRIDGE_PORT: '9' },
    stdio: ['pipe', 'pipe', 'ignore'],
  });
  const lines = createInterface({ input: server.stdout });
  const pending = new Map();
  lines.on('line', (line) => {
    const response = JSON.parse(line);
    const resolve = pending.get(response.id);
    if (resolve) resolve(response);
  });
  const send = (message) => server.stdin.write(JSON.stringify(message) + '\n');
  const request = (id, method, params) => new Promise((resolve) => {
    pending.set(id, resolve);
    send({ jsonrpc: '2.0', id, method, params });
  });
  try {
    const initialized = await request(1, 'initialize', {
      protocolVersion: '2024-11-05', capabilities: {},
      clientInfo: { name: 'mcp-smoke', version: '1' },
    });
    assert.equal(initialized.error, undefined);
    send({ jsonrpc: '2.0', method: 'notifications/initialized' });
    const listed = await request(2, 'tools/list', {});
    assert.ok(listed.result.tools.some((tool) => tool.name === 'listColorGroups'));
    const called = await request(3, 'tools/call', { name: 'listColorGroups', arguments: {} });
    assert.equal(called.error, undefined);
    assert.equal(called.result.isError, undefined);
    const { groups } = JSON.parse(called.result.content[0].text);
    assert.ok(groups.some((group) => group.id === 'editor' && group.keyCount > 0));
    assert.ok(groups.every((group) => group.id !== 'default'));
  } finally {
    lines.close();
    server.kill();
  }
});
