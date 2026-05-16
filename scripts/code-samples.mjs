// Curated code samples injected into api-reference/openapi.json as x-codeSamples.
// Keyed by `${METHOD} ${path}` exactly as it appears in OpenAPI (no /v1 prefix —
// the prefix lives in the server URL).
//
// Each entry is an array of { lang, label, source } objects.
// Mintlify renders them as language tabs on the endpoint page.
//
// Add entries here. Run `node scripts/inject-code-samples.mjs` after.

const API = "https://api.relayer.fi/v1";

// Reusable HMAC helper snippet for agent-side calls. Kept short — the full
// reference implementation lives in get-started/authentication.
const HMAC_NOTE = `# Agent endpoints require HMAC-SHA256 signing. See
# /get-started/authentication for the full payload + headers spec, or use
# the @relayerfi/agent-sdk which signs automatically.`;

export const samples = {
  // ─────────────────────────────────────────────────────────────────────
  // Agent Kit — lifecycle (3-round passkey provisioning)
  // ─────────────────────────────────────────────────────────────────────

  "POST /agents/prepare": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/agents/prepare \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "BI Reporter",
    "description": "Daily financial summary agent"
  }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("${API}/agents/prepare", {
  method: "POST",
  headers: {
    Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "BI Reporter",
    description: "Daily financial summary agent",
  }),
});
const { data } = await response.json();
// data.activity — pass to the dashboard for passkey stamping (Round 2 input)
// data.agentDraftId — pass to /agents/confirm-user in Round 2`,
    },
  ],

  "POST /agents/confirm-user": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/agents/confirm-user \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agentDraftId": "draft_abc123",
    "stampedActivity": "..."
  }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("${API}/agents/confirm-user", {
  method: "POST",
  headers: {
    Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    agentDraftId,           // from Round 1
    stampedActivity,        // passkey-stamped CREATE_USERS activity
  }),
});
const { data } = await response.json();
// data.agentId — the agent UUID, persist this
// data.activity — unsigned CREATE_POLICIES activity for Round 3`,
    },
  ],

  "POST /agents/confirm-policies": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/agents/confirm-policies \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agentId": "agt_def456",
    "stampedActivity": "..."
  }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("${API}/agents/confirm-policies", {
  method: "POST",
  headers: {
    Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    agentId,                // from Round 2
    stampedActivity,        // passkey-stamped CREATE_POLICIES activity
  }),
});
const { data } = await response.json();
// data.agentId, data.agentSecret — SHOWN ONCE. Persist agentSecret securely.
// Pass both to the agent runtime as env vars:
//   RELAYER_AGENT_ID, RELAYER_AGENT_SECRET`,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────
  // Agent Kit — budget & control
  // ─────────────────────────────────────────────────────────────────────

  "POST /agents/{id}/budget": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/agents/$AGENT_ID/budget \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "infrastructure": { "monthlyUSD": 50 },
    "tokens":         { "monthlyUSD": 200 },
    "payments":       {
      "monthlyUSDC": 1000,
      "perTxUSDC": 100,
      "approvalThresholdUSDC": 50
    }
  }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(\`${API}/agents/\${agentId}/budget\`, {
  method: "POST",
  headers: {
    Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    infrastructure: { monthlyUSD: 50 },
    tokens:         { monthlyUSD: 200 },
    payments:       {
      monthlyUSDC: 1000,
      perTxUSDC: 100,
      approvalThresholdUSDC: 50,
    },
  }),
});
// Three independent layers. checkBudget() (telemetry) queries 1+2.
// checkPaymentBudget() (payments) queries all 3 + kill switch.`,
    },
  ],

  "POST /agents/{id}/kill": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/agents/$AGENT_ID/kill \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(\`${API}/agents/\${agentId}/kill\`, {
  method: "POST",
  headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
});
// Irreversible. Wallet stays funded — withdraw via fund/prepare-style flow
// from your integrator wallet if needed.`,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────
  // Agent Kit — funding
  // ─────────────────────────────────────────────────────────────────────

  "POST /agents/{id}/fund/prepare": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/agents/$AGENT_ID/fund/prepare \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "amountUSDC": "100" }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `// Step 1 of 2 — prepare an unsigned USDC transfer
// from the integrator wallet to the agent wallet.
const response = await fetch(\`${API}/agents/\${agentId}/fund/prepare\`, {
  method: "POST",
  headers: {
    Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ amountUSDC: "100" }),
});
const { data } = await response.json();
// data.activity — pass to dashboard for passkey stamping
// then call /agents/{id}/fund/confirm with the stamped result`,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────
  // Agent Kit — runtime (HMAC-signed)
  // ─────────────────────────────────────────────────────────────────────

  "POST /agents/{id}/x402-pay": [
    {
      lang: "bash",
      label: "cURL",
      source: `${HMAC_NOTE}

curl -X POST ${API}/agents/$AGENT_ID/x402-pay \\
  -H "x-agent-id: $AGENT_ID" \\
  -H "x-agent-auth: $HMAC_SIGNATURE_HEX" \\
  -H "x-request-timestamp: $UNIX_TS" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://skill.example/api/run",
    "method": "POST",
    "body": { "input": "Tell me a joke" },
    "maxAmount": "1.00"
  }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js (SDK)",
      source: `import { RelayerSDK } from "@relayerfi/agent-sdk";

const sdk = new RelayerSDK({
  agentId: process.env.RELAYER_AGENT_ID!,
  agentSecret: process.env.RELAYER_AGENT_SECRET!,
  apiUrl: "https://api.relayer.fi",
});

// One-liner: 402 detection → budget check → USDC payment → retry.
// Throws BudgetExhaustedError, ApprovalTimeoutError, or KillSwitchActiveError.
const response = await sdk.x402fetch("https://skill.example/api/run", {
  method: "POST",
  body: JSON.stringify({ input: "Tell me a joke" }),
});
const result = await response.json();`,
    },
  ],

  "POST /agents/{id}/sign-transaction": [
    {
      lang: "bash",
      label: "cURL",
      source: `${HMAC_NOTE}

curl -X POST ${API}/agents/$AGENT_ID/sign-transaction \\
  -H "x-agent-id: $AGENT_ID" \\
  -H "x-agent-auth: $HMAC_SIGNATURE_HEX" \\
  -H "x-request-timestamp: $UNIX_TS" \\
  -H "Content-Type: application/json" \\
  -d '{
    "unsignedTx": "<base64-solana-tx>"
  }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js (SDK)",
      source: `import { RelayerSDK } from "@relayerfi/agent-sdk";

const sdk = new RelayerSDK({
  agentId: process.env.RELAYER_AGENT_ID!,
  agentSecret: process.env.RELAYER_AGENT_SECRET!,
  apiUrl: "https://api.relayer.fi",
});

const response = await sdk.http.request("POST", \`/agents/\${sdk.agentId}/sign-transaction\`, {
  unsignedTx: base64SolanaTx,
});
// response.signature — base64 signature ready to submit to Solana RPC`,
    },
  ],

  "POST /agents/events/batch": [
    {
      lang: "bash",
      label: "cURL",
      source: `${HMAC_NOTE}

curl -X POST ${API}/agents/events/batch \\
  -H "x-agent-id: $AGENT_ID" \\
  -H "x-agent-auth: $HMAC_SIGNATURE_HEX" \\
  -H "x-request-timestamp: $UNIX_TS" \\
  -H "Content-Type: application/json" \\
  -d '{
    "events": [
      { "type": "llm_call",  "tokens": 1234, "cost_usd": "0.018" },
      { "type": "api_call",  "endpoint": "https://example/api", "cost_usd": "0.001" },
      { "type": "payment",   "amount": "5.00", "currency": "USDC", "to": "skill_xyz" }
    ]
  }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js (SDK)",
      source: `import { RelayerSDK } from "@relayerfi/agent-sdk";

const sdk = new RelayerSDK({ /* ... */ });

// The SDK batches automatically. Manual flush:
sdk.emitEvent({ type: "llm_call", tokens: 1234, cost_usd: "0.018" });
sdk.emitEvent({ type: "api_call", endpoint: "https://example/api", cost_usd: "0.001" });
sdk.emitEvent({ type: "payment", amount: "5.00", currency: "USDC", to: "skill_xyz" });

// EventBatcher flushes every 10s by default (configurable).
// Up to 100 events per batch. Selective retry: 429/5xx retried, 4xx dropped.`,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────
  // Signing Kit — wallet prepare/confirm
  // ─────────────────────────────────────────────────────────────────────

  "POST /signing/wallets/prepare": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/signing/wallets/prepare \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "name": "My Wallet" }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("${API}/signing/wallets/prepare", {
  method: "POST",
  headers: {
    Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ name: "My Wallet" }),
});
const { data } = await response.json();
// data.activity — pass to the browser for passkey stamping via WebAuthn,
// then call /signing/wallets/confirm with the stamped result.`,
    },
  ],

  "POST /signing/wallets/confirm": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/signing/wallets/confirm \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "stampedActivity": "..." }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("${API}/signing/wallets/confirm", {
  method: "POST",
  headers: {
    Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ stampedActivity }),
});
const { data } = await response.json();
// data.walletId — persist this. Use it to generate addresses next:
// POST /signing/wallets/accounts/prepare`,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────
  // Signing Kit — transactions
  // ─────────────────────────────────────────────────────────────────────

  "POST /transactions/prepare": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/transactions/prepare \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "walletId": "wallet_abc123",
    "from": "0xYourWalletAddress",
    "to": "0xRecipientAddress",
    "value": "10000000000000000",
    "network": "sepolia"
  }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("${API}/transactions/prepare", {
  method: "POST",
  headers: {
    Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    walletId: "wallet_abc123",
    from: "0xYourWalletAddress",
    to: "0xRecipientAddress",
    value: "10000000000000000",   // 0.01 ETH in wei
    network: "sepolia",
  }),
});
const { data } = await response.json();
// data.transactionId — persist for confirm
// data.unsignedTransaction (hex) — sign with the user's passkey on the frontend
// Status starts as "awaiting_signature".`,
    },
  ],

  "POST /transactions/confirm": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/transactions/confirm \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "transactionId": "tx_def456",
    "signedTransaction": "0x..."
  }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("${API}/transactions/confirm", {
  method: "POST",
  headers: {
    Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ transactionId, signedTransaction }),
});
const { data } = await response.json();
// Signature is hash-verified against the original unsigned tx.
// On success, the tx is persisted AND broadcast.
// data.txHash — chain hash if broadcast succeeded.
// If your workspace has approval enabled and the value exceeds the threshold,
// this returns HTTP 202 with { approvalId } instead — poll /signing/approvals/{id}.`,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────
  // Signing Kit — approvals
  // ─────────────────────────────────────────────────────────────────────

  "POST /signing/approvals/{id}/approve-with-passkey": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/signing/approvals/$APPROVAL_ID/approve-with-passkey \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "stampedActivity": "..." }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(
  \`${API}/signing/approvals/\${approvalId}/approve-with-passkey\`,
  {
    method: "POST",
    headers: {
      Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ stampedActivity }),
  },
);
// Once approved, the gated transaction is broadcast automatically.
// The original caller (agent or user) receives the txHash on its next poll.`,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────
  // Payout Kit — accounts (cross-currency)
  // ─────────────────────────────────────────────────────────────────────

  "POST /payout/accounts/quote": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/payout/accounts/quote \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "beneficiaryId": "ben_abc123",
    "amount": 1000,
    "currency": "MXN"
  }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("${API}/payout/accounts/quote", {
  method: "POST",
  headers: {
    Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    beneficiaryId: "ben_abc123",
    amount: 1000,
    currency: "MXN",
  }),
});
const { data } = await response.json();
// data.quoteId — pass to /payout/accounts/execute
// data.rate, data.fees, data.netAmount, data.expiresAt`,
    },
  ],

  "POST /payout/accounts/execute": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/payout/accounts/execute \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "quoteId": "qte_jkl012",
    "beneficiaryId": "ben_abc123"
  }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("${API}/payout/accounts/execute", {
  method: "POST",
  headers: {
    Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ quoteId, beneficiaryId }),
});
const { data } = await response.json();
// data.reference — payment reference. Track via:
// GET /payout/accounts/{reference}/status   or   GET /orders/{orderId}
// Settlement typically completes in 1-2 business days.`,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────
  // Payout Kit — on/off-ramp
  // ─────────────────────────────────────────────────────────────────────

  "POST /payout/offramp/quote": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/payout/offramp/quote \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "from":   { "currency": "usdc", "chain": "base" },
    "to":     { "currency": "mxn",  "country": "MX" },
    "amount": "500.00"
  }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("${API}/payout/offramp/quote", {
  method: "POST",
  headers: {
    Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from:   { currency: "usdc", chain: "base" },
    to:     { currency: "mxn",  country: "MX" },
    amount: "500.00",
  }),
});`,
    },
  ],

  "POST /payout/onramp/quote": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/payout/onramp/quote \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "from":   { "currency": "mxn",  "country": "MX" },
    "to":     { "currency": "usdc", "chain": "base" },
    "amount": "10000.00"
  }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("${API}/payout/onramp/quote", {
  method: "POST",
  headers: {
    Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from:   { currency: "mxn",  country: "MX" },
    to:     { currency: "usdc", chain: "base" },
    amount: "10000.00",
  }),
});`,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────
  // Payout Kit — recipients
  // ─────────────────────────────────────────────────────────────────────

  "POST /payout/recipients": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/payout/recipients \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Maria Garcia",
    "email": "maria@example.com",
    "ownerType": "individual",
    "address": {
      "street": "Paseo de la Reforma 123",
      "city": "Mexico City",
      "country": "MX",
      "postalCode": "06600"
    }
  }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("${API}/payout/recipients", {
  method: "POST",
  headers: {
    Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "Maria Garcia",
    email: "maria@example.com",
    ownerType: "individual",
    address: {
      street: "Paseo de la Reforma 123",
      city: "Mexico City",
      country: "MX",
      postalCode: "06600",
    },
  }),
});
const { data } = await response.json();
// data.id — recipient ID. Generate an invite link next:
// POST /payout/recipients/{id}/invite`,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────
  // Payout Kit — orders
  // ─────────────────────────────────────────────────────────────────────

  "POST /orders/{id}/cancel": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/orders/$ORDER_ID/cancel \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(\`${API}/orders/\${orderId}/cancel\`, {
  method: "POST",
  headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
});
// Idempotent. Only valid while the order is in "awaiting" status.
// Returns 422 if the order has moved past awaiting.`,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────
  // Skills (Agent Kit)
  // ─────────────────────────────────────────────────────────────────────

  "POST /action/skills/{id}/execute": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/action/skills/$SKILL_ID/execute \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "input": { "query": "current AVAX price" } }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js (skills-client)",
      source: `import { executeSkillTool } from "@relayerfi/skills-client";
import { RelayerSDK } from "@relayerfi/agent-sdk";

const sdk = new RelayerSDK({ /* ... */ });

// As a Mastra tool — the agent picks the skill and parameters.
const tool = executeSkillTool(sdk);
// agent.tools.push(tool);

// Direct call:
const result = await sdk.http.request("POST", \`/action/skills/\${skillId}/execute\`, {
  input: { query: "current AVAX price" },
});`,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────
  // Balance
  // ─────────────────────────────────────────────────────────────────────

  "GET /balance/token": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -G ${API}/balance/token \\
  --data-urlencode "address=0xYourWalletAddress" \\
  --data-urlencode "chain=base" \\
  --data-urlencode "symbol=USDC" \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const params = new URLSearchParams({
  address: "0xYourWalletAddress",
  chain: "base",
  symbol: "USDC",
});
const response = await fetch(\`${API}/balance/token?\${params}\`, {
  headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
});
const { data } = await response.json();
// data.balance (string, raw integer)
// data.formatted (string, human-readable with decimals applied)`,
    },
  ],

  "GET /balance/activity": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -G ${API}/balance/activity \\
  --data-urlencode "address=0xYourWalletAddress" \\
  --data-urlencode "chain=base" \\
  --data-urlencode "days=7" \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const params = new URLSearchParams({
  address: "0xYourWalletAddress",
  chain: "base",
  days: "7",
  limit: "20",
});
const response = await fetch(\`${API}/balance/activity?\${params}\`, {
  headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
});
const { data } = await response.json();
// data: array of USDC transfers, most recent first.
// USDC only in v1.`,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────
  // Wallets — reads
  // ─────────────────────────────────────────────────────────────────────

  "GET /signing/wallets": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl ${API}/signing/wallets \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("${API}/signing/wallets", {
  headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
});
const { data } = await response.json();
// data: array of wallets with walletId, name, createdAt.`,
    },
  ],

  "GET /signing/wallets/{walletId}": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl ${API}/signing/wallets/$WALLET_ID \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(\`${API}/signing/wallets/\${walletId}\`, {
  headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
});`,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────
  // Addresses (prepare/confirm + reads)
  // ─────────────────────────────────────────────────────────────────────

  "POST /signing/wallets/accounts/prepare": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/signing/wallets/accounts/prepare \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "walletId": "wallet_abc123",
    "curve": "CURVE_SECP256K1",
    "addressFormat": "ADDRESS_FORMAT_ETHEREUM"
  }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("${API}/signing/wallets/accounts/prepare", {
  method: "POST",
  headers: {
    Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    walletId,
    curve: "CURVE_SECP256K1",
    addressFormat: "ADDRESS_FORMAT_ETHEREUM",
  }),
});
const { data } = await response.json();
// data.activity — pass to the browser for passkey stamping,
// then call /signing/wallets/accounts/confirm.`,
    },
  ],

  "POST /signing/wallets/accounts/confirm": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/signing/wallets/accounts/confirm \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "stampedActivity": "..." }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("${API}/signing/wallets/accounts/confirm", {
  method: "POST",
  headers: {
    Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ stampedActivity }),
});
const { data } = await response.json();
// data.address — newly generated address (0x... for EVM, base58 for Solana)
// data.addressId — persist this`,
    },
  ],

  "GET /signing/wallets/{walletId}/addresses": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl ${API}/signing/wallets/$WALLET_ID/addresses \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(\`${API}/signing/wallets/\${walletId}/addresses\`, {
  headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
});`,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────
  // Transactions — broadcast variants
  // ─────────────────────────────────────────────────────────────────────

  "POST /transactions/broadcast/{transactionId}": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/transactions/broadcast/$TRANSACTION_ID \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(
  \`${API}/transactions/broadcast/\${transactionId}\`,
  {
    method: "POST",
    headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
  },
);
const { data } = await response.json();
// data.txHash — chain hash once in mempool
// Submits a previously-confirmed signed transaction. Use when you gate
// broadcast separately from confirm.`,
    },
  ],

  "POST /transactions/broadcast/raw": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/transactions/broadcast/raw \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "rawSignedTransaction": "0x...",
    "network": "base"
  }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("${API}/transactions/broadcast/raw", {
  method: "POST",
  headers: {
    Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ rawSignedTransaction, network: "base" }),
});
// Use this when you signed externally (MPC, HSM, browser wallet) and want
// Relayer to handle the chain submission and status tracking.`,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────
  // Passkeys — WebAuthn ceremonies
  // ─────────────────────────────────────────────────────────────────────

  "POST /signing/passkeys/challenge": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/signing/passkeys/challenge \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("${API}/signing/passkeys/challenge", {
  method: "POST",
  headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
});
const { data } = await response.json();
// data.challenge — pass to the browser, then call navigator.credentials.create()
// with these publicKey options for passkey registration.`,
    },
  ],

  "POST /signing/passkeys/register": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/signing/passkeys/register \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "attestation": { /* WebAuthn attestation object */ },
    "name": "MacBook Touch ID"
  }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js (relayer for the browser)",
      source: `// Step 1: browser obtains attestation via navigator.credentials.create()
//   using the challenge from POST /signing/passkeys/challenge

// Step 2: register on the server
const response = await fetch("${API}/signing/passkeys/register", {
  method: "POST",
  headers: {
    Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    attestation: webauthnAttestation,
    name: "MacBook Touch ID",
  }),
});
// Creates the wallet workspace and binds the passkey credential to it.`,
    },
  ],

  "GET /signing/passkeys": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl ${API}/signing/passkeys \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("${API}/signing/passkeys", {
  headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
});`,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────
  // Approvals — additional surface
  // ─────────────────────────────────────────────────────────────────────

  "GET /signing/approvals": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl ${API}/signing/approvals \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("${API}/signing/approvals", {
  headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
});
const { data } = await response.json();
// data: pending approvals. Each has id, amount, requester, expiresAt.`,
    },
  ],

  "PATCH /signing/approval-config": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X PATCH ${API}/signing/approval-config \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "enabled": true,
    "thresholdUsd": 5000,
    "requiredApprovers": 1
  }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("${API}/signing/approval-config", {
  method: "PATCH",
  headers: {
    Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    enabled: true,
    thresholdUsd: 5000,
    requiredApprovers: 1,
  }),
});
// Transactions at or above thresholdUsd require human approval
// before the signing enclave processes them.`,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────
  // Policies
  // ─────────────────────────────────────────────────────────────────────

  "POST /signing/policies": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/signing/policies \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Max transfer limit",
    "walletId": "wallet_abc123",
    "rules": {
      "maxValueUsd": 10000,
      "allowedDestinations": ["0xAddress1", "0xAddress2"]
    }
  }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("${API}/signing/policies", {
  method: "POST",
  headers: {
    Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "Max transfer limit",
    walletId,
    rules: {
      maxValueUsd: 10000,
      allowedDestinations: ["0xAddress1", "0xAddress2"],
    },
  }),
});
// Enforced inside the signing enclave before any transaction is processed.
// A transaction that violates policy never gets signed.`,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────
  // Recovery
  // ─────────────────────────────────────────────────────────────────────

  "POST /signing/recovery/initiate": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/signing/recovery/initiate \\
  -H "Content-Type: application/json" \\
  -d '{ "email": "user@example.com" }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("${API}/signing/recovery/initiate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "user@example.com" }),
});
// Sends a recovery email. The user follows the link, registers a new
// passkey in the iframe flow, then your frontend calls /signing/recovery/sync.`,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────
  // Agents — read & control
  // ─────────────────────────────────────────────────────────────────────

  "GET /agents": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl ${API}/agents \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("${API}/agents", {
  headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
});
const { data } = await response.json();
// data: array of { id, name, status, createdAt, ... }`,
    },
  ],

  "GET /agents/{id}": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl ${API}/agents/$AGENT_ID \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(\`${API}/agents/\${agentId}\`, {
  headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
});`,
    },
  ],

  "GET /agents/{id}/budget": [
    {
      lang: "bash",
      label: "cURL (integrator)",
      source: `curl ${API}/agents/$AGENT_ID/budget \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js (SDK, agent-side)",
      source: `import { RelayerSDK } from "@relayerfi/agent-sdk";

const sdk = new RelayerSDK({ /* ... */ });

// The SDK polls this internally; you rarely call it manually.
const budget = await sdk.checkBudget(); // layers 1+2 (telemetry)
const payBudget = await sdk.checkPaymentBudget(); // layers 1+2+3 + kill switch

// Throws BudgetExhaustedError with .failedLayers if any layer is empty.`,
    },
  ],

  "GET /agents/{id}/wallet": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl ${API}/agents/$AGENT_ID/wallet \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(\`${API}/agents/\${agentId}/wallet\`, {
  headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
});
const { data } = await response.json();
// data.address (Solana base58)
// data.explorerUrl (solscan link)`,
    },
  ],

  "POST /agents/{id}/pause": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/agents/$AGENT_ID/pause \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(\`${API}/agents/\${agentId}/pause\`, {
  method: "POST",
  headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
});
// Reversible. Use for routine maintenance.
// The SDK polls /status every 30s and stops issuing payment ops on pause.`,
    },
  ],

  "POST /agents/{id}/resume": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/agents/$AGENT_ID/resume \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(\`${API}/agents/\${agentId}/resume\`, {
  method: "POST",
  headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
});`,
    },
  ],

  "POST /agents/{id}/rotate": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/agents/$AGENT_ID/rotate \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(\`${API}/agents/\${agentId}/rotate\`, {
  method: "POST",
  headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
});
const { data } = await response.json();
// data.agentSecret — NEW secret. Old one revoked instantly.
// Push the new secret to the agent runtime ASAP.`,
    },
  ],

  "POST /agents/{id}/fund/confirm": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/agents/$AGENT_ID/fund/confirm \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "stampedActivity": "..." }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(\`${API}/agents/\${agentId}/fund/confirm\`, {
  method: "POST",
  headers: {
    Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ stampedActivity }),
});
// Step 2 of 2 — forwards the passkey-stamped USDC transfer to the chain.
// data.signature, data.txHash on success.`,
    },
  ],

  "POST /agents/{id}/tools": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/agents/$AGENT_ID/tools \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "toolType": "skill",
    "toolId": "skill_xyz789"
  }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(\`${API}/agents/\${agentId}/tools\`, {
  method: "POST",
  headers: {
    Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ toolType: "skill", toolId: "skill_xyz789" }),
});
// Allowlist: an agent can only call tools explicitly assigned to it.
// Block via DELETE /agents/{id}/tools/{toolId}.`,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────
  // Widget Builders (canonical protocols)
  // ─────────────────────────────────────────────────────────────────────

  "POST /action/builders/swap": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/action/builders/swap \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "tokenIn":  "0xA0b86a33...",
    "tokenOut": "0xC02aaA39...",
    "chain":    "base",
    "title":    "Swap USDC → WETH"
  }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("${API}/action/builders/swap", {
  method: "POST",
  headers: {
    Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    tokenIn:  "0xA0b86a33...",
    tokenOut: "0xC02aaA39...",
    chain:    "base",
    title:    "Swap USDC → WETH",
  }),
});
const { data } = await response.json();
// data — canonical swap widget metadata. Use the widget metadata URL
// in your frontend's <Widget url=... /> component.`,
    },
  ],

  "POST /action/builders/transfer-native": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/action/builders/transfer-native \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "chain":  "base",
    "to":     "0xRecipient...",
    "amount": "0.05"
  }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("${API}/action/builders/transfer-native", {
  method: "POST",
  headers: {
    Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ chain: "base", to: recipientAddress, amount: "0.05" }),
});
// Returns metadata for a native-token transfer widget (ETH, MATIC, etc.).`,
    },
  ],

  "POST /action/builders/crosschain-bridge": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/action/builders/crosschain-bridge \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "fromChain": "base",
    "toChain":   "polygon",
    "token":     "USDC",
    "amount":    "100"
  }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("${API}/action/builders/crosschain-bridge", {
  method: "POST",
  headers: {
    Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    fromChain: "base",
    toChain: "polygon",
    token: "USDC",
    amount: "100",
  }),
});
// Returns metadata for a cross-chain bridge widget.`,
    },
  ],

  "POST /action/builders/crosschain-transfer": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/action/builders/crosschain-transfer \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "fromChain":  "base",
    "toChain":    "arbitrum",
    "token":      "USDC",
    "to":         "0xRecipient...",
    "amount":     "50"
  }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("${API}/action/builders/crosschain-transfer", {
  method: "POST",
  headers: {
    Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    fromChain: "base",
    toChain: "arbitrum",
    token: "USDC",
    to: recipientAddress,
    amount: "50",
  }),
});`,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────
  // Widget Execute + Quote
  // ─────────────────────────────────────────────────────────────────────

  "GET /action/execute/swap/quote": [
    {
      lang: "bash",
      label: "cURL (public)",
      source: `curl -G ${API}/action/execute/swap/quote \\
  --data-urlencode "tokenIn=0xA0b86a33..." \\
  --data-urlencode "tokenOut=0xC02aaA39..." \\
  --data-urlencode "amount=1000000" \\
  --data-urlencode "chain=base"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js (public — no auth)",
      source: `const params = new URLSearchParams({
  tokenIn: "0xA0b86a33...",
  tokenOut: "0xC02aaA39...",
  amount: "1000000",
  chain: "base",
});
const response = await fetch(\`${API}/action/execute/swap/quote?\${params}\`);
const { data } = await response.json();
// data.amountOut, data.priceImpact, data.route, data.gasEstimate
// No auth required — anyone can poll quotes.`,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────
  // Payouts — Accounts setup + status
  // ─────────────────────────────────────────────────────────────────────

  "POST /payout/accounts/setup/liquidation-address": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/payout/accounts/setup/liquidation-address \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "beneficiaryId": "ben_abc123",
    "beneficiaryAccountId": "acc_xyz789",
    "chain": "base",
    "currency": "usdc"
  }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `// Step 1 of 2 — idempotent. Links a recipient bank account to a crypto
// withdrawal address. Returns the existing one if already configured.
const response = await fetch(
  "${API}/payout/accounts/setup/liquidation-address",
  {
    method: "POST",
    headers: {
      Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      beneficiaryId,
      beneficiaryAccountId,
      chain: "base",
      currency: "usdc",
    }),
  },
);`,
    },
  ],

  "POST /payout/accounts/setup/virtual-account": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/payout/accounts/setup/virtual-account \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "beneficiaryId": "ben_abc123",
    "beneficiaryAccountId": "acc_xyz789"
  }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `// Step 2 of 2 — idempotent. Requires a withdrawal address to exist first.
const response = await fetch(
  "${API}/payout/accounts/setup/virtual-account",
  {
    method: "POST",
    headers: {
      Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ beneficiaryId, beneficiaryAccountId }),
  },
);
const { data } = await response.json();
// data.clabe — share this with your client; deposits to it trigger the off-ramp.`,
    },
  ],

  "GET /payout/accounts/{reference}/status": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl ${API}/payout/accounts/$REFERENCE/status \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(
  \`${API}/payout/accounts/\${reference}/status\`,
  { headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` } },
);`,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────
  // Payouts — On/Off-ramp idempotent creates
  // ─────────────────────────────────────────────────────────────────────

  "POST /payout/onramp/deposit-accounts": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/payout/onramp/deposit-accounts \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "currency":      "mxn",
    "country":       "MX",
    "stablecoin":    "usdc",
    "chain":         "base",
    "destinationAddress": "0xYourWallet..."
  }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("${API}/payout/onramp/deposit-accounts", {
  method: "POST",
  headers: {
    Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    currency: "mxn",
    country: "MX",
    stablecoin: "usdc",
    chain: "base",
    destinationAddress: yourWalletAddress,
  }),
});
const { data } = await response.json();
// data.clabe — the fiat deposit account. Idempotent.
// data.id — pass to GET /payout/onramp/deposit-accounts/{id}/events for tracking.`,
    },
  ],

  "POST /payout/offramp/withdraw-addresses": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/payout/offramp/withdraw-addresses \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "beneficiaryId":        "ben_abc123",
    "beneficiaryAccountId": "acc_xyz789",
    "stablecoin":           "usdc",
    "chain":                "base"
  }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("${API}/payout/offramp/withdraw-addresses", {
  method: "POST",
  headers: {
    Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    beneficiaryId,
    beneficiaryAccountId,
    stablecoin: "usdc",
    chain: "base",
  }),
});
const { data } = await response.json();
// data.address — send stablecoins here to trigger off-ramp settlement. Idempotent.`,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────
  // Payouts — Recipients (invite + bank account)
  // ─────────────────────────────────────────────────────────────────────

  "POST /payout/recipients/{id}/invite": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/payout/recipients/$BENEFICIARY_ID/invite \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(
  \`${API}/payout/recipients/\${beneficiaryId}/invite\`,
  {
    method: "POST",
    headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
  },
);
const { data } = await response.json();
// data.inviteUrl — email or share this to the recipient.
// Valid 7 days. Replaces any existing invite.`,
    },
  ],

  "POST /payout/recipients/{id}/accounts": [
    {
      lang: "bash",
      label: "cURL (CLABE/MX)",
      source: `curl -X POST ${API}/payout/recipients/$BENEFICIARY_ID/accounts \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "country":   "MX",
    "currency":  "mxn",
    "clabe":     "646180123456789012",
    "bankName":  "BBVA Mexico"
  }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js (CLABE/MX)",
      source: `const response = await fetch(
  \`${API}/payout/recipients/\${beneficiaryId}/accounts\`,
  {
    method: "POST",
    headers: {
      Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      country: "MX",
      currency: "mxn",
      clabe: "646180123456789012",
      bankName: "BBVA Mexico",
    }),
  },
);
// account_number, clabe, iban are IMMUTABLE once set.
// Use PATCH for editable fields (routing_number, address, etc.).`,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────
  // Orders
  // ─────────────────────────────────────────────────────────────────────

  "GET /orders": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -G ${API}/orders \\
  --data-urlencode "limit=20" \\
  --data-urlencode "status=awaiting_funds" \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const params = new URLSearchParams({ limit: "20", status: "awaiting_funds" });
const response = await fetch(\`${API}/orders?\${params}\`, {
  headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
});
const { data, meta } = await response.json();
// Unified across on-ramp, off-ramp, and global payment rails.
// Cursor-based pagination via meta.nextCursor.`,
    },
  ],

  "GET /orders/{id}": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl ${API}/orders/$ORDER_ID \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(\`${API}/orders/\${orderId}\`, {
  headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
});
// Accepts the friendly reference form (REL-YYYYMMDD-XXXX) or the legacy
// UUID-prefixed form (onramp_<uuid>, offramp_<uuid>, payment_<uuid>).
// Returns full timeline, deposit details, and rates.`,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────
  // Skills — registry side
  // ─────────────────────────────────────────────────────────────────────

  "GET /action/skills": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl ${API}/action/skills \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("${API}/action/skills", {
  headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
});
const { data } = await response.json();
// Returns your private skills + all public skills (visible to any integrator).`,
    },
  ],

  "POST /action/skills": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/action/skills \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name":        "Crypto Price Oracle",
    "description": "Returns current price for any ticker",
    "endpoint":    "https://my-skill.example/api/run",
    "priceUSDC":   "0.05",
    "visibility":  "public",
    "inputSchema": { "type": "object", "properties": { "symbol": { "type": "string" } } }
  }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("${API}/action/skills", {
  method: "POST",
  headers: {
    Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "Crypto Price Oracle",
    description: "Returns current price for any ticker",
    endpoint: "https://my-skill.example/api/run",
    priceUSDC: "0.05",
    visibility: "public",
    inputSchema: { type: "object", properties: { symbol: { type: "string" } } },
  }),
});
// Once registered, agents can discover it via /action/skills/bazaar
// and call it via x402fetch (the SDK handles payment automatically).`,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────
  // App — root health
  // ─────────────────────────────────────────────────────────────────────

  "GET /": [
    { lang: "bash", label: "cURL", source: `curl https://api.relayer.fi/v1/` },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("https://api.relayer.fi/v1/");
// Returns the basic service descriptor. No auth required.`,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────
  // Wallets — secondary reads
  // ─────────────────────────────────────────────────────────────────────

  "GET /signing/wallets/{walletId}/transactions": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -G ${API}/signing/wallets/$WALLET_ID/transactions \\
  --data-urlencode "limit=50" \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(
  \`${API}/signing/wallets/\${walletId}/transactions?limit=50\`,
  { headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` } },
);`,
    },
  ],

  "GET /signing/wallets/{walletId}/denials": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl ${API}/signing/wallets/$WALLET_ID/denials \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(
  \`${API}/signing/wallets/\${walletId}/denials\`,
  { headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` } },
);
// Returns every transaction that was blocked by signing policies — useful for
// debugging policy misconfiguration or security review.`,
    },
  ],

  "POST /signing/wallets": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/signing/wallets \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "name": "My Wallet" }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `// Legacy high-level create — bypasses prepare/confirm. Most integrators
// should use POST /signing/wallets/prepare → /confirm instead, which gates
// creation on the passkey ceremony. This endpoint is retained for tooling.
const response = await fetch("${API}/signing/wallets", {
  method: "POST",
  headers: {
    Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ name: "My Wallet" }),
});`,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────
  // Addresses — secondary reads
  // ─────────────────────────────────────────────────────────────────────

  "GET /signing/wallets/{walletId}/addresses/{addressId}": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl ${API}/signing/wallets/$WALLET_ID/addresses/$ADDRESS_ID \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(
  \`${API}/signing/wallets/\${walletId}/addresses/\${addressId}\`,
  { headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` } },
);`,
    },
  ],

  "POST /signing/wallets/{walletId}/addresses": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/signing/wallets/$WALLET_ID/addresses \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "curve": "CURVE_SECP256K1", "addressFormat": "ADDRESS_FORMAT_ETHEREUM" }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `// High-level address create — prefer the prepare/confirm pair for the
