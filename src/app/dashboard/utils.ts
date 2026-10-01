import { roleText } from "./audits/utils";
import type { Role } from "./types";

export function isToday(value: string) {
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

export function money(value: number, decimals = 0) {
  return `฿${value.toLocaleString("th-TH", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

export function formatLogin(value?: string | null) {
  if (!value) return "ยังไม่เคยเข้าสู่ระบบ";
  return new Date(value).toLocaleString("th-TH-u-ca-buddhist", { day: "numeric", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

export function primaryRole(roles: Role[]) {
  return roles[0] ? roleText[roles[0]] || roles[0] : "พนักงาน";
}
