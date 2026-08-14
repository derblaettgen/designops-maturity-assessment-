const test = require('node:test');
const assert = require('node:assert/strict');

const authMiddleware = require('../src/auth.middleware');
const surveyRoutes = require('../src/survey.routes');

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test('maintenance auth rejects requests without the API key', () => {
  process.env.API_KEY = 'maintenance-secret';
  const response = createResponse();
  let nextCalled = false;

  authMiddleware({ headers: {} }, response, () => {
    nextCalled = true;
  });

  assert.equal(response.statusCode, 401);
  assert.equal(nextCalled, false);
});

test('maintenance auth rejects an incorrect API key', () => {
  process.env.API_KEY = 'maintenance-secret';
  const response = createResponse();
  let nextCalled = false;

  authMiddleware(
    { headers: { 'x-api-key': 'incorrect-secret' } },
    response,
    () => {
      nextCalled = true;
    },
  );

  assert.equal(response.statusCode, 401);
  assert.equal(nextCalled, false);
});

test('maintenance auth accepts the server-side API key', () => {
  process.env.API_KEY = 'maintenance-secret';
  const response = createResponse();
  let nextCalled = false;

  authMiddleware(
    { headers: { 'x-api-key': 'maintenance-secret' } },
    response,
    () => {
      nextCalled = true;
    },
  );

  assert.equal(nextCalled, true);
});

test('only DELETE routes include the maintenance auth middleware', () => {
  const routedLayers = surveyRoutes.stack.filter((layer) => layer.route);

  for (const layer of routedLayers) {
    const methods = Object.keys(layer.route.methods);
    const middleware = layer.route.stack.map((entry) => entry.handle);

    if (methods.includes('delete')) {
      assert.equal(middleware.includes(authMiddleware), true);
    } else {
      assert.equal(middleware.includes(authMiddleware), false);
    }
  }
});
