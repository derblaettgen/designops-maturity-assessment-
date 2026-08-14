#!/usr/bin/env bash
set -euo pipefail

deploy_sha=${1:-}
app_root=/srv/apps/designops
source_dir="$app_root/source"
releases_dir="$app_root/releases"
release="$releases_dir/$deploy_sha"
current="$app_root/current"
service=designops-api.service
app_user=app-designops
app_group=app-designops

case "$deploy_sha" in
  ''|*[!0-9a-f]*) echo "Invalid deployment SHA" >&2; exit 10 ;;
esac
if [[ ${#deploy_sha} -ne 40 ]]; then
  echo "Deployment SHA must contain 40 hexadecimal characters" >&2
  exit 11
fi
if [[ $(git -C "$source_dir" rev-parse HEAD) != "$deploy_sha" ]]; then
  echo "The deployment checkout does not match $deploy_sha" >&2
  exit 12
fi
if [[ ! -f /etc/designops/designops.env ]]; then
  echo "Missing server-managed environment file" >&2
  exit 13
fi

install -d -o root -g "$app_group" -m 0755 "$app_root" "$releases_dir"

if [[ -d "$release" ]]; then
  if [[ $(readlink -f "$current" 2>/dev/null || true) == "$release" ]]; then
    systemctl restart "$service"
    curl --fail --silent --show-error \
      http://127.0.0.1:3101/api/v1/health >/dev/null
    echo "Release $deploy_sha was already current and is healthy."
    exit 0
  fi
  echo "Refusing to overwrite a non-current release: $release" >&2
  exit 14
fi

staging="$app_root/.release-$deploy_sha-$$"
previous=$(readlink -f "$current" 2>/dev/null || true)

cleanup_staging() {
  if [[ -d "$staging" ]]; then
    rm -rf --one-file-system "$staging"
  fi
}
trap cleanup_staging EXIT

# Test and build before changing the current release.
npm --prefix "$source_dir" ci --no-audit --no-fund
npm --prefix "$source_dir" test -- --run
npm --prefix "$source_dir" run build
test -f "$source_dir/dist/index.html"

install -d -o root -g "$app_group" -m 0755 "$staging" "$staging/dist"
install -d -o root -g "$app_group" -m 0750 "$staging/server"
rsync -a --delete "$source_dir/dist/" "$staging/dist/"
rsync -a --delete \
  --exclude=.env \
  --exclude=node_modules \
  "$source_dir/server/" "$staging/server/"

npm --prefix "$staging/server" ci --omit=dev --no-audit --no-fund
npm --prefix "$staging/server" test

chown -R root:"$app_group" "$staging"
chmod -R g+rX,o-rwx "$staging"
chmod 0755 "$staging"
find "$staging/dist" -type d -exec chmod 0755 {} +
find "$staging/dist" -type f -exec chmod 0644 {} +

mv "$staging" "$release"
next_link="$app_root/.current-$deploy_sha"
rm -f "$next_link"
ln -s "$release" "$next_link"
mv -Tf "$next_link" "$current"

rollback() {
  set +e
  echo "Deployment verification failed; restoring $previous" >&2
  if [[ -n "$previous" && -d "$previous" ]]; then
    rollback_link="$app_root/.rollback-$deploy_sha"
    rm -f "$rollback_link"
    ln -s "$previous" "$rollback_link"
    mv -Tf "$rollback_link" "$current"
    systemctl restart "$service"
  else
    systemctl stop "$service"
  fi
  if [[ $(readlink -f "$current" 2>/dev/null || true) != "$release" ]]; then
    rm -rf --one-file-system "$release"
  fi
  set -e
}

if ! systemctl restart "$service"; then
  rollback
  exit 20
fi

api_ready=0
for attempt in 1 2 3 4 5 6 7 8 9 10; do
  if curl --fail --silent --show-error \
    http://127.0.0.1:3101/api/v1/health >/dev/null; then
    api_ready=1
    break
  fi
  sleep 2
done

if [[ "$api_ready" -ne 1 ]] || ! curl --fail --silent --show-error \
  http://127.0.0.1:3101/api/v1/survey/stats >/dev/null; then
  rollback
  exit 21
fi

if ! curl --fail --silent --show-error \
  --resolve designops-maturity.de:443:127.0.0.1 \
  https://designops-maturity.de/survey/ >/dev/null; then
  rollback
  exit 22
fi

# The checkout is a build workspace, not a runtime release. Removing its
# dependencies keeps the server lean between deployments.
rm -rf --one-file-system "$source_dir/node_modules"

trap - EXIT
echo "Deployed $deploy_sha to $release"
