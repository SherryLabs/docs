#!/usr/bin/env node
// Post-process api-reference/openapi.json:
//   1. Override per-operation `tags` so Mintlify nav matches our resource model
//   2. Prepend per-operation auth badges (api-key / hmac / passkey-only / etc.)
//   3. Inject curated `x-codeSamples` for high-value endpoints
//
// Run this AFTER copying a freshly-generated spec from the relayer-api monorepo:
//
//   cd ../relayer/apps/api && pnpm generate:swagger
//   cp ../relayer/apps/api/docs/openapi.json docs/api-reference/openapi.json
//   node docs/scripts/inject-code-samples.mjs
//
// Idempotent: re-running on an already-processed spec produces the same result.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { samples } from "./code-samples.mjs";
import { tagOverrides } from "./tag-overrides.mjs";
import { authModes, authBadges } from "./auth-modes.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPEC_PATH = resolve(__dirname, "..", "api-reference", "openapi.json");

const spec = JSON.parse(readFileSync(SPEC_PATH, "utf8"));

let samplesInjected = 0;
let tagsOverridden = 0;
let authBadged = 0;
const unusedSampleKeys = new Set(Object.keys(samples));
const unusedTagKeys = new Set(Object.keys(tagOverrides));
const unusedAuthKeys = new Set(Object.keys(authModes));

// Marker that lets us detect (and replace) a previously-injected badge so
// reruns don't stack badges or trap stale ones in the description.
const BADGE_MARKER_START = "<!-- relayer:auth-badge:start -->";
const BADGE_MARKER_END = "<!-- relayer:auth-badge:end -->";

for (const [path, pathItem] of Object.entries(spec.paths ?? {})) {
  for (const method of ["get", "post", "put", "patch", "delete"]) {
    const operation = pathItem[method];
    if (!operation) continue;
    const key = `${method.toUpperCase()} ${path}`;

    // 1. Tag overrides
    if (key in tagOverrides) {
      operation.tags = [...tagOverrides[key]];
      unusedTagKeys.delete(key);
      tagsOverridden++;
    }

    // 2. Auth badge in description (prepended, idempotent).
    //    Only emitted for non-default auth modes — `api-key` is the implicit
    //    baseline and a badge on every endpoint would just be noise.
    //    We still strip any pre-existing badge so an endpoint that USED to
    //    need passkey but doesn't anymore won't carry a stale notice.
    const mode = authModes[key] ?? "api-key";
    if (key in authModes) unusedAuthKeys.delete(key);
    const existing = operation.description ?? "";
    const stripped = existing.replace(
      new RegExp(
        `${BADGE_MARKER_START}[\\s\\S]*?${BADGE_MARKER_END}\\n*`,
        "g",
      ),
      "",
    );
    const badgeBody = mode !== "api-key" ? authBadges[mode] : null;
    if (badgeBody) {
      const badge = `${BADGE_MARKER_START}\n${badgeBody}\n${BADGE_MARKER_END}`;
      operation.description = `${badge}\n\n${stripped}`.trimEnd();
      authBadged++;
    } else if (stripped !== existing) {
      // Description had a stale badge; clean it up.
      operation.description = stripped.trimStart();
    }

    // 3. Code sample injection
    if (key in samples) {
      operation["x-codeSamples"] = samples[key];
      unusedSampleKeys.delete(key);
      samplesInjected++;
    }
  }
}

// Refresh the top-level `tags` array so Mintlify's tag picker shows the
// post-override list (and drops tags that no operation uses anymore).
const liveTags = new Set();
for (const pathItem of Object.values(spec.paths ?? {})) {
  for (const method of ["get", "post", "put", "patch", "delete"]) {
    for (const tag of pathItem[method]?.tags ?? []) liveTags.add(tag);
  }
}
const existingTagMeta = new Map((spec.tags ?? []).map((t) => [t.name, t]));
spec.tags = [...liveTags]
  .sort()
  .map((name) => existingTagMeta.get(name) ?? { name });

// Warn about registered overrides/samples that no longer match the spec —
// usually means the endpoint was removed or renamed upstream.
if (unusedTagKeys.size > 0) {
  console.warn(`\n⚠️  ${unusedTagKeys.size} tag override(s) for missing endpoint(s):`);
  for (const key of unusedTagKeys) console.warn(`   - ${key}`);
}
if (unusedAuthKeys.size > 0) {
  console.warn(`\n⚠️  ${unusedAuthKeys.size} auth-mode entr(y/ies) for missing endpoint(s):`);
  for (const key of unusedAuthKeys) console.warn(`   - ${key}`);
}
if (unusedSampleKeys.size > 0) {
  console.warn(`\n⚠️  ${unusedSampleKeys.size} code sample(s) for missing endpoint(s):`);
  for (const key of unusedSampleKeys) console.warn(`   - ${key}`);
}

writeFileSync(SPEC_PATH, JSON.stringify(spec, null, 2) + "\n");

console.log(`\n✅ Overrode tags on ${tagsOverridden} operation(s).`);
console.log(`✅ Auth-badged ${authBadged} operation(s).`);
console.log(`✅ Injected x-codeSamples on ${samplesInjected} operation(s).`);
console.log(`   Spec written to: ${SPEC_PATH}\n`);
