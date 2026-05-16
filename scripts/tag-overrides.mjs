// Tag overrides applied to api-reference/openapi.json post-generation.
//
// NestJS Swagger auto-tags every operation from the controller it lives in,
// which sometimes doesn't match the resource-oriented nav we present in
// Mintlify. This registry overrides specific (path, method) tuples to the
// tag we want users to see.
//
// Keyed by `${METHOD} ${path}` exactly as in OpenAPI (no /v1 prefix).
// Value is the new tags array — typically a single string, replacing whatever
// was on the operation.
//
// To add an override: append an entry, then run `inject-code-samples.mjs`.

export const tagOverrides = {
  // Balance reads live under Wallets in the nav — they're wallet inspection,
  // not a separate "platform" concern.
  "GET /balance/token": ["Wallets"],
  "GET /balance/activity": ["Wallets"],

  // Address-level operations under WalletsController are split into their
  // own Addresses group for nav clarity.
  "POST /signing/wallets/accounts/prepare": ["Addresses"],
  "POST /signing/wallets/accounts/confirm": ["Addresses"],
  "GET /signing/wallets/{walletId}/addresses": ["Addresses"],
  "GET /signing/wallets/{walletId}/addresses/{addressId}": ["Addresses"],

  // Zombie endpoints — service methods throw BadRequestException pointing
  // users to the modern prepare/confirm flow. Both are JSDoc-@deprecated
  // and only kept to surface a clear 400 to legacy callers (none exist on
  // the live DB per Phase 33). Hide from nav by stripping their tag;
  // proper fix is @ApiExcludeEndpoint() at the BE controller.
  "POST /signing/wallets": [],
  "POST /signing/wallets/{walletId}/addresses": [],

  // The public swap quote is part of the swap-execute lifecycle (quote →
  // prepare → confirm), so it lives under "Widget Execute" in the nav.
  // Keeping the separate "Action: Quote (Public)" tag would create a
  // one-endpoint group with no narrative value.
  "GET /action/execute/swap/quote": ["Action: Execute"],
};
