/**
 * รวมตัวช่วยและค่าที่ใช้ซ้ำในการรับออเดอร์
 * ใช้แปลงข้อมูล จัดรูปแบบข้อความ และเก็บกฎย่อยไม่ให้ปะปนกับโค้ดแสดงผล
 */

import type { CartItem, MenuItem } from "./types";

export function saleUnit(item: MenuItem) {
  return item.saleUnit || "จาน";
}

export function lineUnitPrice(item: CartItem) {
  return (
    item.price +
    item.modifiers
      .filter((modifier) => item.modifierIds.includes(modifier.id))
      .reduce((sum, modifier) => sum + modifier.price, 0)
  );
}
