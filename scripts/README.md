# docs/scripts

Build-time helpers for the Relayer documentation site.

## `inject-code-samples.mjs`

Injects curated `x-codeSamples` into `api-reference/openapi.json` so each
endpoint page renders handwritten cURL / Node.js / SDK snippets instead of
relying solely on Mintlify's auto-generated language tabs.

### Usage

After regenerating the OpenAPI spec upstream:

```bash
# In the relayer-api monorepo
cd ../relayer/apps/api
pnpm generate:swagger
cp docs/openapi.json ../../../docs/api-reference/openapi.json

# Back in docs/
node scripts/inject-code-samples.mjs
```

Output:

```
✅ Injected x-codeSamples on 22 operation(s).
   Spec written to: /…/docs/api-reference/openapi.json
```

The script is **idempotent** — rerunning on an already-injected spec produces
the same diff. If a registered sample's endpoint disappears from the spec,
the script warns so the registry doesn't silently rot.

### Adding or editing samples

All samples live in `code-samples.mjs` as a single `samples` export. Keys are
`${METHOD} ${path}` exactly as they appear in OpenAPI:

```js
export const samples = {
  "POST /agents/prepare": [
    { lang: "bash",       label: "cURL",      source: "curl ..." },
    { lang: "TypeScript", label: "Node.js",   source: "const r = ..." },
  ],
  // ...
};
```

Path templates use `{param}` not `{{param}}` (OpenAPI style).

**Languages**: any string is allowed, but Mintlify renders well-known tags
(`bash`, `TypeScript`, `JavaScript`, `Python`, `Go`, `Java`, `Ruby`, `PHP`,
`Swift`, `Kotlin`, `Rust`, `Dart`, `C`, `C++`, `C#`, `PowerShell`, `.NET`).

**Label** is the tab title shown to readers — keep it short and descriptive
(e.g. `cURL`, `Node.js`, `Node.js (SDK)`, `Python`).

### Why post-process instead of editing the spec directly?

The spec is regenerated from NestJS controllers in `relayer/apps/api/` via
`pnpm generate:swagger`. Any manual edits to `api-reference/openapi.json`
would be wiped on the next regeneration. Keeping samples in this script means
they survive every spec update.

### Why not bake samples into the controllers via `@ApiExtension`?

We could — `@ApiExtension('x-codeSamples', [...])` works on NestJS endpoints.
But samples are a **documentation concern**, not an API concern, and we want
docs authors to iterate on them without touching backend code or shipping
new API deployments. Keeping them in the docs repo gives us that loop.
