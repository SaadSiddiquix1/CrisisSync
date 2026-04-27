import { CrisisStatus } from "@/types/database";

const terminalStatuses = new Set<CrisisStatus | "closed">(["resolved", "dismissed", "closed"]);

export function normalizeStatusForDatabase(status?: string | null): CrisisStatus | undefined {
  if (!status) return undefined;

  if (status === "in_progress") return "responding";
  if (status === "closed") return "resolved";

  return status as CrisisStatus;
}

export function isTerminalStatus(status?: string | null) {
  return terminalStatuses.has((status ?? "") as CrisisStatus | "closed");
}

export function isActiveStatus(status?: string | null) {
  return !isTerminalStatus(status);
}
