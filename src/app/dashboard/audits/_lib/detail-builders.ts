import { actionText } from "./labels";
import { asNumber, asText, auditActorName, detailValue, money } from "./formatters";
import type { Audit, AuditBillItem, AuditDetails } from "../types";

export function auditBillItems(audit: Audit): AuditBillItem[] {
  const details = audit.details || {};
  const items = detailValue(details, "items");
  const flatModifiers = detailValue(details, "modifiers");
  if (!Array.isArray(items)) return [];
  return items
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const data = item as AuditDetails;
      const name = asText(data.name);
      const qty = Math.max(1, asNumber(data.qty, 1));
      const unitPrice = asNumber(data.price);
      const nestedModifiers = Array.isArray(data.modifiers)
        ? data.modifiers
        : Array.isArray(flatModifiers)
          ? flatModifiers.filter((modifier) => modifier && typeof modifier === "object" && asText((modifier as AuditDetails).itemName) === name)
          : [];
      const modifiers = nestedModifiers
        .map((modifier) => {
          if (!modifier || typeof modifier !== "object") return null;
          const modifierData = modifier as AuditDetails;
          return { name: asText(modifierData.name), price: asNumber(modifierData.price) };
        })
        .filter((modifier): modifier is { name: string; price: number } => Boolean(modifier?.name));
      return {
        key: asText(data.id) || `${name}-${index}`,
        name,
        qty,
        unitPrice,
        note: asText(data.note),
        modifiers,
        lineTotal: unitPrice * qty,
      };
    })
    .filter((item): item is AuditBillItem => Boolean(item?.name));
}

