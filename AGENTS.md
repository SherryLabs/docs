# Documentation project instructions

## About this project

- This is the Mintlify-powered documentation site for **Relayer** — self-custodial stablecoin infrastructure
- Pages are MDX files with YAML frontmatter
- Site configuration lives in `docs.json` (Mintlify schema)
- API reference is generated from `api-reference/openapi.json`, which is **regenerated upstream** in the relayer-api monorepo
- Curated code samples (`x-codeSamples`) are injected post-regeneration via `scripts/inject-code-samples.mjs`

## Local development

```bash
mint dev               # preview the site
mint broken-links      # validate internal links
```

## Updating the API reference

When endpoints, schemas, or DTOs change in `relayer/apps/api`:

```bash
# 1. Regenerate the spec from the live NestJS controllers
cd ../relayer/apps/api
pnpm generate:swagger

# 2. Copy the fresh spec into the docs repo
cp docs/openapi.json ../../../docs/api-reference/openapi.json

# 3. Re-inject curated code samples
cd ../../../docs
node scripts/inject-code-samples.mjs
```

The injector is idempotent — rerunning produces identical output. If a registered sample's endpoint no longer exists in the spec, the script warns so the registry doesn't silently rot.

To add or edit code samples, modify `scripts/code-samples.mjs`. Keys are `${METHOD} ${path}` exactly as they appear in OpenAPI (no `/v1` prefix — that lives in the server URL).

## Architecture decisions baked into the docs

- **Two-layer narrative** — humans today, agents tomorrow, same self-custodial backend
- **Four public Kits** — Signing, Agent, Payout, Widget. Exchange Kit was removed; Action Kit was folded into Widget Kit (curated)
- **No infra leaks** — never name Turnkey, Bridge, Supabase, Drizzle, etc. publicly. Use neutral terms: "secure enclave", "fiat rails partner", "wallet workspace"
- **Three auth modes** — `ApiKey` (backend), HMAC-SHA256 (agent SDK), session JWT (dashboard only)

## Terminology

| Use | Don't use |
|---|---|
| workspace | operator account, integrator |
| recipient | beneficiary (in narrative; the API still uses `beneficiaryId`) |
| Passkey Signing | Turnkey Mode |
| Metadata Mode | (kept as-is) |
| secure enclave / signing enclave | Turnkey, sub-organization |
| fiat rails partner | Bridge, Bridge.xyz |
| session JWT | Supabase JWT |
| AI agent | bot |

## Style preferences

- Active voice, second person ("you")
- Sentence case for headings
- Bold for UI elements: Click **Settings**
- Code formatting for file names, commands, paths, headers, and code references
- One idea per sentence; prefer short paragraphs
- Use Mintlify components liberally: `<Tabs>`, `<Steps>`, `<CardGroup>`, `<CodeGroup>`, `<ParamField>`, `<Warning>`, `<Tip>`, `<Note>`, `<Info>`

## Content boundaries

- **Do not document**: workspace-management endpoints (`/v1/integrators/*` admin scope), Bridge proxy endpoints (`/v1/payout/rails/*`), Treasury, Protocols (preserved stubs), Action: Analytics / Indexing / Rewards, Admin
- **Do document**: every endpoint that an external integrator can authenticate to with a regular API key
- The OpenAPI spec already excludes the internal surface via `@ApiExcludeController` / `@ApiExcludeEndpoint` decorators in the source — trust the spec to be the source of truth

## Authoring AI-friendly docs

The site exposes:
- **MCP server** at `/mcp` (auto-hosted by Mintlify)
- **`llms.txt`** index
- **Per-page Markdown** at `<page-url>.md`
- **Contextual menu** with Open-in-Claude/Cursor/ChatGPT/Perplexity

When writing, optimize for both human and LLM consumption:
- Lead each page with a one-paragraph summary an LLM can quote verbatim
- Keep code examples self-contained (env-var-driven, no implicit context)
- Cross-link generously — the MCP server uses links to navigate
