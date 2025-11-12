import type { PR } from "@/types";

export function normalizePullRequests(input: unknown): PR[] {
  if (Array.isArray(input)) {
    return input.filter(isValidPR);
  }

  if (input && typeof input === "object") {
    const values = Object.values(input as Record<string, unknown>);
    return values.filter(isValidPR);
  }

  return [];
}

export function isValidPR(pr: unknown): pr is PR {
  if (!pr || typeof pr !== "object") {
    return false;
  }

  const candidate = pr as Record<string, unknown>;

  return (
    typeof candidate.number === "number" &&
    typeof candidate.title === "string" &&
    typeof candidate.repo === "string"
  );
}