export function auditSummary(audit: Audit) {
  const details = audit.details;
  const afterDetails = typeof details?.after === "object" && details.after ? details.after as AuditDetails : null;
  const orderNumber = asText(detailValue(details, "orderNumber"));
  const displayName = asText(detailValue(details, "displayName"));
  const username = asText(detailValue(details, "username"));
  const name = asText(detailValue(details, "name"));

  if (audit.action === "CREATE_EMPLOYEE") return `สร้างบัญชี ${displayName}${username ? ` (@${username})` : ""}`;
  if (audit.action === "REGISTER_RESTAURANT") return `สมัครร้านใหม่ ${asText(detailValue(details, "restaurantName"))}${username ? ` โดย @${username}` : ""}`;
  if (audit.action === "LOGIN_FAILED") return `พยายามเข้าสู่ระบบไม่สำเร็จ${username ? ` (@${username})` : ""}`;
  if (audit.action === "UPDATE_EMPLOYEE") {
    const target = asText(detailValue(details, "targetName")) || `พนักงาน #${audit.entityId || "-"}`;
    const changes = auditChangeRows(audit).map((row) => row.label).join(", ");
    return `แก้ไขบัญชี ${target}${changes ? `: ${changes}` : ""}`;
  }
  if (audit.action === "UPDATE_ACCOUNT") {
    if (detailValue(details, "passwordReset")) return "เปลี่ยนรหัสผ่านบัญชีผู้ใช้";
    const changes = auditChangeRows(audit).map((row) => row.label).join(", ");
    return `แก้ไขบัญชีผู้ใช้${changes ? `: ${changes}` : ""}`;
  }
  if (audit.action === "CREATE_ORDER") return `สร้างออเดอร์ ${orderNumber}${money(detailValue(details, "total")) ? ` ยอด ${money(detailValue(details, "total"))}` : ""}`;
  if (audit.action === "ADD_ORDER_ITEMS") return `เพิ่มรายการในบิล ${orderNumber}${money(detailValue(details, "total")) ? ` ยอดรวม ${money(detailValue(details, "total"))}` : ""}`;
  if (audit.action === "PAY_ORDER") return `รับชำระเงิน ${orderNumber || `ออเดอร์ #${audit.entityId || "-"}`} ${asText(detailValue(details, "method"))} ${money(detailValue(details, "total"))}`;
  if (audit.action === "PICKUP_ORDER") return `ส่งมอบออเดอร์ ${orderNumber || `#${audit.entityId || "-"}`}${money(detailValue(details, "total")) ? ` ยอด ${money(detailValue(details, "total"))}` : ""}`;
  if (audit.action === "CANCEL_ORDER") return `ยกเลิกออเดอร์ ${orderNumber || `#${audit.entityId || "-"}`}${money(detailValue(details, "total")) ? ` ยอด ${money(detailValue(details, "total"))}` : ""}`;
  if (audit.action === "UPDATE_KITCHEN_STATUS") return `อัปเดต ${asText(detailValue(details, "itemName")) || "รายการครัว"} เป็น ${asText(detailValue(details, "status")) || asText(afterDetails?.status)}`;
  if (audit.action === "CREATE_INGREDIENT") return `เพิ่มวัตถุดิบ ${name}${detailValue(details, "stock") !== undefined ? ` ตั้งต้น ${asText(detailValue(details, "stock"))}${detailValue(details, "unit") ? ` ${asText(detailValue(details, "unit"))}` : ""}` : ""}`;
  if (audit.action === "STOCK_IN") return `รับ${name || "วัตถุดิบ"}เข้าสต็อก ${asText(detailValue(details, "quantity"))}${detailValue(details, "unit") ? ` ${asText(detailValue(details, "unit"))}` : ""}`;
  if (audit.action === "ADJUST_STOCK") return `ปรับยอด${name || "วัตถุดิบ"}เป็น ${asText(detailValue(details, "stock"))}${detailValue(details, "unit") ? ` ${asText(detailValue(details, "unit"))}` : ""}`;
  if (audit.action === "UPDATE_RECIPE") return `แก้ไขสูตรอาหาร ${asText(detailValue(details, "ingredientCount"))} วัตถุดิบ`;
  if (audit.action === "CREATE_CATEGORY") return `เพิ่มหมวดหมู่ ${name}`;
  if (audit.action === "UPDATE_CATEGORY") return `แก้ไขหมวดหมู่ ${name}`;
  if (audit.action === "DELETE_CATEGORY") return `ลบหมวดหมู่ ${name || `#${audit.entityId || "-"}`}`;
  if (audit.action === "CREATE_TABLE") return `เพิ่มโต๊ะ ${name}${detailValue(details, "seats") ? ` ${asText(detailValue(details, "seats"))} ที่นั่ง` : ""}`;
  if (audit.action === "UPDATE_TABLE") return `แก้ไขโต๊ะ ${name || `#${audit.entityId || "-"}`}`;
  if (audit.action === "DELETE_TABLE") return `ลบโต๊ะ ${name || `#${audit.entityId || "-"}`}`;
  if (audit.action === "UPDATE_TABLE_STATUS") return `เปลี่ยนสถานะโต๊ะเป็น ${asText(detailValue(details, "status")) || asText(afterDetails?.status)}`;
  if (audit.action === "CREATE_MENU" || audit.action === "UPDATE_MENU") return `${actionText[audit.action]} ${name}`;
  if (audit.action === "TOGGLE_MENU") return `เปลี่ยนสถานะเมนูเป็น ${asText(detailValue(details, "available")) || asText(afterDetails?.available)}`;
  if (audit.action === "DELETE_MENU") return `ลบเมนู ${name || `#${audit.entityId || "-"}`}`;
  return actionText[audit.action] || audit.action;
}

