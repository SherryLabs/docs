// Auth-mode labels per endpoint. Prepended to each operation's description
// by the post-processor so every endpoint page shows what credential type
// is required AND what kind of authority is needed beyond the credential
// (passkey stamp, HMAC, etc.).
//
// Keyed by `${METHOD} ${path}` exactly as in OpenAPI.
//
// Values are one of:
//   "api-key"          — ApiKey backend can call AND complete this on its own.
//   "api-key+passkey"  — ApiKey can initiate (prepare), but completion requires
//                        a passkey-stamped activity produced in the browser.
//                        Backend ALONE cannot do this end-to-end.
//   "hmac"             — Agent runtime via X-Agent-Auth HMAC headers. Not
//                        callable by backend ApiKey; the agent itself signs.
//   "hmac-or-api-key"  — Accepts either; the agent self-calls OR the
//                        integrator queries on the agent's behalf.
//   "passkey-only"     — Cannot be initiated by backend at all. WebAuthn
//                        ceremony in the browser is the only valid caller.
//
// Endpoints not in this registry default to "api-key" (the safe, common case).

export const authModes = {
  // ─────────────────────────────────────────────────────────────────────
  // Signing Kit — wallet creation requires passkey on confirm
  // ─────────────────────────────────────────────────────────────────────
  "POST /signing/wallets/prepare": "api-key",
  "POST /signing/wallets/confirm": "api-key+passkey",
  "POST /signing/wallets/accounts/prepare": "api-key",
  "POST /signing/wallets/accounts/confirm": "api-key+passkey",
  "POST /signing/wallets/{walletId}/addresses": "api-key+passkey",

  // Wallet reads — pure ApiKey
  // (default = api-key, listed here for clarity in next round if needed)

  // ─────────────────────────────────────────────────────────────────────
  // Transactions — prepare/confirm pattern
  // ─────────────────────────────────────────────────────────────────────
  "POST /transactions/prepare": "api-key",
  "POST /transactions/confirm": "api-key+passkey",
  "DELETE /transactions/sign/{transactionId}": "api-key",
  "POST /transactions/broadcast/{transactionId}": "api-key",
  "POST /transactions/broadcast/raw": "api-key",
  "POST /transactions/broadcast/{transactionId}/retry": "api-key",

  // ─────────────────────────────────────────────────────────────────────
  // Passkeys — WebAuthn ceremonies (browser-only)
  // ─────────────────────────────────────────────────────────────────────
  "POST /signing/passkeys/challenge": "api-key",
  "POST /signing/passkeys/register": "passkey-only",
  "POST /signing/passkeys/add": "passkey-only",
  "PATCH /signing/passkeys/{id}": "api-key",
  "DELETE /signing/passkeys/{id}": "api-key",

  // ─────────────────────────────────────────────────────────────────────
  // Recovery — initiate from anywhere, sync requires passkey
  // ─────────────────────────────────────────────────────────────────────
  "POST /signing/recovery/initiate": "api-key",
  "POST /signing/recovery/sync": "passkey-only",

  // ─────────────────────────────────────────────────────────────────────
  // Approvals — approval stamp is passkey-only
  // ─────────────────────────────────────────────────────────────────────
  "POST /signing/approvals/{id}/approve": "api-key+passkey",
  "POST /signing/approvals/{id}/approve-with-passkey": "passkey-only",
  "POST /signing/approvals/{id}/reject": "api-key",

  // ─────────────────────────────────────────────────────────────────────
  // Policies — administrative, ApiKey
  // ─────────────────────────────────────────────────────────────────────
  // defaults

  // ─────────────────────────────────────────────────────────────────────
  // Agents — provisioning needs passkey, runtime is HMAC
  // ─────────────────────────────────────────────────────────────────────
  "POST /agents/prepare": "api-key",
  "POST /agents/confirm-user": "api-key+passkey",
  "POST /agents/confirm-policies": "api-key+passkey",
  "POST /agents/{id}/prepare-policies": "api-key",
  "DELETE /agents/{id}": "api-key",

  // Agent funding — same prepare/confirm pattern
  "POST /agents/{id}/fund/prepare": "api-key",
  "POST /agents/{id}/fund/confirm": "api-key+passkey",

  // Agent control — administrative, ApiKey
  "POST /agents/{id}/kill": "api-key",
  "POST /agents/{id}/pause": "api-key",
  "POST /agents/{id}/resume": "api-key",
  "POST /agents/{id}/rotate": "api-key",
  "POST /agents/{id}/budget": "api-key",
  "PATCH /agents/{id}/status": "api-key",
  "POST /agents/{id}/tools": "api-key",
  "DELETE /agents/{id}/tools/{toolId}": "api-key",

  // Agent runtime — HMAC
  "POST /agents/wallets": "hmac",
  "POST /agents/{id}/sign-transaction": "hmac",
  "POST /agents/{id}/x402-pay": "hmac",
  "POST /agents/events/batch": "hmac",

  // Agent reads accepted via HMAC or ApiKey
  "GET /agents/{id}/budget": "hmac-or-api-key",
  "GET /agents/{id}/wallet-balance": "hmac-or-api-key",
  "GET /agents/{id}/analytics": "hmac-or-api-key",
  "GET /agents/{id}/status": "hmac-or-api-key",

  // ─────────────────────────────────────────────────────────────────────
  // Widget Actions — catalog reads + metadata generators (api-key default)
  //
  // /action/execute/swap/{quote,prepare,confirm} are architecturally
  // sound (modern passkey-stamped SignedActivityDto pattern, confirmed
  // by audit) BUT hidden from API Reference by policy: this surface
  // only documents endpoints that a backend can complete with the api
  // key alone. The swap confirm step requires a passkey ceremony in
  // the browser. Integrators get end-user swap UX via the Widget Kit.
  //
  // POST /action/execute/swap (no suffix) is a zombie — no consumer in
  // the modern stack. Tracked for removal via RFC.
  // ─────────────────────────────────────────────────────────────────────
  "GET /action/directory": "public",

  // ─────────────────────────────────────────────────────────────────────
  // Skills — execute is hmac-or-api-key (callable by agents OR by integrator)
  // ─────────────────────────────────────────────────────────────────────
  "POST /action/skills/{id}/execute": "hmac-or-api-key",
};

