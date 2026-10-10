import { roleText, statusText } from "./labels";
import type { Audit, AuditDetails } from "./types";

export function auditActorName(audit: Audit): string {
  const recordedName = audit.details?.actorName;
  if (typeof recordedName === "string" && recordedName.trim()) return recordedName;
  return audit.employee?.displayName || "ไม่ระบุผู้ทำรายการ";
}

export function asText(value: unknown): string {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value === "boolean") return value ? "ใช้งาน" : "ปิดใช้งาน";
  if (typeof value === "number") return value.toLocaleString("th-TH");
  if (typeof value === "string") return statusText[value] || roleText[value as keyof typeof roleText] || value;
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join(", ");
  return JSON.stringify(value);
}

export function money(value: unknown): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "";
  return `${amount.toLocaleString("th-TH", { minimumFractionDigits: amount % 1 ? 2 : 0, maximumFractionDigits: 2 })} บาท`;
}

export function detailValue(details: AuditDetails | null | undefined, key: string): unknown {
  return details && Object.prototype.hasOwnProperty.call(details, key) ? details[key] : undefined;
}

export function asNumber(value: unknown, fallback = 0): number {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : fallback;
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function formatDate(value?: string) {
  if (!value) return "ยังไม่เคยเข้าสู่ระบบ";
  const date = new Date(value);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (dateKey(date) === dateKey(now)) return `วันนี้ ${date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}`;
  if (dateKey(date) === dateKey(yesterday)) return `เมื่อวาน ${date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}`;
  const diffMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays < 30) return `${diffDays} วันที่แล้ว`;
  return date.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
}
