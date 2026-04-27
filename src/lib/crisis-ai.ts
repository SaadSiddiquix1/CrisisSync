import { AiTriageResult, ChecklistItem, Crisis } from "@/types/database";

function checklistToProtocol(items?: ChecklistItem[]) {
  return (items ?? [])
    .map((item) => item.task ?? item.item_text ?? "")
    .filter(Boolean);
}

function protocolToChecklist(items?: string[]) {
  return (items ?? []).map((item) => ({
    task: item,
    priority: "standard" as const,
    completed: false,
  }));
}

export function getConfidenceValue(result?: AiTriageResult | null) {
  return result?.confidence ?? result?.confidence_score ?? 0;
}

export function getReasoningText(reasoning?: AiTriageResult["reasoning"]) {
  if (Array.isArray(reasoning)) {
    return reasoning.join(" ");
  }

  return reasoning ?? "";
}

export function normalizeAiTriageResult(result?: AiTriageResult | null): AiTriageResult | null {
  if (!result) return null;

  const confidence = getConfidenceValue(result);
  const staffChecklist =
    result.staff_checklist && result.staff_checklist.length > 0
      ? result.staff_checklist
      : protocolToChecklist(result.staff_protocol);
  const guestInstructions = result.guest_instructions ?? [];
  const visualRiskFactors = result.visual_risk_factors ?? [];
  const reasoning = Array.isArray(result.reasoning)
    ? result.reasoning
    : result.reasoning
      ? [result.reasoning]
      : [];

  return {
    ...result,
    confidence,
    confidence_score: confidence,
    reasoning: reasoning.length <= 1 ? (reasoning[0] ?? "") : reasoning,
    guest_instructions: guestInstructions,
    staff_checklist: staffChecklist,
    staff_protocol:
      result.staff_protocol && result.staff_protocol.length > 0
        ? result.staff_protocol
        : checklistToProtocol(staffChecklist),
    visual_risk_factors: visualRiskFactors,
  };
}

export function getCrisisAiTriage(crisis?: Partial<Crisis> | null): AiTriageResult | null {
  if (!crisis) return null;

  if (crisis.ai_triage_result) {
    return normalizeAiTriageResult(crisis.ai_triage_result);
  }

  const fallback: AiTriageResult = {
    severity: crisis.ai_severity ?? crisis.severity_assessment ?? crisis.severity,
    confidence: crisis.ai_confidence,
    confidence_score: crisis.ai_confidence,
    reasoning: crisis.ai_reasoning ?? "",
    guest_instructions: crisis.ai_guest_instructions ?? [],
    staff_checklist: crisis.ai_staff_checklist ?? [],
    responder_focus: crisis.ai_responder_focus,
    prevention_insights: crisis.ai_prevention_insights,
    summary:
      typeof crisis.ai_reasoning === "string" && crisis.ai_reasoning
        ? crisis.ai_reasoning
        : undefined,
    model_used: crisis.ai_model_used,
  };

  const hasTriageData =
    Boolean(fallback.severity) ||
    Boolean(getReasoningText(fallback.reasoning)) ||
    (fallback.guest_instructions?.length ?? 0) > 0 ||
    (fallback.staff_checklist?.length ?? 0) > 0 ||
    Boolean(fallback.responder_focus);

  return hasTriageData ? normalizeAiTriageResult(fallback) : null;
}