// passkey-gated flow. Returns the stamped activity result directly.
const response = await fetch(
  \`${API}/signing/wallets/\${walletId}/addresses\`,
  {
    method: "POST",
    headers: {
      Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      curve: "CURVE_SECP256K1",
      addressFormat: "ADDRESS_FORMAT_ETHEREUM",
    }),
  },
);`,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────
  // Transactions — remaining (lists, broadcast status, retry, cancel)
  // ─────────────────────────────────────────────────────────────────────

  "GET /transactions/sign": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -G ${API}/transactions/sign \\
  --data-urlencode "limit=50" \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(\`${API}/transactions/sign?limit=50\`, {
  headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
});`,
    },
  ],

  "GET /transactions/sign/{transactionId}": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl ${API}/transactions/sign/$TRANSACTION_ID \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(
  \`${API}/transactions/sign/\${transactionId}\`,
  { headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` } },
);
const { data } = await response.json();
// data.status: "awaiting_signature" | "signed" | "broadcast" | "confirmed" | "failed"`,
    },
  ],

  "DELETE /transactions/sign/{transactionId}": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X DELETE ${API}/transactions/sign/$TRANSACTION_ID \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `// Cancel a transaction in awaiting_signature state. Once broadcast,
// cancellation is no longer possible via this endpoint.
const response = await fetch(
  \`${API}/transactions/sign/\${transactionId}\`,
  {
    method: "DELETE",
    headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
  },
);`,
    },
  ],

  "GET /transactions/pending-signature": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl ${API}/transactions/pending-signature \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("${API}/transactions/pending-signature", {
  headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
});
// Returns all transactions awaiting passkey signature across all wallets
// in the workspace — useful for an "Outstanding actions" dashboard view.`,
    },
  ],

  "GET /transactions/broadcast/{transactionId}": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl ${API}/transactions/broadcast/$TRANSACTION_ID \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(
  \`${API}/transactions/broadcast/\${transactionId}\`,
  { headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` } },
);
const { data } = await response.json();
// data.status: "broadcast" | "confirmed" | "failed"
// data.blockNumber appears once confirmed.`,
    },
  ],

  "POST /transactions/broadcast/{transactionId}/retry": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/transactions/broadcast/$TRANSACTION_ID/retry \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `// Retry a transaction that failed at chain submission (transient: insufficient
// gas, mempool full, RPC hiccup). Re-broadcasts the existing signed tx — does
// NOT re-sign or change anything else.
const response = await fetch(
  \`${API}/transactions/broadcast/\${transactionId}/retry\`,
  {
    method: "POST",
    headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
  },
);`,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────
  // Passkeys — additional
  // ─────────────────────────────────────────────────────────────────────

  "POST /signing/passkeys/add": [
    {
      lang: "bash",
      label: "cURL",
      source: `# Browser-side WebAuthn ceremony. Cannot be called from a backend.
# Your frontend calls navigator.credentials.create() with options from
# POST /signing/passkeys/challenge, then submits the attestation here.
curl -X POST ${API}/signing/passkeys/add \\
  -H "Content-Type: application/json" \\
  -d '{ "attestation": { /* WebAuthn output */ }, "name": "iPhone Touch ID" }'`,
    },
    {
      lang: "TypeScript",
      label: "Browser",
      source: `// In the browser, after navigator.credentials.create() returns attestation:
const response = await fetch("${API}/signing/passkeys/add", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({ attestation: webauthnAttestation, name: "iPhone Touch ID" }),
});
// Adds an additional passkey to an existing wallet workspace. Recommended:
// register at least 2 passkeys per user (primary device + recovery key).`,
    },
  ],

  "PATCH /signing/passkeys/{id}": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X PATCH ${API}/signing/passkeys/$PASSKEY_ID \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "name": "MacBook Touch ID" }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(
  \`${API}/signing/passkeys/\${passkeyId}\`,
  {
    method: "PATCH",
    headers: {
      Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: "MacBook Touch ID" }),
  },
);`,
    },
  ],

  "DELETE /signing/passkeys/{id}": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X DELETE ${API}/signing/passkeys/$PASSKEY_ID \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `// Revoke a passkey. Cannot delete the last passkey on a wallet — at least
// one must remain or the wallet becomes unrecoverable. Use email recovery
// (POST /signing/recovery/initiate) if all passkeys are lost.
const response = await fetch(
  \`${API}/signing/passkeys/\${passkeyId}\`,
  {
    method: "DELETE",
    headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
  },
);`,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────
  // Recovery — remaining
  // ─────────────────────────────────────────────────────────────────────

  "POST /signing/recovery/sync": [
    {
      lang: "bash",
      label: "cURL",
      source: `# Browser-side; only the device that completed the recovery iframe flow
# has the new passkey credential to submit.
curl -X POST ${API}/signing/recovery/sync \\
  -H "Content-Type: application/json" \\
  -d '{ "recoveryToken": "rcv_...", "passkeyAttestation": { /* WebAuthn */ } }'`,
    },
    {
      lang: "TypeScript",
      label: "Browser",
      source: `// After the user completes recovery in the iframe, sync the new passkey:
const response = await fetch("${API}/signing/recovery/sync", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({ recoveryToken, passkeyAttestation: webauthnAttestation }),
});`,
    },
  ],

  "GET /signing/recovery/context": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -G ${API}/signing/recovery/context \\
  --data-urlencode "token=rcv_..." \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `// Pre-loads the recovery iframe with the right workspace context.
const response = await fetch(
  \`${API}/signing/recovery/context?token=\${recoveryToken}\`,
  { headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` } },
);`,
    },
  ],

  "GET /signing/recovery/migration-eligibility": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl ${API}/signing/recovery/migration-eligibility \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(
  "${API}/signing/recovery/migration-eligibility",
  { headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` } },
);
// Returns whether the current wallet can migrate to a newer signing scheme.`,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────
  // Approvals — remaining
  // ─────────────────────────────────────────────────────────────────────

  "GET /signing/approval-config": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl ${API}/signing/approval-config \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("${API}/signing/approval-config", {
  headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
});`,
    },
  ],

  "POST /signing/approvals/{id}/approve": [
    {
      lang: "bash",
      label: "cURL",
      source: `# Standard approve — requires a passkey-stamped activity in the body.
