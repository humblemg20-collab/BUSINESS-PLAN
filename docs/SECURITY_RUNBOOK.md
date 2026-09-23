# Business Plan — Security & Release Runbook

## Canonical source

`apps-script/` is the source of truth.

`business plan.zip` is an archive only. Updating the ZIP must never overwrite the canonical source.

## HumbleOS credential

The gateway credential must exist only in Apps Script Script Properties under:

- `HUMBLEOS_GATEWAY_URL`
- `HUMBLEOS_GATEWAY_SECRET`

No credential value is allowed in Git.

Because an earlier repository revision contained a credential value, that old credential must be revoked at the HumbleOS gateway and replaced with a new value before the hardened release is promoted.

## GitHub deployment secrets

The production deployment workflow expects:

- `CLASPRC_JSON` — clasp OAuth credential state.
- `APPS_SCRIPT_DEPLOYMENT_ID` — the existing production deployment ID.

Optional repository variable:

- `BUSINESS_PLAN_WEB_APP_URL` — canonical production `/exec` URL used by the health check.

## Release flow

```text
GitHub apps-script/
  -> static security validation
  -> JavaScript syntax validation
  -> clasp push
  -> update existing deployment
  -> production health check
```

Production deployment is manual through the GitHub Actions production environment until automatic rollback evidence is added.

## Public surface

Admin/test/maintenance functions must end with `_` so they cannot be invoked through `google.script.run`.

Every sensitive Bancable RPC must require and verify `jetonAcces`.

Generated PDFs remain private in Drive and are delivered through controlled server RPCs.
