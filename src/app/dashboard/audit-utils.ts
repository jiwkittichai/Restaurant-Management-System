export type AuditDetails = Record<string, unknown>;

export type Audit = {
  id: number;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: AuditDetails | null;
  createdAt: string;
  employee?: { displayName: string } | null;
};

export const roleText: Record<string, string> = {
  OWNER: "เจ้าของร้าน/ผู้จัดการ",
  CASHIER: "แคชเชียร์",
  KITCHEN: "พนักงานครัว",
  STOCK: "พนักงานสต็อก",
};

export const actionText: Record<string, string> = {
  LOGIN: "เข้าสู่ระบบ",
  LOGIN_FAILED: "เข้าสู่ระบบไม่สำเร็จ",
  LOGIN_INACTIVE: "พยายามเข้าสู่ระบบด้วยบัญชีที่ปิดใช้งาน",
  LOGOUT: "ออกจากระบบ",
  REGISTER_RESTAURANT: "สมัครร้านใหม่",
  CREATE_EMPLOYEE: "สร้างบัญชีพนักงาน",
  UPDATE_EMPLOYEE: "แก้ไขบัญชีพนักงาน",
  CREATE_ORDER: "สร้างออเดอร์",
  ADD_ORDER_ITEMS: "เพิ่มรายการในบิล",
  UPDATE_KITCHEN_STATUS: "อัปเดตสถานะครัว",
  PAY_ORDER: "รับชำระเงิน",
  PAY_ORDER_STRIPE: "รับชำระเงิน",
  PICKUP_ORDER: "ส่งมอบออเดอร์",
  CANCEL_ORDER: "ยกเลิกออเดอร์",
  CREATE_INGREDIENT: "เพิ่มวัตถุดิบ",
  STOCK_IN: "รับวัตถุดิบเข้า",
  ADJUST_STOCK: "ปรับยอดสต็อก",
  UPDATE_INGREDIENT: "แก้ไขวัตถุดิบ",
  DELETE_INGREDIENT: "ลบวัตถุดิบ",
  UPDATE_RECIPE: "แก้ไขสูตรอาหาร",
  CREATE_CATEGORY: "เพิ่มหมวดหมู่",
  UPDATE_CATEGORY: "แก้ไขหมวดหมู่",
  DELETE_CATEGORY: "ลบหมวดหมู่",
  CREATE_TABLE: "เพิ่มโต๊ะ",
  UPDATE_TABLE_STATUS: "เปลี่ยนสถานะโต๊ะ",
  CREATE_MENU: "เพิ่มเมนู",
  UPDATE_MENU: "แก้ไขเมนู",
  TOGGLE_MENU: "เปลี่ยนสถานะเมนู",
  DELETE_MENU: "ลบเมนู",
  UPLOAD_MENU_IMAGE: "อัปโหลดรูปเมนู",
  UPLOAD_PROMPTPAY_QR: "อัปโหลด QR พร้อมเพย์",
  UPDATE_PAYMENT_SETTINGS: "แก้ไขการตั้งค่าชำระเงิน",
};

const statusText: Record<string, string> = {
  SENT: "ส่งเข้าครัว",
  PREPARING: "กำลังทำ",
  READY: "พร้อมเสิร์ฟ",
  SERVED: "เสิร์ฟแล้ว",
  PAID: "ชำระเงินแล้ว",
  CANCELLED: "ยกเลิก",
  DINE_IN: "ทานที่ร้าน",
  TAKEAWAY: "ซื้อกลับบ้าน",
  CASH: "เงินสด",
  PROMPTPAY: "พร้อมเพย์",
  CARD: "บัตร",
};

function asText(value: unknown): string {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value === "boolean") return value ? "ใช้งาน" : "ปิดใช้งาน";
  if (typeof value === "number") return value.toLocaleString("th-TH");
  if (typeof value === "string") return statusText[value] || roleText[value] || value;
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join(", ");
  return JSON.stringify(value);
}

function money(value: unknown): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "";
  return `${amount.toLocaleString("th-TH", { minimumFractionDigits: amount % 1 ? 2 : 0, maximumFractionDigits: 2 })} บาท`;
}

function detailValue(details: AuditDetails | null | undefined, key: string): unknown {
  return details && Object.prototype.hasOwnProperty.call(details, key) ? details[key] : undefined;
}

function formatItems(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      const data = item as AuditDetails;
      const name = asText(data.name);
      const qty = asText(data.qty);
      const price = money(data.price);
      return [name, qty ? `x${qty}` : "", price].filter(Boolean).join(" ");
    })
    .filter(Boolean)
    .join(", ");
}

