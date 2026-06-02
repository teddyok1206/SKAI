# 026 Local Mac Runtime Strategy

Date: 2026-06-02

## Goal

Define how to run the SKAI demo from a personal Mac while keeping the path compatible with a later Mac mini or hosted deployment.

## Scope

Included:

- Separate development, local demo, and always-on runtime modes.
- Add npm scripts for LAN development and LAN production serving.
- Document when to use `next dev` vs `next start`.
- Document basic Mac power/network/security guidance.
- Update README and orchestration docs.

Excluded:

- Installing launchd service files into `~/Library/LaunchAgents`.
- Buying or configuring a Mac mini.
- Opening router port forwarding.
- Choosing a public tunnel provider.
- Replacing Vercel/Supabase deployment.

## Assumptions

- The project is still demo-first.
- The founder's Mac can stay powered on and connected when needed.
- The first smoke test is fewer than 10 people.
- Supabase handles auth and persistence, so the Mac server mainly runs the Next.js app/API routes.
- `.env.local` contains secrets and must stay local.

## Recommendation

Use three modes:

1. Development mode:
   - command: `conda run --no-capture-output -n SKAI npm run dev:lan`
   - use when coding because it has hot reload and clear errors.

2. Local/LAN demo mode:
   - commands:
     - `conda run -n SKAI npm run build`
     - `conda run --no-capture-output -n SKAI npm run serve:lan`
   - use when showing the demo or leaving it on for hours.
   - this is more stable than `next dev`.

3. External public access:
   - do not router-port-forward the Mac directly.
   - prefer Vercel/Supabase for real external smoke tests, or a controlled tunnel only as a temporary bridge.

## Affected Files

- `package.json`
- `README.md`
- `docs/000_orchestration.md`
- `docs/technical/011_local_mac_operations.md`

## Data Model Or API Changes

None.

## Implementation Steps

1. Add `dev:lan`, `serve:local`, and `serve:lan` scripts.
2. Add a technical operations document for Mac runtime modes.
3. Update README with common commands.
4. Update orchestration state and plan index.

## Verification Steps

- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`
- Confirm `next dev --help` and `next start --help` support `-H` and `-p`.

## Risks

- Keeping a Mac awake drains battery and exposes local services if the network is untrusted.
- `next dev` is convenient but not the right long-running demo server.
- `next start` requires a fresh `next build` after code changes.
- External public access from a laptop can become fragile and unsafe if done through raw port forwarding.

## Rollback Notes

Remove the package scripts and docs. Existing `npm run dev`, `npm run build`, and `npm run start` remain unchanged.

## Philosophy Check

This supports the SKAI smoke loop by keeping the demo reachable and stable while preserving founder control over logs, cost, and secrets. It should remain an operations layer, not a distraction from the core judge/trace/graph loop.
