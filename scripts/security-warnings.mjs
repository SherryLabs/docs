// Security warning callouts for destructive endpoints whose blast radius
// is larger than the ApiKey scope check alone defends against.
//
// Keyed by `${METHOD} ${path}` exactly as in OpenAPI. Each entry's `body`
// is prepended to the operation description as a Markdown blockquote
// (rendered as a callout on each endpoint page in Mintlify).
//
// These warnings exist because the destructive operations below DO NOT
// require a passkey-stamped activity — a stolen ApiKey is sufficient to
// call them. The medium-term fix is to require passkey-stamping at the
// API level (see relayer/apps/api/.planning/RFC-signing-destructive-ops.md).
// Until that ships, surface the blast radius prominently.

export const securityWarnings = {
  "DELETE /signing/policies/{id}": {
    body:
      "> **⚠ Destructive — removes a wallet protection.** Deleting a policy " +
      "means the wallet can sign transactions the policy previously blocked " +
      "(value caps, destination allowlists, time windows). Today this is " +
      "callable with a stolen API key — there is no passkey-stamp requirement " +
      "yet. Gate this call behind your own multi-admin workflow until the " +
      "API requires passkey-stamping. See [Auth & Custody](/shared/auth-model).",
  },
  "PATCH /signing/policies/{id}": {
    body:
      "> **⚠ Destructive — can weaken wallet protection.** Modifying a " +
      "policy can raise value caps, add allowed destinations, or relax " +
      "time windows. A stolen API key can weaken constraints before " +
      "exfiltrating funds. No passkey-stamp requirement today. Audit " +
      "every policy change against an immutable log.",
  },
  "PATCH /signing/approval-config": {
    body:
      "> **⚠ Destructive — controls the human-in-the-loop gate.** Raising " +
      "the approval threshold removes manual review for high-value " +
      "transactions. A stolen API key can set the threshold to a very " +
      "high number and then drain wallets up to that amount silently. " +
      "Today no passkey-stamp requirement. Use the most restrictive API " +
      "key scope (`internal` only) for this endpoint where possible.",
  },

  // Agent destructive ops — same architectural gap as the Signing ones:
  // api-key alone can call these. RFC #22 proposes passkey-stamp via
  // prepare/confirm. Until then, surface the blast radius prominently.
  "POST /agents/{id}/budget": {
    body:
      "> **⚠ Destructive — direct money exfil risk.** This endpoint sets " +
      "the agent's spending cap (`payments.monthlyUSDC`, `perTxUSDC`, " +
      "`approvalThresholdUSDC`). A stolen API key can raise the cap to " +
      "an arbitrary number and the next agent payment will drain the " +
      "agent wallet — same architectural gap as Signing policy mutations. " +
      "No passkey-stamp requirement today. Gate this call behind your own " +
      "multi-admin workflow until the API requires passkey-stamping. " +
      "See [Auth & Custody](/shared/auth-model).",
  },
  "POST /agents/{id}/kill": {
    body:
      "> **⚠ Destructive — irreversible.** Killing an agent permanently " +
      "halts it; recovery requires reprovisioning (3-round passkey flow " +
      "from the dashboard). A stolen API key can kill every agent in your " +
      "workspace and cause significant operational downtime. No passkey-" +
      "stamp requirement today.",
  },
  "POST /agents/{id}/rotate": {
    body:
      "> **⚠ Destructive — running agent stops signing.** Rotating issues " +
      "a new HMAC secret and invalidates the old one. Any agent process " +
      "still using the old secret loses its ability to sign API calls " +
      "until you deploy the new secret. A stolen API key can rotate every " +
      "agent and cause DoS until a redeploy cycle.",
  },
  "PATCH /agents/{id}/status": {
    body:
      "> **⚠ Destructive — overlaps kill/pause/resume.** This is the " +
      "generic status mutator; it can transition an agent to `killed`, " +
      "`paused`, or other states. Same blast radius as the explicit " +
      "kill/pause/resume endpoints. No passkey-stamp requirement today.",
  },
};