// Description prefix templates rendered as Markdown blockquotes at the top
// of each operation's description. Mintlify renders these as a leading note.
export const authBadges = {
  "api-key":
    "> **Auth: API key.** Fully callable from your backend with " +
    "`Authorization: ApiKey rk_...`.",
  "api-key+passkey":
    "> **Auth: API key + passkey stamp.** Your backend calls this with " +
    "`ApiKey`, but the body includes a passkey-stamped activity produced " +
    "by WebAuthn in the user's browser. **Cannot be completed by backend " +
    "alone.** See [Auth & Custody](/shared/auth-model).",
  hmac:
    "> **Auth: agent HMAC.** Called by the agent SDK at runtime with " +
    "`x-agent-id`, `x-agent-auth`, `x-request-timestamp` headers. " +
    "**Not callable from backend ApiKey.** See " +
    "[Authentication → Agent HMAC](/get-started/authentication).",
  "hmac-or-api-key":
    "> **Auth: agent HMAC or API key.** Accepts the agent's own HMAC " +
    "credentials (runtime self-call) **or** the integrator's ApiKey " +
    "(backend query on the agent's behalf).",
  "passkey-only":
    "> **Auth: passkey (browser only).** This endpoint is a WebAuthn " +
    "ceremony. **Cannot be called from a backend.** The browser at the " +
    "user's device is the only valid caller. See " +
    "[Auth & Custody](/shared/auth-model).",
  public: "> **Auth: public.** No authentication required.",
};