curl -X POST ${API}/signing/approvals/$APPROVAL_ID/approve \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "stampedActivity": "..." }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(
  \`${API}/signing/approvals/\${approvalId}/approve\`,
  {
    method: "POST",
    headers: {
      Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ stampedActivity }),
  },
);`,
    },
  ],

  "POST /signing/approvals/{id}/reject": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/signing/approvals/$APPROVAL_ID/reject \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "reason": "Amount exceeds discretionary cap" }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(
  \`${API}/signing/approvals/\${approvalId}/reject\`,
  {
    method: "POST",
    headers: {
      Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason: "Amount exceeds discretionary cap" }),
  },
);
// Reason is surfaced in the audit log and in the SDK's ApprovalRejectedError.`,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────
  // Policies — remaining
  // ─────────────────────────────────────────────────────────────────────

  "GET /signing/policies": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl ${API}/signing/policies \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("${API}/signing/policies", {
  headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
});`,
    },
  ],

  "PATCH /signing/policies/{id}": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X PATCH ${API}/signing/policies/$POLICY_ID \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "rules": { "maxValueUsd": 25000 } }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(
  \`${API}/signing/policies/\${policyId}\`,
  {
    method: "PATCH",
    headers: {
      Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ rules: { maxValueUsd: 25000 } }),
  },
);
// Policy updates apply to all FUTURE signing attempts. Already-signed
// transactions are not retroactively affected.`,
    },
  ],

  "DELETE /signing/policies/{id}": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X DELETE ${API}/signing/policies/$POLICY_ID \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `// Removes the policy. The wallet falls back to whatever workspace-level
// policies remain. Be careful: an unguarded wallet has no value-cap protection.
const response = await fetch(
  \`${API}/signing/policies/\${policyId}\`,
  {
    method: "DELETE",
    headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
  },
);`,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────
  // Agents — remaining reads/control
  // ─────────────────────────────────────────────────────────────────────

  "GET /agents/{id}/status": [
    {
      lang: "bash",
      label: "cURL (integrator)",
      source: `curl ${API}/agents/$AGENT_ID/status \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js (SDK, agent-side)",
      source: `import { RelayerSDK } from "@relayerfi/agent-sdk";

const sdk = new RelayerSDK({ /* ... */ });

// The SDK polls this every 30s automatically via KillSwitch — you rarely
// hit it manually. Use the getter to read the cached state synchronously:
if (sdk.isKillSwitchActive) {
  // skip payment operations
}

// Direct call:
const { data } = await sdk.http.get(\`/v1/agents/\${sdk.agentId}/status\`);
// data.killSwitch (boolean) — true iff status === 'killed'
// data.status — full lifecycle: active | suspended | draining | killed | paused | pending_policies`,
    },
  ],

  "GET /agents/{id}/wallet-balance": [
    {
      lang: "bash",
      label: "cURL (integrator)",
      source: `curl ${API}/agents/$AGENT_ID/wallet-balance \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js (SDK, agent-side)",
      source: `import { RelayerSDK } from "@relayerfi/agent-sdk";

const sdk = new RelayerSDK({ /* ... */ });
const response = await sdk.http.get(\`/v1/agents/\${sdk.agentId}/wallet-balance\`);
// data.balanceUSDC (string) — top up via /agents/{id}/fund/prepare when low.`,
    },
  ],

  "GET /agents/{id}/analytics": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl ${API}/agents/$AGENT_ID/analytics \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(\`${API}/agents/\${agentId}/analytics\`, {
  headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
});
// Spend breakdown by layer (infra / tokens / payments) for the current period.`,
    },
  ],

  "GET /agents/{id}/audit": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -G ${API}/agents/$AGENT_ID/audit \\
  --data-urlencode "limit=100" \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(
  \`${API}/agents/\${agentId}/audit?limit=100\`,
  { headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` } },
);
// Full event log for the agent — every payment, kill, pause, policy change.
// Cursor-based pagination via meta.nextCursor.`,
    },
  ],

  "GET /agents/analytics/summary": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl ${API}/agents/analytics/summary \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("${API}/agents/analytics/summary", {
  headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
});
// Aggregated spend + activity across every agent in the workspace.`,
    },
  ],

  "GET /agents/approvals": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl ${API}/agents/approvals \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("${API}/agents/approvals", {
  headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
});
// Pending approval requests from agents in the workspace — surface in a CFO
// dashboard with /signing/approvals/{id}/approve-with-passkey.`,
    },
  ],

  "GET /agents/{id}/tools": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl ${API}/agents/$AGENT_ID/tools \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(\`${API}/agents/\${agentId}/tools\`, {
  headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
});
// Returns tools grouped by type (skill, builder, etc.). The allowlist that
// bounds what the agent can call.`,
    },
  ],

  "DELETE /agents/{id}/tools/{toolId}": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X DELETE ${API}/agents/$AGENT_ID/tools/$TOOL_ID \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(
  \`${API}/agents/\${agentId}/tools/\${toolId}\`,
  {
    method: "DELETE",
    headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
  },
);`,
    },
  ],

  "PATCH /agents/{id}/status": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X PATCH ${API}/agents/$AGENT_ID/status \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "status": "paused" }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `// For most state transitions prefer the dedicated endpoints (/pause, /resume,
// /kill) which carry semantic intent. PATCH /status is the generic mutation
// when you need to set a state programmatically (migrations, batch ops).
const response = await fetch(\`${API}/agents/\${agentId}/status\`, {
  method: "PATCH",
  headers: {
    Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ status: "paused" }),
});`,
    },
  ],

  "DELETE /agents/{id}": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X DELETE ${API}/agents/$AGENT_ID \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `// Only valid for agents in pending_policies state (abandoned provisioning).
// To stop an active agent, use POST /agents/{id}/kill instead.
const response = await fetch(\`${API}/agents/\${agentId}\`, {
  method: "DELETE",
  headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
});`,
    },
  ],

  "POST /agents/{id}/prepare-policies": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/agents/$AGENT_ID/prepare-policies \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `// Resume an interrupted provisioning flow — regenerates the unsigned
// CREATE_POLICIES activity for Round 3.
const response = await fetch(
  \`${API}/agents/\${agentId}/prepare-policies\`,
  {
    method: "POST",
    headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
  },
);
// Pass the result to your dashboard for passkey stamping, then POST to
// /v1/agents/confirm-policies with the stamped activity.`,
    },
  ],

  "POST /agents/wallets": [
    {
      lang: "bash",
      label: "cURL",
      source: `# Agent calling on its own behalf — HMAC headers required.
# See /get-started/authentication for the signing spec, or use the SDK.
curl -X POST ${API}/agents/wallets \\
  -H "x-agent-id: $AGENT_ID" \\
  -H "x-agent-auth: $HMAC_SIGNATURE_HEX" \\
  -H "x-request-timestamp: $UNIX_TS" \\
  -H "Content-Type: application/json" \\
  -d '{ "walletName": "Operations" }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js (SDK)",
      source: `import { RelayerSDK } from "@relayerfi/agent-sdk";

const sdk = new RelayerSDK({ /* ... */ });

// Requires the agent's policies to include "Allow: Agent — Create Wallets".
// Defaults to a Solana ED25519 account when accounts is omitted.
const { wallet_id, addresses } = await sdk.createUserWallet({
  walletName: "Operations",
});`,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────
  // Action: Execute (swap variants beyond quote)
  // ─────────────────────────────────────────────────────────────────────

  "POST /action/execute/swap": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/action/execute/swap \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "tokenIn":  "0xA0b86a33...",
    "tokenOut": "0xC02aaA39...",
    "amount":   "1000000",
    "chain":    "base"
  }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `// Returns a serialized swap transaction ready to be signed. For the
// passkey-gated flow, prefer /prepare + /confirm instead.
const response = await fetch("${API}/action/execute/swap", {
  method: "POST",
  headers: {
    Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    tokenIn: "0xA0b86a33...",
    tokenOut: "0xC02aaA39...",
    amount: "1000000",
    chain: "base",
  }),
});`,
    },
  ],

  "POST /action/execute/swap/prepare": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/action/execute/swap/prepare \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "tokenIn":  "0xA0b86a33...",
    "tokenOut": "0xC02aaA39...",
    "amount":   "1000000",
    "chain":    "base"
  }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `// Direct DEX swap, prepare step. Returns the unsigned tx for passkey signing
// in the browser. Pair with /action/execute/swap/confirm.
const response = await fetch("${API}/action/execute/swap/prepare", {
  method: "POST",
  headers: {
    Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    tokenIn: "0xA0b86a33...",
    tokenOut: "0xC02aaA39...",
    amount: "1000000",
    chain: "base",
  }),
});`,
    },
  ],

  "POST /action/execute/swap/confirm": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/action/execute/swap/confirm \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "transactionId": "tx_def456", "signedTransaction": "0x..." }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `// Confirm a prepared swap. Same shape as POST /v1/transactions/confirm but
