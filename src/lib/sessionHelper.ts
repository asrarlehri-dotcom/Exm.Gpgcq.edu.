/**
 * Session Validation and Utilities
 * 
 * Rules:
 * - Single years (e.g. "2025", "2024") are strictly DISALLOWED.
 * - Only span formats "YYYY-YYYY" are allowed:
 *   - 4-Year span: e.g. "2024-2028", "2025-2029" (Regular BS programs)
 *   - 2-Year span: e.g. "2024-2026", "2025-2027" (Bridging / 5th Sem BS & Intermediate programs)
 */

export const DEFAULT_4YEAR_SESSIONS = [
  "2024-2028",
  "2025-2029",
  "2026-2030",
  "2023-2027",
  "2022-2026",
];

export const DEFAULT_2YEAR_SESSIONS = [
  "2024-2026",
  "2025-2027",
  "2026-2028",
  "2023-2025",
  "2022-2024",
];

export const DEFAULT_ALL_SESSIONS = [
  "2024-2028",
  "2025-2029",
  "2026-2030",
  "2023-2027",
  "2022-2026",
  "2024-2026",
  "2025-2027",
  "2026-2028",
  "2023-2025",
  "2022-2024",
];

/**
 * Validates whether a session string is a valid 4-year or 2-year span.
 * Returns true only if format is "YYYY-YYYY" with a 4 or 2 year difference.
 */
export function isValidSession(session: string | null | undefined): boolean {
  if (!session || typeof session !== "string") return false;
  const trimmed = session.trim();
  
  // Strictly reject single year (e.g. "2025")
  if (/^\d{4}$/.test(trimmed)) return false;

  // Match YYYY-YYYY format
  const match = trimmed.match(/^(\d{4})-(\d{4})$/);
  if (!match) return false;

  const start = parseInt(match[1], 10);
  const end = parseInt(match[2], 10);
  const diff = end - start;

  // Must be either 4 years (BS 4-Year) or 2 years (Bridging / Inter)
  return diff === 4 || diff === 2;
}

/**
 * Filters any list of sessions to only include valid 4-year or 2-year spans.
 * Single year entries (like "2022", "2025") are automatically removed.
 * If empty after filtering, returns DEFAULT_ALL_SESSIONS.
 */
export function filterValidSessions(rawList?: string[] | string | null): string[] {
  let list: string[] = [];
  if (Array.isArray(rawList)) {
    list = rawList;
  } else if (typeof rawList === "string") {
    list = rawList.split(",").map((s) => s.trim());
  }

  const valid = list.filter(isValidSession);
  if (valid.length === 0) {
    return DEFAULT_ALL_SESSIONS;
  }
  return Array.from(new Set(valid));
}

/**
 * Generates span session for an entry year based on program type / education level
 */
export function calculateSessionFromYear(
  entryYear: number | string,
  type: "REGULAR" | "BRIDGING_5TH" | "INTERMEDIATE" | "MIGRATION" = "REGULAR",
  migrationSemester: number = 1
): string {
  const startYear = parseInt(String(entryYear), 10) || new Date().getFullYear();

  if (type === "INTERMEDIATE" || type === "BRIDGING_5TH") {
    return `${startYear}-${startYear + 2}`;
  }

  if (type === "MIGRATION") {
    const sem = migrationSemester || 1;
    const offset = Math.floor((sem - 1) / 2);
    const batchStart = startYear - offset;
    return `${batchStart}-${batchStart + 4}`;
  }

  // Default BS 4-Year Regular
  return `${startYear}-${startYear + 4}`;
}
