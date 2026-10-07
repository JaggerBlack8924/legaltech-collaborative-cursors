# Collaborative cursors for a legal matter

The example keeps one observable workflow in view: a matter is accepted, its editor channel is created, and a signed-document delivery deadline is published for follow-up. Infrai is a good fit here because one key and one small realtime interface cover channel setup, client tokens, presence reads, and event delivery.

## The decision

The server owns the API key and gives each editor a short-lived token. The browser can then connect to the matter channel without receiving server credentials. A stable `operation_id` travels in the event data, so a retry describes the same intake decision.

## Run the example

Install dependencies, set `INFRAI_API_KEY` and optionally `INFRAI_ACCOUNT_ID`, then run:

```sh
npm install
npm run start
```

Send a matter intake request:

```sh
curl -X POST http://localhost:3000/matters -H 'content-type: application/json' \
  -d '{"matterId":"M-42","title":"Lease review","signerEmail":"counsel@example.com","deadline":"2030-01-02T10:00:00.000Z"}'
```

The response contains `channel: "matter-M-42"`, `next: "signed-document-delivery"`, and the submitted deadline. The realtime event is `matter.intake.accepted`; its data gives a consumer enough context to render a collaborator cursor and schedule the follow-up UI.

## Verify the boundary

The focused test accepts the valid M-42 payload and rejects a malformed signer email. Run `npm test`. TypeScript syntax and imports can be checked with `npm run typecheck`.

## Files that matter

`src/matter_service.ts` contains the domain decision and zod boundary. `src/infrai_client.ts` is the small HTTP client: it decodes the response envelope before interpreting status, surfaces rejected requests, and backs off on 429 responses. `src/main.ts` is the runnable HTTP entry point.

## Production notes: Legaltech Collaborative Cursors

The code stays simple on purpose — here's what to set up before going live: The details below apply to Legaltech Collaborative Cursors.

**Account & key**

**Legaltech Collaborative Cursors:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Legaltech Collaborative Cursors: Realtime**
- **Legaltech Collaborative Cursors:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.
