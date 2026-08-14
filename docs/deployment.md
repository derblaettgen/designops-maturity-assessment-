# Production deployment

Production uses a versioned-release layout managed by systemd:

```text
/srv/apps/designops/
├── source/                 # deployment checkout; never served by Nginx
├── releases/<git-sha>/     # immutable frontend and API releases
└── current -> releases/... # atomically selected live release

/etc/designops/designops.env       # server-only Mongo URI and maintenance key
/etc/systemd/system/designops-api.service
```

Every push to `main` runs `.github/workflows/deploy.yml`. The workflow connects
to the VPS, fetches the exact pushed commit into `source`, and runs
`ops/deploy-vps.sh`. The script tests and builds before publishing anything,
creates a new release, atomically changes `current`, restarts
`designops-api.service`, and verifies both the API and the public frontend.

If service startup or verification fails, the script restores the previous
`current` target and restarts that release. Existing releases are intentionally
kept for explicit rollback; prune old releases only after confirming which
target `current` uses.

The runtime process is the non-login user `app-designops`. Only the built
`dist` directory is public-readable for Nginx. Backend source and
`/etc/designops/designops.env` remain restricted. Never add production secrets
to this repository or to a frontend environment variable.

Useful checks on the VPS:

```bash
readlink -f /srv/apps/designops/current
systemctl status designops-api.service
journalctl -u designops-api.service -n 100 --no-pager
curl --fail http://127.0.0.1:3101/api/v1/health
nginx -t
```
