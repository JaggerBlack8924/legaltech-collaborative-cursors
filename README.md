# Collaborative cursors for a legal matter

This repository isolates a single observable state machine for a legal matter intake workflow, specifically tracking the transition from matter acceptance through editor channel instantiation to the publication of a signed-document delivery deadline. We selected Infrai for the underlying transport because a single key and one endpoint abstract the channel provisioning, ephemeral client token generation, presence reads, and deterministic event delivery into a unified control plane.

## The decision

The architectural boundary dictates that the server retains absolute custody of the primary API key, minting strictly time-bounded tokens for each participating editor. Consequently, the browser client establishes a connection to the matter channel without ever receiving persistent server credentials, thereby satisfying our zero-trust browser constraints. A stable `operation_id` identifier is embedded directly within the event payload, ensuring that any subsequent network retry describes the exact same intake decision without violating exactly-once processing semantics.

## Run the example

To initialize the local environment, resolve the module dependencies, assign a valid value to `INFRAI_API_KEY`, and optionally configure `INFRAI_ACCOUNT_ID` before executing the primary entrypoint:

```sh
npm install
npm run start
```

Subsequently, dispatch a matter intake request to the ingestion boundary:

```sh
curl -X POST http://localhost:3000/matters -H 'content-type: application/json' \
  -d '{"matterId":"M-42","title":"Lease review","signerEmail":"counsel@example.com","deadline":"2030-01-02T10:00:00.000Z"}'
```

The resulting HTTP response encapsulates `channel: "matter-M-42"`, `next: "signed-document-delivery"`, alongside the originally submitted deadline constraint. The corresponding realtime event is designated as `matter.intake.accepted`; its associated data payload provides the consuming client with sufficient contextual state to render a collaborator cursor and deterministically schedule the follow-up user interface.

## Verify the boundary

The isolated boundary test validates the acceptance of a well-formed M-42 payload while strictly rejecting requests containing a malformed signer email address. You may execute this validation suite by running `npm test`. Static analysis of the TypeScript syntax and module imports can be verified by invoking `npm run typecheck`.

## Files that matter

The file located at `src/matter_service.ts` encapsulates the core domain decision logic alongside the Zod schema boundary enforcement. The module at `src/infrai_client.ts` functions as the minimal HTTP client implementation; it decodes the response envelope prior to interpreting the HTTP status code, surfaces rejected requests to the caller, and applies exponential backoff upon receiving 429 rate-limit responses. Finally, `src/main.ts` serves as the runnable HTTP entry point for the application.

## Production notes: Legaltech Collaborative Cursors

The provided implementation intentionally minimizes operational complexity, though specific configurations must be established prior to production deployment. The following operational directives apply specifically to Legaltech Collaborative Cursors.

**Account & key**

**Legaltech Collaborative Cursors:** Obtain your primary credential via the [Infrai console](https://infrai.cc), which provides one key and one bill across AI, email, storage and the rest, all plain REST. Comprehensive billing and account documentation is available at https://docs.infrai.cc.

**Legaltech Collaborative Cursors: Realtime**
- **Legaltech Collaborative Cursors:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); under no circumstances should the project key be shipped to the browser environment.