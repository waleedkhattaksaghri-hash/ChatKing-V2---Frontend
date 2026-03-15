import test from "node:test";
import assert from "node:assert/strict";
import {
  ISSUE_TYPE_VISIBLE_FIELDS,
  buildIssueTypeAiConfig,
  buildIssueTypePayload,
  createIssueTypeDraft,
  mergeSavedIssueType,
  normalizeIssueTypeRecord,
  removeIssueTypeRow,
  updateIssueTypeField,
  validateIssueType,
} from "./issueTypes.js";

test("render model exposes only the simplified issue type fields", () => {
  assert.deepEqual(ISSUE_TYPE_VISIBLE_FIELDS, [
    "Name",
    "Description",
    "AI Instructions",
    "Escalation Rules",
  ]);
});

test("add flow creates a new dirty draft row", () => {
  const row = createIssueTypeDraft();
  assert.equal(row.isNew, true);
  assert.equal(row.isDirty, true);
  assert.equal(row.name, "");
});

test("delete flow removes a row by id", () => {
  const rows = [
    { id: "a" },
    { id: "b" },
  ];

  assert.deepEqual(removeIssueTypeRow(rows, "a"), [{ id: "b" }]);
});

test("save flow builds a payload with only supported AI fields and legacy compatibility", () => {
  const payload = buildIssueTypePayload({
    name: "Refund Request",
    description: "Customer wants a refund",
    aiInstructions: "Use for refund-related complaints.",
    escalationRulesText: "Chargeback threat\nLegal threat",
    legacy: {
      reference: "legacy-ref",
      status: "active",
      attributes: { old: true },
    },
  }, "client-1");

  assert.equal(payload.client_id, "client-1");
  assert.equal(payload.name, "Refund Request");
  assert.equal(payload.description, "Customer wants a refund");
  assert.equal(payload.ai_instructions, "Use for refund-related complaints.");
  assert.deepEqual(payload.escalation_rules, { rules: ["Chargeback threat", "Legal threat"] });
  assert.equal(payload.reference, "legacy-ref");
  assert.deepEqual(payload.attributes, { old: true });
});

test("legacy records still normalize without breaking", () => {
  const row = normalizeIssueTypeRecord({
    id: "legacy-1",
    name: "Missing Item",
    reference: "MI-01",
    sop: "Missing item SOP",
    description: "Order item missing",
    ai_instructions: "Use for item not received.",
    escalation_rules: { rules: ["VIP customer"] },
    fixed_parameters: { old: true },
    confidence_threshold: 0.84,
    status: "draft",
  });

  assert.equal(row.persistedId, "legacy-1");
  assert.equal(row.name, "Missing Item");
  assert.equal(row.escalationRulesText, "VIP customer");
  assert.equal(row.legacy.reference, "MI-01");
  assert.equal(row.legacy.sop, "Missing item SOP");
  assert.equal(row.legacy.confidence_threshold, 0.84);
});

test("AI config generation uses only the approved fields", () => {
  const config = buildIssueTypeAiConfig({
    name: "Delay",
    description: "Delivery is late",
    aiInstructions: "Use for ETA issues.",
    escalationRulesText: "Executive complaint",
    legacy: {
      reference: "DLY",
      sop: "old",
      attributes: { ignored: true },
    },
  });

  assert.deepEqual(config, {
    name: "Delay",
    description: "Delivery is late",
    aiInstructions: "Use for ETA issues.",
    escalationRules: { rules: ["Executive complaint"] },
  });
});

test("save merge replaces a draft with the saved record", () => {
  const rows = [{
    id: "draft-1",
    persistedId: null,
    isNew: true,
    isDirty: true,
    name: "Refund Request",
    description: "",
    aiInstructions: "",
    escalationRulesText: "",
    legacy: {},
  }];

  const merged = mergeSavedIssueType(rows, {
    id: "db-1",
    name: "Refund Request",
    description: "Customer wants a refund",
    ai_instructions: "Use for refunds.",
    escalation_rules: { rules: ["Chargeback threat"] },
    status: "active",
  });

  assert.equal(merged[0].persistedId, "db-1");
  assert.equal(merged[0].isNew, false);
});

test("validation only requires a name in the simplified flow", () => {
  assert.equal(validateIssueType({ name: "" }).valid, false);
  assert.equal(validateIssueType({ name: "Refund Request" }).valid, true);
});

test("editing a field marks the row dirty", () => {
  const rows = [{ id: "1", name: "Old", isDirty: false }];
  const updated = updateIssueTypeField(rows, "1", "name", "New");
  assert.equal(updated[0].name, "New");
  assert.equal(updated[0].isDirty, true);
});