export function formatDate(value?: string) {
  if (!value) return "ยังไม่เคยเข้าสู่ระบบ";
  const date = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return `วันนี้ ${date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}`;
  if (diffDays === 1) return `เมื่อวาน ${date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}`;
  if (diffDays < 30) return `${diffDays} วันที่แล้ว`;
  return date.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
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
  if (audit.action === "CREATE_ORDER") return `สร้างออเดอร์ ${orderNumber}${money(detailValue(details, "total")) ? ` ยอด ${money(detailValue(details, "total"))}` : ""}`;
  if (audit.action === "ADD_ORDER_ITEMS") return `เพิ่มรายการในบิล ${orderNumber}${money(detailValue(details, "total")) ? ` ยอดรวม ${money(detailValue(details, "total"))}` : ""}`;
  if (audit.action === "PAY_ORDER" || audit.action === "PAY_ORDER_STRIPE") return `รับชำระเงิน ${orderNumber || `ออเดอร์ #${audit.entityId || "-"}`} ${asText(detailValue(details, "method"))} ${money(detailValue(details, "total"))}`;
  if (audit.action === "CANCEL_ORDER") return `ยกเลิกออเดอร์ ${orderNumber || `#${audit.entityId || "-"}`}`;
  if (audit.action === "UPDATE_KITCHEN_STATUS") return `อัปเดต ${asText(detailValue(details, "itemName")) || "รายการครัว"} เป็น ${asText(detailValue(details, "status")) || asText(afterDetails?.status)}`;
  if (audit.action === "CREATE_INGREDIENT") return `เพิ่มวัตถุดิบ ${name}${detailValue(details, "stock") !== undefined ? ` ตั้งต้น ${asText(detailValue(details, "stock"))}` : ""}`;
  if (audit.action === "STOCK_IN") return `รับวัตถุดิบเข้า ${asText(detailValue(details, "quantity"))}`;
  if (audit.action === "ADJUST_STOCK") return `ปรับยอดสต็อกเป็น ${asText(detailValue(details, "stock"))}`;
  if (audit.action === "UPDATE_RECIPE") return `แก้ไขสูตรอาหาร ${asText(detailValue(details, "ingredientCount"))} วัตถุดิบ`;
  if (audit.action === "CREATE_CATEGORY") return `เพิ่มหมวดหมู่ ${name}`;
  if (audit.action === "UPDATE_CATEGORY") return `แก้ไขหมวดหมู่ ${name}`;
  if (audit.action === "DELETE_CATEGORY") return `ลบหมวดหมู่ ${name || `#${audit.entityId || "-"}`}`;
  if (audit.action === "CREATE_TABLE") return `เพิ่มโต๊ะ ${name}${detailValue(details, "seats") ? ` ${asText(detailValue(details, "seats"))} ที่นั่ง` : ""}`;
  if (audit.action === "UPDATE_TABLE_STATUS") return `เปลี่ยนสถานะโต๊ะเป็น ${asText(detailValue(details, "status"))}`;
  if (audit.action === "CREATE_MENU" || audit.action === "UPDATE_MENU") return `${actionText[audit.action]} ${name}`;
  if (audit.action === "TOGGLE_MENU") return `เปลี่ยนสถานะเมนูเป็น ${asText(detailValue(details, "available"))}`;
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
      ["displayName", "ชื่อพนักงาน"],
      ["active", "สถานะบัญชี"],
      ["roles", "บทบาท"],
      ["name", "ชื่อรายการ"],
      ["unit", "หน่วย"],
      ["status", "สถานะ"],
      ["stock", "ยอดคงเหลือ"],
      ["minStock", "สต็อกขั้นต่ำ"],
    ];
    for (const [key, label] of fields) {
      const beforeValue = before ? asText(before[key]) : "";
      const afterValue = after ? asText(after[key]) : "";
      if (beforeValue !== afterValue) rows.push({ label, before: beforeValue, after: afterValue });
    }
  }

  if (details.passwordReset) rows.push({ label: "รีเซ็ตรหัสผ่าน", after: "มีการตั้งรหัสผ่านใหม่" });
  if (!rows.length && details.roles) rows.push({ label: "บทบาท", after: asText(details.roles) });
  if (!rows.length && details.active !== undefined) rows.push({ label: "สถานะบัญชี", after: asText(details.active) });
  return rows;
}

export function auditDetailRows(audit: Audit) {
  const details = audit.details || {};
  const rows: Array<{ label: string; value: string }> = [
    { label: "ผู้ทำรายการ", value: audit.employee?.displayName || "บัญชีที่ถูกลบ" },
    { label: "เวลา", value: new Date(audit.createdAt).toLocaleString("th-TH") },
    { label: "ประเภท", value: actionText[audit.action] || audit.action },
  ];

  if (detailValue(details, "items")) rows.push({ label: "รายการอาหาร", value: formatItems(detailValue(details, "items")) });
  for (const [key, label] of [
    ["orderNumber", "เลขออเดอร์"],
    ["type", "ประเภทออเดอร์"],
    ["method", "วิธีชำระเงิน"],
    ["total", "ยอดเงิน"],
    ["quantity", "จำนวน"],
    ["stock", "ยอดคงเหลือ"],
    ["status", "สถานะ"],
    ["itemName", "รายการอาหาร"],
    ["itemCount", "จำนวนรายการ"],
    ["tableName", "โต๊ะ"],
    ["queueNumber", "คิว"],
    ["name", "ชื่อรายการ"],
    ["unit", "หน่วย"],
    ["note", "หมายเหตุ"],
    ["displayName", "ชื่อพนักงาน"],
    ["username", "ชื่อผู้ใช้"],
    ["ingredientCount", "จำนวนวัตถุดิบในสูตร"],
  ] as const) {
    const value = detailValue(details, key);
    if (value !== undefined) rows.push({ label, value: key === "total" ? money(value) : asText(value) });
  }

  return rows.filter((row) => row.value);
}
