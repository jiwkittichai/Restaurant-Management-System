export const logLabels: Record<string, string> = {
  RESTAURANT_APPROVED: "อนุมัติร้าน",
  RESTAURANT_REJECTED: "ปฏิเสธคำขอร้าน",
  PLATFORM_LOGIN: "แอดมินเข้าสู่ระบบ",
  PLATFORM_LOGIN_FAILED: "เข้าสู่ระบบแอดมินไม่สำเร็จ",
  RESTAURANT_SUSPENDED: "ระงับร้าน",
  RESTAURANT_RESUMED: "เปิดร้านอีกครั้ง",
  PLATFORM_SETTINGS_UPDATED: "แก้ไขการตั้งค่าส่วนกลาง",
  PLATFORM_LOGO_UPDATED: "เปลี่ยนโลโก้แพลตฟอร์ม",
  PLATFORM_LOGO_REMOVED: "นำโลโก้แพลตฟอร์มออก",
  PLATFORM_ADMIN_CREATED: "สร้างแอดมิน",
  PLATFORM_ADMIN_PASSWORD_RESET: "รีเซ็ตรหัสผ่านแอดมิน",
};

const detailLabels: Record<string, string> = {
  restaurantName: "ชื่อร้าน",
  reason: "เหตุผล",
  name: "ชื่อแพลตฟอร์ม",
  registrationOpen: "การรับสมัครร้านใหม่",
  username: "ชื่อผู้ใช้",
  displayName: "ชื่อที่แสดง",
};

const groupLabels: Record<string, string> = { before: "ข้อมูลเดิม", after: "ข้อมูลใหม่" };

export type LogDetailGroup = { label?: string; rows: { label: string; value: string }[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function formatValue(key: string, value: unknown) {
  if (value === null || value === undefined || value === "") return "ไม่ระบุ";
  if (key === "registrationOpen" && typeof value === "boolean") return value ? "เปิดรับสมัคร" : "ปิดรับสมัคร";
  if (typeof value === "boolean") return value ? "เปิดใช้งาน" : "ปิดใช้งาน";
  if (typeof value === "number") return value.toLocaleString("th-TH");
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.length ? `${value.length.toLocaleString("th-TH")} รายการ` : "ไม่มีรายการ";
  return "มีข้อมูลเพิ่มเติม";
}

export function logDetailGroups(details: unknown): LogDetailGroup[] {
  if (!isRecord(details)) return [];
  const groups: LogDetailGroup[] = [];
  const rows: LogDetailGroup["rows"] = [];
  for (const [key, value] of Object.entries(details)) {
    if (isRecord(value)) {
      groups.push({
        label: groupLabels[key] || key,
        rows: Object.entries(value).map(([nestedKey, nestedValue]) => ({
          label: detailLabels[nestedKey] || nestedKey,
          value: formatValue(nestedKey, nestedValue),
        })),
      });
    } else {
      rows.push({ label: detailLabels[key] || key, value: formatValue(key, value) });
    }
  }
  if (rows.length) groups.unshift({ rows });
  return groups;
}

export function logRestaurantName(details: unknown) {
  if (!isRecord(details)) return null;
  return typeof details.restaurantName === "string" && details.restaurantName.trim() ? details.restaurantName : null;
}

export function restaurantStatus(restaurant: { approvalStatus: string; active: boolean }) {
  if (restaurant.approvalStatus === "PENDING") return { text: "รออนุมัติ", className: "bg-amber-50 text-amber-700" };
  if (restaurant.approvalStatus === "REJECTED") return { text: "ไม่อนุมัติ", className: "bg-red-50 text-red-600" };
  if (!restaurant.active) return { text: "ระงับ", className: "bg-red-50 text-red-600" };
  return { text: "เปิดใช้งาน", className: "bg-emerald-50 text-emerald-600" };
}
