import type { RangeMode } from "./types";
import { daysAgoText, monthStartText, todayText, yearStartText } from "./utils";

type SearchValue = string | string[] | undefined;
type SearchRecord = Record<string, SearchValue>;

export type ReportFilterState = {
  rangeMode: RangeMode;
  from: string;
  to: string;
  query: string;
  page: number;
};

const rangeModes: RangeMode[] = ["ALL", "TODAY", "7D", "MONTH", "YEAR", "CUSTOM"];

function first(value: SearchValue) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? value : "";
}

function defaultDates(mode: RangeMode) {
  const today = todayText();
  if (mode === "ALL") return { from: "", to: "" };
  if (mode === "7D") return { from: daysAgoText(6), to: today };
  if (mode === "MONTH") return { from: monthStartText(), to: today };
  if (mode === "YEAR") return { from: yearStartText(), to: today };
  return { from: today, to: today };
}

export function reportFilterState(search: SearchRecord): ReportFilterState {
  const modeValue = first(search.mode);
  const rangeMode = rangeModes.includes(modeValue as RangeMode) ? modeValue as RangeMode : "TODAY";
  const defaults = defaultDates(rangeMode);
  let from = validDate(first(search.from));
  let to = validDate(first(search.to));
  if (rangeMode === "ALL") {
    from = "";
    to = "";
  } else if (!from || !to || from > to) {
    from = defaults.from;
    to = defaults.to;
  }
  const pageValue = Number(first(search.page) || 1);
  return {
    rangeMode,
    from,
    to,
    query: first(search.q).trim().slice(0, 100),
    page: Number.isSafeInteger(pageValue) && pageValue > 0 ? pageValue : 1,
  };
}

export function reportFilterParams(filters: ReportFilterState) {
  const params = new URLSearchParams();
  params.set("mode", filters.rangeMode);
  if (filters.rangeMode !== "ALL") {
    params.set("from", filters.from);
    params.set("to", filters.to);
  }
  if (filters.query.trim()) params.set("q", filters.query.trim());
  if (filters.page > 1) params.set("page", String(filters.page));
  return params;
}
