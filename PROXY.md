# CoC Proxy Server — Operations

The Clash of Clans API proxy that this app talks to.

## What's running

| | |
|---|---|
| Hostname | `coc-proxy-sea.southeastasia.cloudapp.azure.com` |
| Public IP | `20.195.43.159` |
| OS | Ubuntu 24.04 (Azure VM, 1 vCPU / 847 MB) |
| Stack | Caddy (HTTPS, port 443) → Go binary (`127.0.0.1:8080`) |
| Source | `ClashKingProxy` (Go) + custom `auth.go` / `cache.go` / `health.go` |
| Auth | `x-proxy-secret` header (matches `PROXY_SECRET` in this app's env) |
| Cache | 5 min TTL, 1000 entries, GET-only (transparent `http.RoundTripper`) |
| Keys | Round-robin over N Supercell tokens (`COC_KEYS`, comma-separated) |

## SSH

```bash
ssh -i C:/Users/luqmaan17053/Desktop/vm-coc-proxy_key.pem azureuser@coc-proxy-sea.southeastasia.cloudapp.azure.com
```

## Daily checks

```bash
# Liveness — no auth needed, safe to curl from anywhere
curl https://coc-proxy-sea.southeastasia.cloudapp.azure.com/health

# Detailed rolling stats — needs the secret
curl -H "x-proxy-secret: $PROXY_SECRET" \
  'https://coc-proxy-sea.southeastasia.cloudapp.azure.com/stats?series=5m&lookback=1h&endpoints=24h&limit=10' | jq .
```

`/health` reports `keys`, `cacheSize`, `hits`, `misses`, `hitRate`, `uptimeSeconds`. Healthy steady state: `hitRate` 60–80 %, `4xx` and `5xx` near zero in `/stats` `windows.24h`.

## Common ops (all on the VM)

### Logs
```bash
sudo journalctl -u coc-proxy -f          # tail live
sudo journalctl -u coc-proxy -n 200      # last 200 lines
```

### Restart / start / stop
```bash
sudo systemctl restart coc-proxy
sudo systemctl status coc-proxy
```

### Add or rotate Supercell API keys
1. Go to https://developer.clashofclans.com → Account → My Account → Keys.
2. Create or revoke keys as needed. **Every key must allow CIDR `20.195.43.159`.**
3. Edit the env file:
   ```bash
   sudo nano /etc/coc-proxy.env
   # Replace or append values in COC_KEYS=key1,key2,key3
   ```
4. Restart and verify:
   ```bash
   sudo systemctl restart coc-proxy
   curl http://127.0.0.1:8080/health   # check "keys": N
   ```

Up to 10 keys per developer account. More keys = more rate-limit headroom.

### Change cache TTL or size
Edit `/etc/coc-proxy.env`, set `CACHE_TTL=10m` or `CACHE_SIZE=2000`, restart. TTL accepts any Go duration (`30s`, `5m`, `1h`).

### Rotate the proxy secret
If `PROXY_SECRET` ever leaks:
1. Generate a new value: `openssl rand -hex 32`
2. Update `/etc/coc-proxy.env` on the VM AND `PROXY_SECRET` in the Next.js app's env (Azure Container Apps secret + `.env.local`).
3. `sudo systemctl restart coc-proxy` and redeploy / restart the app.

## Deploying a proxy code change

Source lives at `/home/azureuser/clashking-build/` on the VM and at `C:\Users\luqmaan17053\Desktop\clashking-proxy-server\ClashKingProxy\` locally.

```bash
# From Windows — sync changed Go files up
scp -i C:/Users/luqmaan17053/Desktop/vm-coc-proxy_key.pem \
  *.go go.mod go.sum \
  azureuser@coc-proxy-sea.southeastasia.cloudapp.azure.com:/home/azureuser/clashking-build/

# On the VM — rebuild and swap binary
ssh -i C:/Users/luqmaan17053/Desktop/vm-coc-proxy_key.pem azureuser@coc-proxy-sea.southeastasia.cloudapp.azure.com
cd /home/azureuser/clashking-build
export PATH=$PATH:/usr/local/go/bin
go build -o /tmp/proxy-new . && sudo mv /tmp/proxy-new /opt/coc-proxy-go/proxy
sudo systemctl restart coc-proxy
curl http://127.0.0.1:8080/health
```

Build takes a few seconds; restart is sub-second.

## Rollback to the old Node proxy

The original Express proxy is preserved as a backup. ~30-second recovery:

```bash
sudo cp /etc/systemd/system/coc-proxy.service.bak /etc/systemd/system/coc-proxy.service
sudo cp /etc/coc-proxy.env.bak /etc/coc-proxy.env
sudo systemctl daemon-reload
sudo systemctl restart coc-proxy
```

Backup locations:
- `/opt/coc-proxy.bak/` — Node source
- `/etc/systemd/system/coc-proxy.service.bak` — old unit
- `/etc/coc-proxy.env.bak` — old env (single `COC_TOKEN`)

After ~1 week of stable Go-proxy operation, delete the backups: `sudo rm -rf /opt/coc-proxy.bak /etc/systemd/system/coc-proxy.service.bak /etc/coc-proxy.env.bak`.

## Troubleshooting

| Symptom | Cause + fix |
|---|---|
| Next.js app gets `401 Unauthorized` | `PROXY_SECRET` mismatch between app env and `/etc/coc-proxy.env`. Compare and align. |
| `5xx` count climbing in `/stats` | Upstream `api.clashofclans.com` issues, or all keys revoked. Check `journalctl -u coc-proxy -n 100`. |
| `4xx` near 33 % / 50 % / 66 % of requests | One key bad (revoked, IP mismatch, or expired). Bad keys still get rotated to. Test each at `https://developer.clashofclans.com` and replace the dud. |
| `hitRate` stuck under 30 % | App may be sending cache-busting query params (e.g. timestamps). Inspect what URLs hit `/v1/*` — endpoint breakdown in `/stats?endpoints=24h`. |
| Service won't start | `sudo journalctl -u coc-proxy -n 50` — usually a missing env var (`COC_KEYS` or `PROXY_SECRET` empty). |
| Caddy returns 502 | Go process crashed. Same `journalctl` check; `sudo systemctl restart coc-proxy`. |

## Files of interest (on the VM)

```
/etc/coc-proxy.env                       # secrets + config (mode 600 root:root)
/etc/systemd/system/coc-proxy.service    # systemd unit
/opt/coc-proxy-go/proxy                  # current Go binary
/home/azureuser/clashking-build/         # Go source (build here)
/etc/caddy/Caddyfile                     # HTTPS reverse proxy
/var/log/caddy/access.log                # request log (Caddy)
```
