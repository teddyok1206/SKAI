# Local Mac Operations

Date: 2026-06-02

## Decision

SKAI can be run from the founder's Mac during the first demo phase, but the runtime mode must match the situation.

Use `next dev` for active coding. Use `next start` after `next build` for stable local/LAN demo serving. Do not expose the Mac directly to the public internet through router port forwarding.

## Runtime Modes

### 1. Active Development

Use when editing code and checking UI quickly.

```bash
conda run --no-capture-output -n SKAI npm run dev:lan
```

Open:

```text
http://localhost:3000
```

Same-Wi-Fi devices can try:

```text
http://YOUR_MAC_LAN_IP:3000
```

This mode has hot reload and better development errors. It is not the best mode for leaving the app on for many hours.

### 2. Stable Local Demo

Use when the code is not changing and the app should stay available on the Mac or local network.

```bash
conda run -n SKAI npm run build
conda run --no-capture-output -n SKAI npm run serve:lan
```

Why:

- `next start` runs the production build.
- It avoids development reload behavior.
- It is closer to how the app will behave when deployed.

Important:

- Run `build` again after code changes.
- If port `3000` is already used, stop the old process or change the port.

### 3. Local-Only Private Run

Use when the app should only be reachable from the Mac itself.

```bash
conda run -n SKAI npm run build
conda run --no-capture-output -n SKAI npm run serve:local
```

This binds to `127.0.0.1`, so other devices on the network cannot connect.

### 4. External Access

Avoid exposing the Mac directly through router port forwarding.

For external users, prefer:

- Vercel for the Next.js app,
- Supabase for auth and persistence,
- or a temporary controlled tunnel only for short demos.

Reason:

- `.env.local` contains API keys.
- Mac sleep/network changes can break sessions.
- Raw public exposure increases abuse and security risk.
- OAuth redirect URLs become harder to reason about.

## Mac Power Settings

For a short smoke session:

- Keep the Mac plugged in.
- Disable sleep while the server is running.
- Keep the network stable.

For a terminal-only temporary no-sleep run:

```bash
caffeinate -dimsu
```

Run that in a separate terminal while the server terminal stays open.

For repeated long-running use, use `launchd` later instead of relying on a terminal tab. Do not add launchd until the local production command is stable.

## LAN Access Checklist

1. Start the server with `dev:lan` or `serve:lan`.
2. Find the Mac's local IP in System Settings or with `ipconfig getifaddr en0`.
3. Open `http://MAC_IP:3000` from another device on the same Wi-Fi.
4. If it fails, check macOS firewall and whether both devices are on the same network.

## OAuth Notes

For local development, Supabase redirect URLs should include:

```text
http://localhost:3000/auth/callback
```

If testing from another device through `http://MAC_IP:3000`, the OAuth callback may need another allowed redirect URL:

```text
http://MAC_IP:3000/auth/callback
```

This is one reason public/deployed hosting becomes cleaner once external users are involved.

## Migration Path To Mac Mini

MacBook phase:

- terminal-run `dev:lan` for coding,
- terminal-run `serve:lan` for demos,
- manual restart after code/env changes.

Mac mini phase:

- keep repo and conda env on the mini,
- run `build + serve:lan`,
- add launchd KeepAlive only after the command is stable,
- keep Supabase as remote auth/storage,
- consider Vercel if external access matters more than local control.

## Watchpoints

- Do not confuse "server is running" with "production-ready".
- Do not run public demos from `next dev`.
- Do not expose `.env.local` or service-role keys.
- Do not port-forward the laptop as the first external deployment strategy.
- Do not let server operations distract from live-provider and judge calibration smoke tests.
