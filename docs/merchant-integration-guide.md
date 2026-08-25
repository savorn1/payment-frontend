# Merchant API Integration Guide

This guide covers everything a merchant needs to integrate with the platform: authentication, the payments/deposits/withdrawals API, and receiving webhook notifications.

All merchant endpoints live under `/api/merchant/**` on the payment-wallet backend and are authenticated with an **API key**, separate from the JWT-based auth used by the admin dashboard and end users.

## 1. Getting onboarded

Merchant accounts are created by a platform admin, not self-service:

1. An admin creates your merchant account: `POST /api/merchants` (requires you to already have a platform user account with a wallet).
2. The admin issues your first API key: `POST /api/merchants/{id}/api-keys`.
   This returns the raw key **exactly once** — store it immediately, it cannot be retrieved again:
   ```json
   {
     "data": {
       "id": 1,
       "keyId": "a1b2c3d4",
       "rawKey": "a1b2c3d4.9f3e7c1a...redacted...",
       "createdAt": "2026-08-25T10:00:00"
     }
   }
   ```
3. You configure your webhook URL (see [§6](#6-receiving-webhooks)), either yourself via `PUT /api/merchant/webhook` or by asking the admin to set it via `PUT /api/merchants/{id}/webhook`.

If your key is ever compromised, ask an admin to revoke it (`DELETE /api/merchants/{id}/api-keys/{apiKeyId}`) and issue a new one. Keys are single-use secrets — there is no way to rotate the secret on an existing `keyId`.

## 2. Authentication

Every request to `/api/merchant/**` must carry an `X-API-Key` header (**not** `Authorization`):

```
X-API-Key: {keyId}.{secret}
```

This is the exact `rawKey` value returned when the key was created — a `keyId`, a literal `.`, and the secret. Do not split or re-encode it.

- A revoked key, a suspended merchant account, or a malformed header all return `401 Unauthorized`.
- An API key only grants access to `/api/merchant/**`. It cannot be used against the admin or end-user JWT-authenticated endpoints, and a user/admin JWT cannot be used against `/api/merchant/**` — the two auth mechanisms are fully separate.

## 3. Base URL

```
{BACKEND_BASE}/api/merchant
```

Ask your platform contact for the base URL of the environment you're integrating against (sandbox vs. production). All examples below are relative to this path.

## 4. Response envelope

Every response is wrapped the same way.

**Single-item responses:**
```json
{
  "traceId": "b3f1...",
  "statusCode": 200,
  "message": "success",
  "data": { }
}
```

**List responses** (`data` is an array, plus pagination `metadata`):
```json
{
  "traceId": "b3f1...",
  "statusCode": 200,
  "message": "success",
  "data": [ ],
  "metadata": {
    "hasNext": true,
    "hasPrev": false,
    "totalPage": 4,
    "currentPage": 1,
    "limit": 20,
    "totalCount": 73
  }
}
```

List endpoints accept `page` (1-based, default `1`) and `size` (default `10` or `20` depending on endpoint) query params, plus `sortBy`/`sortOrder` (`asc`|`desc`) where noted below.

## 5. Errors

Non-2xx responses use this shape:

```json
{ "statusCode": 400, "message": "Validation failed", "errors": { "amount": "Amount must be greater than zero" } }
```

| Status | Meaning |
|---|---|
| 400 | Validation failed — see `errors` for per-field messages |
| 401 | Missing/invalid `X-API-Key`, or merchant account suspended |
| 403 | Authenticated, but not permitted to access this resource (e.g. a payment that isn't yours) |
| 404 | Resource not found |
| 409 | Conflict (e.g. amount outside withdrawal limits, insufficient balance) |

## 6. Endpoints

### Wallet

**`GET /wallet`** — your merchant balance.

```json
{ "id": 1, "userId": 42, "balance": 1500.00, "availableBalance": 1450.00, "pendingBalance": 50.00, "currency": "USD", "createdAt": "...", "updatedAt": "..." }
```

`availableBalance` excludes funds tied up in pending transactions — use this, not `balance`, when deciding whether an action can proceed.

### Payments (send funds to another wallet)

**`POST /payments`**
```json
{ "payeeUserId": 99, "amount": 25.00, "description": "Order #1042", "idempotencyKey": "a-client-generated-uuid" }
```
`idempotencyKey` is **required**. Retrying the same key returns the original payment instead of sending twice — generate a fresh UUID per logical payment, and reuse it only when retrying that same attempt (e.g. after a timeout).

Response (`PaymentResponse`):
```json
{
  "id": 501, "payerUserId": 42, "payeeUserId": 99,
  "amount": 25.00, "feeAmount": 0.00, "totalAmount": 25.00, "currency": "USD",
  "status": "SUCCESS", "description": "Order #1042", "failureReason": null,
  "debitTransactionId": 1001, "creditTransactionId": 1002,
  "createdAt": "...", "updatedAt": "..."
}
```
`status` is one of `PENDING` | `SUCCESS` | `FAILED`. Payments settle synchronously in this system, so you'll almost always see a terminal status in the response itself — still handle `PENDING` defensively and rely on the webhook (or `GET /payments/{id}`) rather than assuming the create call is the final word.

**`GET /payments/{id}`** — fetch one payment.

**`GET /payments`** — list your payments. Query params: `status`, `direction` (`ALL`|`SENT`|`RECEIVED`, default `ALL`), `startDate`, `endDate` (ISO dates), `minAmount`, `maxAmount`, `sortBy` (default `createdAt`), `sortOrder`, `page`, `size`.

### Deposits (top up your wallet from an external payment method)

**`POST /deposits`**
```json
{ "amount": 100.00, "idempotencyKey": "a-client-generated-uuid" }
```
`idempotencyKey` is optional here but still recommended.

Response (`DepositResponse`):
```json
{
  "id": 301, "userId": 42, "amount": 100.00, "currency": "USD",
  "status": "PENDING", "provider": "SAMPLE", "providerReference": "SAMPLE-...",
  "paymentUrl": "https://gateway.example/SAMPLE-...", "qrCodeData": "https://gateway.example/SAMPLE-...",
  "failureReason": null, "walletTransactionId": null, "createdAt": "...", "updatedAt": "..."
}
```
Redirect the payer to `paymentUrl`, or render `qrCodeData` as a QR code for them to scan. The deposit stays `PENDING` until the gateway calls back; poll `GET /deposits/{id}` or wait for the `DEPOSIT` webhook event for the terminal `SUCCESS`/`FAILED` status.

**`GET /deposits/{id}`**, **`GET /deposits`** — same filter params as payments, using `DepositStatus` (`PENDING`|`SUCCESS`|`FAILED`|`CANCELLED`|`REFUNDED`).

### Withdrawals (move funds out of your wallet)

**`POST /withdrawals`**
```json
{ "amount": 200.00, "destination": "bank-account-or-payout-reference", "idempotencyKey": "a-client-generated-uuid" }
```

Response (`WithdrawalResponse`) includes `feeAmount`/`totalAmount` and starts at `status: "PENDING"` — withdrawals require admin approval before processing, so expect `APPROVED` → `SUCCESS`/`FAILED`, or `REJECTED`, to arrive later via webhook/polling, not in the create response.

**`GET /withdrawals/{id}`**, **`GET /withdrawals`** — same filter pattern, using `WithdrawalStatus` (`PENDING`|`APPROVED`|`REJECTED`|`SUCCESS`|`FAILED`).

## 7. Receiving webhooks

Configure a webhook URL to be notified when a payment, deposit, or withdrawal you're party to reaches a terminal state, instead of polling.

**`GET /webhook`** — view current config (`webhookUrl`, `webhookSecret`).
**`PUT /webhook`** — set/update it:
```json
{ "webhookUrl": "https://your-server.example.com/webhooks/payment-platform" }
```
A `webhookSecret` is generated automatically the first time you configure a URL and never changes afterward — save it for signature verification below.

### Payload

We `POST` this JSON body to your `webhookUrl`:

```json
{
  "eventType": "DEPOSIT",
  "transactionId": 301,
  "status": "SUCCESS",
  "amount": 100.00,
  "currency": "USD",
  "failureReason": null,
  "occurredAt": "2026-08-25T10:05:00"
}
```

`eventType` is one of `DEPOSIT` | `WITHDRAWAL` | `PAYMENT_SENT` | `PAYMENT_RECEIVED`. `transactionId` is the id of the deposit/withdrawal/payment — fetch full details with the corresponding `GET` endpoint if you need more than the webhook carries.

### Verifying the signature

Every delivery includes an `X-Webhook-Signature` header: a hex-encoded HMAC-SHA256 of the **exact raw JSON body**, signed with your `webhookSecret`.

```js
const crypto = require('crypto');

function verifyWebhook(rawBody, signatureHeader, webhookSecret) {
  const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
}
```

Verify against the **raw, unparsed request body** — re-serializing a parsed JSON object before hashing can change whitespace/key order and break the comparison. Reject the request (do not act on it) if verification fails.

### Delivery behavior

- Delivery is best-effort and asynchronous: a slow/unreachable endpoint on your side never delays or fails the underlying payment/deposit/withdrawal call.
- We do **not** automatically retry a failed delivery. Use `GET /webhook/deliveries` (paginated, `page`/`size` params) to see delivery history — `success`, `httpStatus`, `errorMessage` — and treat polling the relevant `GET` endpoint as your fallback if a delivery is missing.
- Respond `2xx` quickly; anything else is logged as a failed delivery.

## 8. Status lifecycles

| Type | Flow |
|---|---|
| Payment | `PENDING` → `SUCCESS` / `FAILED` (settles synchronously in practice) |
| Deposit | `PENDING` → `SUCCESS` / `FAILED`, or `PENDING` → `CANCELLED`; a `SUCCESS` deposit can later become `REFUNDED` by an admin |
| Withdrawal | `PENDING` → `APPROVED` → `SUCCESS` / `FAILED`, or `PENDING` → `REJECTED` |

## 9. Idempotency

`payments` and `deposits`/`withdrawals` accept a client-generated `idempotencyKey`. Reusing the same key for a retried request returns the original resource instead of creating a duplicate — generate a new UUID per logical operation, and only replay the same key when retrying that exact same attempt (e.g. after a network timeout where you don't know if the first call landed).

## 10. Security

### API key handling

- Treat the `rawKey` (`keyId.secret`) as a production credential: store it in a secrets manager, never in source control, client-side code, or logs. It's shown once, at creation, and cannot be retrieved again.
- The secret is never stored in plaintext on our side either — only a hash of it is kept, compared with a constant-time comparison. There is no "view existing key" endpoint, by design.
- Scope isolation is enforced at the framework level, not just in application logic: a merchant API key only unlocks `/api/merchant/**`, and a user/admin session token is rejected there — the two credential types can't be substituted for each other even by accident.
- **Rotate without downtime:** issue a new key (`POST /api/merchants/{id}/api-keys` — your admin contact does this), switch your integration over to it, then revoke the old one (`DELETE /api/merchants/{id}/api-keys/{apiKeyId}`). Revoking is immediate and independent of your other keys.
- If a key leaks (committed to a repo, logged, exposed in a client), revoke it immediately and rotate — there is no way to invalidate just the exposure without revoking the key itself.

### Webhook signature verification

- Always verify `X-Webhook-Signature` before acting on a delivery — see [§7](#7-receiving-webhooks) for the HMAC-SHA256 scheme and code sample.
- Use a constant-time comparison (`crypto.timingSafeEqual` or equivalent) rather than `===`/`.equals()` — a naive string comparison leaks timing information an attacker can use to guess the signature byte-by-byte.
- Hash the **raw request body**, not a re-parsed/re-serialized JSON object — reserializing can reorder keys or change whitespace and break verification even for a legitimate delivery.
- **Replay awareness:** the signed payload carries no timestamp or nonce, so a captured, validly-signed delivery could in principle be re-sent by anyone who intercepts it. If that matters for your threat model, deduplicate incoming webhooks by `transactionId` + `status` server-side rather than trusting delivery uniqueness.
- Failed webhook deliveries are **not** retried automatically (see [§7](#7-receiving-webhooks)) — don't treat "we received the webhook" as your only signal for anything security- or money-critical (e.g. releasing goods). Reconcile against `GET /payments/{id}` / `GET /deposits/{id}` / `GET /withdrawals/{id}` as the source of truth.

### Transport

- All calls are server-to-server over HTTPS — the backend has no CORS configuration and isn't meant to be called from a browser.
- `webhookUrl` accepts both `http://` and `https://` at the API level (`ConfigureWebhookRequest` only checks it's a well-formed URL) — always use `https://` in practice; nothing stops you from configuring plain HTTP, but doing so exposes both the payload and your `X-Webhook-Signature` in transit.
- There's no IP allowlisting or mutual TLS on either leg. The API key (outbound) and the HMAC signature (inbound) are the entire trust boundary — protect both accordingly.

## 11. Quick start

```bash
# Check your wallet balance
curl -H "X-API-Key: a1b2c3d4.9f3e7c1a...redacted..." \
  https://{BACKEND_BASE}/api/merchant/wallet

# Send a payment
curl -X POST https://{BACKEND_BASE}/api/merchant/payments \
  -H "X-API-Key: a1b2c3d4.9f3e7c1a...redacted..." \
  -H "Content-Type: application/json" \
  -d '{"payeeUserId": 99, "amount": 25.00, "description": "Order #1042", "idempotencyKey": "'"$(uuidgen)"'"}'
```
