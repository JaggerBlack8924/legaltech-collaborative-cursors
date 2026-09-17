import assert from "node:assert/strict";
import { intakeSchema } from "../src/matter_service.js";

const valid = { matterId: "M-42", title: "Lease review", signerEmail: "counsel@example.com", deadline: "2030-01-02T10:00:00.000Z" };
assert.equal(intakeSchema.parse(valid).matterId, "M-42");
assert.throws(() => intakeSchema.parse({ ...valid, signerEmail: "invalid" }));
console.log("matter intake validation passed");
