const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DEFAULT_HOST,
  DEFAULT_PORT,
  getListenConfig,
} = require('../src/config');

test('API defaults to a loopback-only TCP listener', () => {
  assert.deepEqual(getListenConfig({}), {
    host: DEFAULT_HOST,
    port: DEFAULT_PORT,
  });
  assert.equal(DEFAULT_HOST, '127.0.0.1');
  assert.equal(DEFAULT_PORT, 3001);
});

test('API accepts the parallel systemd host and port', () => {
  assert.deepEqual(getListenConfig({ HOST: '127.0.0.1', PORT: '3101' }), {
    host: '127.0.0.1',
    port: 3101,
  });
});

test('API rejects a non-TCP port value', () => {
  assert.throws(
    () => getListenConfig({ HOST: '127.0.0.1', PORT: 'not-a-port' }),
    /Invalid PORT value/,
  );
});

test('API rejects a port outside the TCP range', () => {
  assert.throws(
    () => getListenConfig({ HOST: '127.0.0.1', PORT: '70000' }),
    /Invalid PORT value/,
  );
});
