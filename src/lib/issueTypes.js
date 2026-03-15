export const ISSUE_TYPE_VISIBLE_FIELDS = [
  "Name",
  "Description",
  "AI Instructions",
  "Escalation Rules",
];

export function createIssueTypeDraft() {
  return {
    id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    persistedId: null,
    isNew: true,
    isDirty: true,
    name: "",
    description: "",
    aiInstructions: "",
    escalationRulesText: "",
    legacy: {},
  };
}

export function formatEscalationRulesForEditor(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value?.rules)) return value.rules.join("\n");

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "";
  }
}

export function parseEscalationRulesInput(value) {
  const raw = String(value || "").trim();
  if (!raw) return {};

  if (raw.startsWith("{") || raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return { rules: parsed.map((item) => String(item).trim()).filter(Boolean) };
      }
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return { rules: raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean) };
    }
  }

  return {
    rules: raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean),
  };
}

export function normalizeIssueTypeRecord(record = {}) {
  return {
    id: record.id || `legacy-${Math.random().toString(36).slice(2, 8)}`,
    persistedId: record.id || null,
    isNew: false,
    isDirty: false,
    name: record.name || "",
    description: record.description || "",
    aiInstructions: record.ai_instructions || "",
    escalationRulesText: formatEscalationRulesForEditor(record.escalation_rules),
    legacy: {
      reference: record.reference ?? null,
      sop: record.sop ?? null,
      attributes: record.attributes ?? null,
      fixed_parameters: record.fixed_parameters ?? null,
      confidence_threshold: record.confidence_threshold ?? null,
      status: record.status ?? "active",
      custom_columns: record.custom_columns ?? {},
    },
  };
}

export function buildIssueTypePayload(row, clientId) {
  return {
    client_id: clientId,
    name: String(row.name || "").trim(),
    description: String(row.description || "").trim() || null,
    ai_instructions: String(row.aiInstructions || "").trim() || null,
    escalation_rules: parseEscalationRulesInput(row.escalationRulesText),
    status: row.legacy?.status || "active",
    reference: row.legacy?.reference ?? null,
    sop: row.legacy?.sop ?? null,
    attributes: row.legacy?.attributes ?? {},
    fixed_parameters: row.legacy?.fixed_parameters ?? {},
    confidence_threshold: row.legacy?.confidence_threshold ?? null,
    custom_columns: row.legacy?.custom_columns ?? {},
  };
}

export function validateIssueType(row) {
  const errors = {};
  if (!String(row.name || "").trim()) {
    errors.name = "Name is required.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function updateIssueTypeField(rows, rowId, field, value) {
  return rows.map((row) => row.id === rowId ? { ...row, [field]: value, isDirty: true } : row);
}

export function removeIssueTypeRow(rows, rowId) {
  return rows.filter((row) => row.id !== rowId);
}

export function mergeSavedIssueType(rows, savedRecord) {
  const normalized = normalizeIssueTypeRecord(savedRecord);
  const targetId = savedRecord.id;

  if (!targetId) return rows;

  let matched = false;
  const nextRows = rows.map((row) => {
    if (row.persistedId === targetId || row.id === targetId) {
      matched = true;
      return normalized;
    }
    return row;
  });

  return matched ? nextRows : [normalized, ...nextRows];
}

export function buildIssueTypeAiConfig(record) {
  const normalized = normalizeIssueTypeRecord(record);
  return {
    name: normalized.name,
    description: normalized.description,
    aiInstructions: normalized.aiInstructions,
    escalationRules: parseEscalationRulesInput(normalized.escalationRulesText),
  };
}
