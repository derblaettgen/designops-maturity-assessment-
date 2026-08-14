const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 3001;

function getListenConfig(environment = process.env) {
  const host = environment.HOST?.trim() || DEFAULT_HOST;
  const rawPort = environment.PORT ?? DEFAULT_PORT;
  const port = Number(rawPort);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT value: ${rawPort}`);
  }

  return { host, port };
}

module.exports = {
  DEFAULT_HOST,
  DEFAULT_PORT,
  getListenConfig,
};
