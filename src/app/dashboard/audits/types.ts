import type { Audit } from "./utils";

export type AuditMeta = { totalCount: number; oldestAt?: string | null; latestAt?: string | null; limit: number; nextCursor: string | null };
export type RangeMode = "ALL" | "TODAY" | "7D" | "MONTH" | "CUSTOM";
export type AuditsClientProps = { initialAudits: Audit[]; initialMeta: AuditMeta; employeeId?: number; title?: string; description?: string; backHref?: string; backLabel?: string; employeeSummary?: Array<{ label: string; value: string; accent?: string }> };
