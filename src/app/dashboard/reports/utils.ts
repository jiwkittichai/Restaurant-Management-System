export const methodText: Record<string, string> = { CASH: "เงินสด", PROMPTPAY: "พร้อมเพย์", CARD: "บัตร" };

export function localDate(date: Date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export const todayText = () => localDate(new Date());
export const monthStartText = (date = new Date()) => localDate(new Date(date.getFullYear(), date.getMonth(), 1));
export const yearStartText = (date = new Date()) => localDate(new Date(date.getFullYear(), 0, 1));

export function daysAgoText(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return localDate(date);
}

export function money(value: number) {
  return `฿${value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function compactMoney(value: number) {
  if (value >= 1000000) return `฿${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `฿${(value / 1000).toFixed(1)}k`;
  return `฿${value.toLocaleString("th-TH")}`;
}