// runs the swap-specific post-validation (slippage, route, etc.) before broadcast.
const response = await fetch("${API}/action/execute/swap/confirm", {
  method: "POST",
  headers: {
    Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ transactionId, signedTransaction }),
});`,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────
  // Action: Directory + Tokens (public reads)
  // ─────────────────────────────────────────────────────────────────────

  "GET /action/directory": [
    {
      lang: "bash",
      label: "cURL (public)",
      source: `curl ${API}/action/directory`,
    },
    {
      lang: "TypeScript",
      label: "Node.js (public — no auth)",
      source: `const response = await fetch("${API}/action/directory");
const { data } = await response.json();
// Public feed of approved widgets. Used by the platform observers (Twitter/X,
// YouTube, Twitch) to validate whether a widget URL is trusted.`,
    },
  ],

  "GET /action/tokens/{chain}/{protocol}": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl ${API}/action/tokens/base/uniswap \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(\`${API}/action/tokens/base/uniswap\`, {
  headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
});
// Returns the protocol's token list for the chain — useful for hydrating
// dropdowns in custom widget UIs.`,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────
  // Skills — remaining
  // ─────────────────────────────────────────────────────────────────────

  "GET /action/skills/{id}": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl ${API}/action/skills/$SKILL_ID \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(\`${API}/action/skills/\${skillId}\`, {
  headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
});`,
    },
  ],

  "PATCH /action/skills/{id}": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X PATCH ${API}/action/skills/$SKILL_ID \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "priceUSDC": "0.10", "description": "Updated description" }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(\`${API}/action/skills/\${skillId}\`, {
  method: "PATCH",
  headers: {
    Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ priceUSDC: "0.10", description: "Updated description" }),
});
// Only the skill owner can update. Endpoint URL is also editable.`,
    },
  ],

  "DELETE /action/skills/{id}": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X DELETE ${API}/action/skills/$SKILL_ID \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(\`${API}/action/skills/\${skillId}\`, {
  method: "DELETE",
  headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
});
// Soft-delete. Active agents that have this skill in their tool allowlist
// will stop being able to execute it on next call.`,
    },
  ],

  "POST /action/skills/{id}/test": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/action/skills/$SKILL_ID/test \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "input": { "symbol": "ETH" } }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `// Owner-only manual invocation. Bypasses the x402 payment loop — useful
// for verifying the skill responds correctly before exposing it to agents.
const response = await fetch(\`${API}/action/skills/\${skillId}/test\`, {
  method: "POST",
  headers: {
    Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ input: { symbol: "ETH" } }),
});`,
    },
  ],

  "GET /action/skills/{id}/health": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl ${API}/action/skills/$SKILL_ID/health \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(\`${API}/action/skills/\${skillId}/health\`, {
  headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
});
// Last health check result for the skill's endpoint. The platform pings
// public skills every 5 minutes; unhealthy skills are hidden from the bazaar.`,
    },
  ],

  "GET /action/skills/bazaar": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl ${API}/action/skills/bazaar \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("${API}/action/skills/bazaar", {
  headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
});
// All public, healthy, paid skills — the marketplace agents discover from.`,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────
  // Payouts — Accounts / Off-ramp / On-ramp reads
  // ─────────────────────────────────────────────────────────────────────

  "GET /payout/accounts": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl ${API}/payout/accounts \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("${API}/payout/accounts", {
  headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
});
// All payments executed by the workspace. Filter via query params if needed.`,
    },
  ],

  "GET /payout/offramp/withdraw-addresses/{id}": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl ${API}/payout/offramp/withdraw-addresses/$WITHDRAW_ID \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(
  \`${API}/payout/offramp/withdraw-addresses/\${withdrawId}\`,
  { headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` } },
);`,
    },
  ],

  "GET /payout/offramp/withdraw-addresses/{id}/drains": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl ${API}/payout/offramp/withdraw-addresses/$WITHDRAW_ID/drains \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(
  \`${API}/payout/offramp/withdraw-addresses/\${withdrawId}/drains\`,
  { headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` } },
);
// Each "drain" = a stablecoin deposit that triggered a fiat settlement.
// Useful for reconciling on-chain deposits against bank settlements.`,
    },
  ],

  "GET /payout/onramp/deposit-accounts": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl ${API}/payout/onramp/deposit-accounts \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("${API}/payout/onramp/deposit-accounts", {
  headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
});`,
    },
  ],

  "GET /payout/onramp/deposit-accounts/{id}": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl ${API}/payout/onramp/deposit-accounts/$DEPOSIT_ID \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(
  \`${API}/payout/onramp/deposit-accounts/\${depositId}\`,
  { headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` } },
);`,
    },
  ],

  "GET /payout/onramp/deposit-accounts/{id}/events": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl ${API}/payout/onramp/deposit-accounts/$DEPOSIT_ID/events \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(
  \`${API}/payout/onramp/deposit-accounts/\${depositId}/events\`,
  { headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` } },
);
// Lifecycle events: deposit_received → fiat_converted → stablecoin_sent → completed.`,
    },
  ],

  // ─────────────────────────────────────────────────────────────────────
  // Payouts — Recipients (CRUD + reads)
  // ─────────────────────────────────────────────────────────────────────

  "GET /payout/recipients": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl ${API}/payout/recipients \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("${API}/payout/recipients", {
  headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
});`,
    },
  ],

  "GET /payout/recipients/with-accounts": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl ${API}/payout/recipients/with-accounts \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch("${API}/payout/recipients/with-accounts", {
  headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` },
});
// Recipients with their linked bank accounts embedded — single query, no N+1.`,
    },
  ],

  "PATCH /payout/recipients/{id}": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X PATCH ${API}/payout/recipients/$BENEFICIARY_ID \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "name": "Maria Garcia Hernandez", "email": "maria@new.example" }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(
  \`${API}/payout/recipients/\${beneficiaryId}\`,
  {
    method: "PATCH",
    headers: {
      Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Maria Garcia Hernandez",
      email: "maria@new.example",
    }),
  },
);`,
    },
  ],

  "PATCH /payout/recipients/{id}/status": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X PATCH ${API}/payout/recipients/$BENEFICIARY_ID/status \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "status": "archived" }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `// Archived recipients cannot receive new payouts. Reverse with status: "active".
const response = await fetch(
  \`${API}/payout/recipients/\${beneficiaryId}/status\`,
  {
    method: "PATCH",
    headers: {
      Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: "archived" }),
  },
);`,
    },
  ],

  "GET /payout/recipients/{id}/invite": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl ${API}/payout/recipients/$BENEFICIARY_ID/invite \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(
  \`${API}/payout/recipients/\${beneficiaryId}/invite\`,
  { headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` } },
);
// Returns the existing invite link (if one exists). Use POST to generate new.`,
    },
  ],

  "GET /payout/recipients/{id}/accounts": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl ${API}/payout/recipients/$BENEFICIARY_ID/accounts \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(
  \`${API}/payout/recipients/\${beneficiaryId}/accounts\`,
  { headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` } },
);`,
    },
  ],

  "PATCH /payout/recipients/{id}/accounts/{accountId}": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X PATCH ${API}/payout/recipients/$BENEFICIARY_ID/accounts/$ACCOUNT_ID \\
  -H "Authorization: ApiKey $RELAYER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "checkingOrSavings": "savings" }'`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `// Editable fields: routing_number, checking_or_savings, address.
// IMMUTABLE: account_number, clabe, iban — to change those, delete and re-add.
const response = await fetch(
  \`${API}/payout/recipients/\${beneficiaryId}/accounts/\${accountId}\`,
  {
    method: "PATCH",
    headers: {
      Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ checkingOrSavings: "savings" }),
  },
);`,
    },
  ],

  "GET /payout/recipients/{id}/orders": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl ${API}/payout/recipients/$BENEFICIARY_ID/orders \\
  -H "Authorization: ApiKey $RELAYER_API_KEY"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js",
      source: `const response = await fetch(
  \`${API}/payout/recipients/\${beneficiaryId}/orders\`,
  { headers: { Authorization: \`ApiKey \${process.env.RELAYER_API_KEY}\` } },
);
// Recent orders for this recipient — useful for the recipient detail page.`,
    },
  ],

  "POST /orders/{id}/sync-bridge-activity": [
    {
      lang: "bash",
      label: "cURL",
      source: `curl -X POST ${API}/orders/$ORDER_ID/sync-bridge-activity \\
  -H "Authorization: Bearer $SESSION_JWT"`,
    },
    {
      lang: "TypeScript",
      label: "Node.js (dashboard)",
      source: `// Dashboard-only reconciliation tool. Pulls the latest rails-partner activity
// log and inserts any timeline events the local store is missing. Idempotent.
// Typically invoked when an operator manually refreshes an order detail view.
const response = await fetch(\`${API}/orders/\${orderId}/sync-bridge-activity\`, {
  method: "POST",
  headers: { Authorization: \`Bearer \${sessionJwt}\` },
});`,
    },
  ],
};
