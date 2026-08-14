# Survey API

The survey API intentionally exposes survey creation and read operations publicly.
The destructive `DELETE /api/v1/survey/:id` operation remains protected by the
server-only `API_KEY` environment variable and the `X-API-Key` request header.

The API binds to `127.0.0.1` by default so it is reachable through the local
Nginx reverse proxy without exposing the Node.js port directly. Set `HOST` and
`PORT` explicitly when a deployment needs a different internal listener.

Copy `.env.example` to `.env` and provide deployment-specific values. Never commit
the real `.env` file or expose `API_KEY` through a `VITE_*` frontend variable.

## Commands

```sh
npm ci
npm test
npm start
```
