import type { CartLine } from "./types";

export const guestItemStatusText: Record<string, string> = {
  NEW: "ส่งเข้าครัวแล้ว",
  PREPARING: "กำลังทำ",
  READY: "พร้อมเสิร์ฟ",
  SERVED: "เสิร์ฟแล้ว",
};

export function guestMoney(value: number) {
  return `฿${value.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Works over LAN HTTP as well as HTTPS; crypto.randomUUID needs a secure context.
export function createGuestId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(20)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export function cartLinePrice(line: CartLine) {
  const modifierPrice = line.menu.modifierGroups
    .flatMap((group) => group.options)
    .filter((option) => line.modifierIds.includes(option.id))
    .reduce((sum, option) => sum + option.price, 0);
  return line.menu.price + modifierPrice;
}