export function auditChangeRows(audit: Audit) {
  const details = audit.details || {};
  const before = typeof details.before === "object" && details.before ? details.before as AuditDetails : null;
  const after = typeof details.after === "object" && details.after ? details.after as AuditDetails : null;
  const rows: Array<{ label: string; before?: string; after?: string }> = [];

  if (before || after) {
    const fields: Array<[string, string]> = [
      ["displayName", "ชื่อที่แสดง"], ["username", "ชื่อผู้ใช้เข้าสู่ระบบ"], ["active", "สถานะบัญชี"], ["roles", "บทบาท"],
      ["name", "ชื่อรายการ"], ["description", "รายละเอียด"], ["price", "ราคา"], ["saleUnit", "หน่วยขาย"], ["categoryId", "หมวดหมู่"],
      ["unit", "หน่วย"], ["seats", "จำนวนที่นั่ง"], ["status", "สถานะ"], ["available", "สถานะการขาย"], ["stock", "ยอดคงเหลือ"], ["minStock", "สต็อกขั้นต่ำ"],
      ["address", "ที่อยู่ร้าน"], ["phone", "เบอร์โทรร้าน"], ["welcomeMessage", "ข้อความต้อนรับ"], ["receiptFooter", "ท้ายใบเสร็จ"], ["promptPayEnabled", "พร้อมเพย์"],
    ];
    for (const [key, label] of fields) {
      const beforeValue = before ? asText(before[key]) : "";
      const afterValue = after ? asText(after[key]) : "";
      if (beforeValue !== afterValue) rows.push({ label, before: beforeValue, after: afterValue });
    }
  }

  if (details.passwordReset) rows.push({ label: "รีเซ็ตรหัสผ่าน", after: "มีการตั้งรหัสผ่านใหม่" });
  if (details.imageChanged) rows.push({ label: "รูปเมนู", after: "มีการเปลี่ยนรูป" });
  if (details.logoChanged) rows.push({ label: "โลโก้ร้าน", after: "มีการเปลี่ยนแปลง" });
  if (details.qrChanged) rows.push({ label: "QR พร้อมเพย์", after: "มีการเปลี่ยน QR" });
  if (details.modifierGroupsChanged) rows.push({ label: "ตัวเลือกเมนู", after: "มีการแก้ไขตัวเลือก" });
  if (!rows.length && details.roles) rows.push({ label: "บทบาท", after: asText(details.roles) });
  if (!rows.length && details.active !== undefined) rows.push({ label: "สถานะบัญชี", after: asText(details.active) });
  return rows;
}

export function auditDetailRows(audit: Audit) {
  const details = audit.details || {};
  const rows: Array<{ label: string; value: string }> = [
    { label: "ผู้ทำรายการ", value: auditActorName(audit) },
    { label: "เวลา", value: new Date(audit.createdAt).toLocaleString("th-TH") },
    { label: "ประเภท", value: actionText[audit.action] || audit.action },
  ];

  for (const [key, label] of [
    ["orderNumber", "เลขออเดอร์"], ["type", "ประเภทออเดอร์"], ["method", "วิธีชำระเงิน"], ["total", "ยอดเงิน"],
    ["subtotal", "ยอดก่อนส่วนลด"], ["discount", "ส่วนลด"], ["receivedAmount", "เงินรับ"], ["changeAmount", "เงินทอน"],
    ["paymentId", "รหัสการชำระเงิน"], ["quantity", "จำนวน"], ["stock", "ยอดคงเหลือ"], ["status", "สถานะ"],
    ["itemName", "รายการอาหาร"], ["itemCount", "จำนวนรายการ"], ["tableName", "โต๊ะ"], ["queueNumber", "คิว"],
    ["name", "ชื่อรายการ"], ["unit", "หน่วย"], ["note", "หมายเหตุ"], ["displayName", "ชื่อพนักงาน"],
    ["username", "ชื่อผู้ใช้"], ["seats", "จำนวนที่นั่ง"], ["ingredientCount", "จำนวนวัตถุดิบในสูตร"],
  ] as const) {
    const value = detailValue(details, key);
    if (value !== undefined) rows.push({ label, value: key === "total" ? money(value) : asText(value) });
  }

  return rows.filter((row) => row.value);
}
