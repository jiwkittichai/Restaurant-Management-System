import { auditGroups } from "@/lib/audit-groups";
import { daysAgo, localDate, monthStart, yearStart } from "./date-utils";
import type { AuditFilterState, RangeMode } from "../types";

export const allActionsValue = "__ALL__";

type SearchValue = string | string[] | undefined;
type SearchRecord = Record<string, SearchValue>;

function first(value: SearchValue) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const date = new Date(`${value}T00:00:00.000+07:00`);
  return Number.isFinite(date.getTime()) && localDate(date) === value ? value : "";
}

function rangeMode(from: string, to: string): RangeMode {
  if (!from && !to) return "ALL";
  const today = localDate(new Date());
  if (from === today && to === today) return "TODAY";
  if (from === daysAgo(6) && to === today) return "7D";
  if (from === monthStart() && to === today) return "MONTH";
  if (from === yearStart() && to === today) return "YEAR";
  return "CUSTOM";
}

export function auditFilterState(search: SearchRecord): AuditFilterState {
  const query = first(search.q).trim().slice(0, 100);
  const group = first(search.group);
  const scope = first(search.scope);
  const action = scope === "all"
    ? allActionsValue
    : auditGroups.some((item) => item.id === group)
      ? group
      : "";
  let from = validDate(first(search.from));
  let to = validDate(first(search.to));
  if ((from && to && from > to) || Boolean(from) !== Boolean(to)) {
    from = "";
    to = "";
  }
  return { query, action, rangeMode: rangeMode(from, to), from, to };
}

export function auditFilterParams(filters: Pick<AuditFilterState, "query" | "action" | "from" | "to">) {
  const params = new URLSearchParams();
  if (filters.query.trim()) params.set("q", filters.query.trim());
  if (filters.action === allActionsValue) params.set("scope", "all");
  else if (filters.action) params.set("group", filters.action);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  return params;
}
