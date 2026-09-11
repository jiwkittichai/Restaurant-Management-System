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

export function auditActorName(audit: Audit): string {
  const recordedName = audit.details?.actorName;
  if (typeof recordedName === "string" && recordedName.trim()) return recordedName;
  return audit.employee?.displayName || "ไม่ระบุผู้ทำรายการ";
}

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
  REGISTER_RESTAURANT: "สมัครร้านใหม่",
  CREATE_EMPLOYEE: "สร้างบัญชีพนักงาน",
  UPDATE_EMPLOYEE: "แก้ไขบัญชีพนักงาน",
  CREATE_ORDER: "สร้างออเดอร์",
  ADD_ORDER_ITEMS: "เพิ่มรายการในบิล",
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
  QR_TABLE_ROTATE: "สร้าง QR โต๊ะใหม่",
  CREATE_MENU: "เพิ่มเมนู",
  UPDATE_MENU: "แก้ไขเมนู",
  TOGGLE_MENU: "เปลี่ยนสถานะเมนู",
  DELETE_MENU: "ลบเมนู",
  UPDATE_RESTAURANT_PROFILE: "แก้ไขข้อมูลร้าน",
  CONNECT_STRIPE_ACCOUNT: "เชื่อมต่อบัญชี Stripe",
  UPDATE_PAYMENT_SETTINGS: "แก้ไขการตั้งค่าชำระเงิน",
};

export const auditActionGroups = [
  { label: "ออเดอร์", options: [
    { value: "CREATE_ORDER", label: "สร้างออเดอร์" },
    { value: "ADD_ORDER_ITEMS", label: "เพิ่มรายการในบิล" },
    { value: "PICKUP_ORDER", label: "ส่งมอบออเดอร์" },
    { value: "CANCEL_ORDER", label: "ยกเลิกออเดอร์" },
  ] },
  { label: "การชำระเงิน", options: [
    { value: "PAY_ORDER,PAY_ORDER_STRIPE", label: "รับชำระเงิน" },
    { value: "UPDATE_PAYMENT_SETTINGS", label: "แก้ไขการตั้งค่าชำระเงิน" },
    { value: "CONNECT_STRIPE_ACCOUNT", label: "เชื่อมต่อบัญชี Stripe" },
  ] },
  { label: "โต๊ะ", options: [
    { value: "CREATE_TABLE", label: "เพิ่มโต๊ะ" },
    { value: "UPDATE_TABLE_STATUS", label: "เปลี่ยนสถานะโต๊ะ" },
    { value: "QR_TABLE_ROTATE", label: "สร้าง QR โต๊ะใหม่" },
  ] },
  { label: "หมวดหมู่และเมนู", options: [
    { value: "CREATE_CATEGORY", label: "เพิ่มหมวดหมู่" },
    { value: "UPDATE_CATEGORY", label: "แก้ไขหมวดหมู่" },
    { value: "DELETE_CATEGORY", label: "ลบหมวดหมู่" },
    { value: "CREATE_MENU", label: "เพิ่มเมนู" },
    { value: "UPDATE_MENU", label: "แก้ไขเมนู" },
    { value: "TOGGLE_MENU", label: "เปลี่ยนสถานะเมนู" },
    { value: "DELETE_MENU", label: "ลบเมนู" },
  ] },
  { label: "วัตถุดิบและสต็อก", options: [
    { value: "CREATE_INGREDIENT", label: "เพิ่มวัตถุดิบ" },
    { value: "UPDATE_INGREDIENT", label: "แก้ไขวัตถุดิบ" },
    { value: "DELETE_INGREDIENT", label: "ลบวัตถุดิบ" },
    { value: "STOCK_IN", label: "รับวัตถุดิบเข้า" },
    { value: "ADJUST_STOCK", label: "ปรับยอดสต็อก" },
    { value: "UPDATE_RECIPE", label: "แก้ไขสูตรอาหาร" },
  ] },
  { label: "ร้านและพนักงาน", options: [
    { value: "REGISTER_RESTAURANT", label: "สมัครร้านใหม่" },
    { value: "UPDATE_RESTAURANT_PROFILE", label: "แก้ไขข้อมูลร้าน" },
    { value: "CREATE_EMPLOYEE", label: "สร้างบัญชีพนักงาน" },
    { value: "UPDATE_EMPLOYEE", label: "แก้ไขบัญชีพนักงาน" },
  ] },
  { label: "ความปลอดภัย", options: [
    { value: "LOGIN", label: "เข้าสู่ระบบ" },
    { value: "LOGIN_FAILED", label: "เข้าสู่ระบบไม่สำเร็จ" },
    { value: "LOGIN_INACTIVE", label: "พยายามเข้าสู่ระบบด้วยบัญชีที่ปิดใช้งาน" },
  ] },
] as const;

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

