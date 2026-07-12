export const REPORT_LANGUAGES = [
  "bn",
  "en",
  "unknown",
] as const;

export const REPORT_STATUSES = [
  "pending",
  "in_review",
  "assigned",
  "resolved",
  "rejected",
] as const;

export const REPORT_CATEGORIES = [
  "medical",
  "fire",
  "accident",
  "crime",
  "flood",
  "utility",
  "public_service",
  "infrastructure",
  "other",
] as const;

export const REPORT_URGENCIES = [
  "low",
  "medium",
  "high",
  "critical",
] as const;