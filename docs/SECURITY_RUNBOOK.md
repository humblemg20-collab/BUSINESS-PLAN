# Business Plan — Security & Release Runbook

## Canonical source

`apps-script/` is the source of truth.

`business plan.zip` is an archive only. Updating the ZIP must never overwrite the canonical source.

## OpenAI credential

The Business Plan production AI path uses the OpenAI Responses API directly.

Apps Script Script Properties must contain:

- `OPENAI_API_KEY` — OpenAI API key. Never commit it to Git.
- `OPENAI_MODEL` — optional model override. Default in the adapter: `gpt-5.6-luna`.

The production adapter sets `store:false`, uses Structured Outputs, performs no automatic retry, and keeps deterministic fallbacks so an OpenAI outage does not block Business Plan generation.

Production deployment also calls the public-safe `?health=openai-config` route. The route exposes only configuration state/model metadata, never the key. If `configured:true` is absent after deployment, the GitHub Actions release fails and invokes the existing automatic rollback.

Legacy HumbleOS bridge and paid Business Plan modules have been removed from the deployable source. Git history remains the rollback archive. CI enforces the OpenAI-only, single-offer production contract.

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