export function money(value: unknown): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "";
  return `${amount.toLocaleString("th-TH", { minimumFractionDigits: amount % 1 ? 2 : 0, maximumFractionDigits: 2 })} บาท`;
}

function detailValue(details: AuditDetails | null | undefined, key: string): unknown {
  return details && Object.prototype.hasOwnProperty.call(details, key) ? details[key] : undefined;
}

function asNumber(value: unknown, fallback = 0): number {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : fallback;
}

export type AuditBillItem = {
  key: string;
  name: string;
  qty: number;
  unitPrice: number;
  note: string;
  modifiers: Array<{ name: string; price: number }>;
  lineTotal: number;
};

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
  if (audit.action === "PICKUP_ORDER") return `ส่งมอบออเดอร์ ${orderNumber || `#${audit.entityId || "-"}`}${money(detailValue(details, "total")) ? ` ยอด ${money(detailValue(details, "total"))}` : ""}`;
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
      ["displayName", "ชื่อพนักงาน"],
      ["active", "สถานะบัญชี"],
      ["roles", "บทบาท"],
      ["name", "ชื่อรายการ"],
      ["description", "รายละเอียด"],
      ["price", "ราคา"],
      ["saleUnit", "หน่วยขาย"],
      ["categoryId", "หมวดหมู่"],
      ["unit", "หน่วย"],
      ["status", "สถานะ"],
      ["available", "สถานะการขาย"],
      ["stock", "ยอดคงเหลือ"],
      ["minStock", "สต็อกขั้นต่ำ"],
      ["address", "ที่อยู่ร้าน"],
      ["phone", "เบอร์โทรร้าน"],
      ["welcomeMessage", "ข้อความต้อนรับ"],
      ["receiptFooter", "ท้ายใบเสร็จ"],
      ["promptPayEnabled", "พร้อมเพย์"],
      ["promptPayMode", "รูปแบบพร้อมเพย์"],
      ["stripeEnabled", "Stripe"],
    ];
    for (const [key, label] of fields) {
      const beforeValue = before ? asText(before[key]) : "";
      const afterValue = after ? asText(after[key]) : "";
      if (beforeValue !== afterValue) rows.push({ label, before: beforeValue, after: afterValue });
    }
  }

  if (details.passwordReset) rows.push({ label: "รีเซ็ตรหัสผ่าน", after: "มีการตั้งรหัสผ่านใหม่" });
  if (details.imageChanged) rows.push({ label: "รูปเมนู", after: "มีการเปลี่ยนรูป" });
  if (details.logoChanged) rows.push({ label: "โลโก้ร้าน", after: "มีการเปลี่ยนโลโก้" });
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
    ["orderNumber", "เลขออเดอร์"],
    ["type", "ประเภทออเดอร์"],
    ["method", "วิธีชำระเงิน"],
    ["total", "ยอดเงิน"],
    ["subtotal", "ยอดก่อนส่วนลด"],
    ["discount", "ส่วนลด"],
    ["receivedAmount", "เงินรับ"],
    ["changeAmount", "เงินทอน"],
    ["paymentId", "รหัสการชำระเงิน"],
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
