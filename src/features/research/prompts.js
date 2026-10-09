import { resolveFeature } from "@/shared/llm/features";

/** @deprecated Prefer feature: "research" on /api/chat — kept for any local demo imports. */
export const RESEARCH_SYSTEM = resolveFeature("research").system;
export const SAMPLE_Q = "Can an FIR be quashed by the High Court under Section 482 CrPC?";
