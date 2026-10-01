export const statusText: Record<string, string> = { AVAILABLE: "ว่าง", OCCUPIED: "กำลังใช้งาน", RESERVED: "จอง", CLEANING: "รอทำความสะอาด" };
export const statusClass: Record<string, string> = { AVAILABLE: "bg-emerald-100 text-emerald-700", OCCUPIED: "bg-red-100 text-red-700", RESERVED: "bg-amber-100 text-amber-700", CLEANING: "bg-gray-100 text-gray-600" };
export const orderStatusText: Record<string, string> = { SENT: "ส่งครัวแล้ว", PREPARING: "กำลังทำ", READY: "พร้อมเสิร์ฟ", SERVED: "เสิร์ฟแล้ว" };
export const orderStatusClass: Record<string, string> = { SENT: "bg-blue-50 text-blue-600", PREPARING: "bg-amber-50 text-amber-700", READY: "bg-emerald-50 text-emerald-700", SERVED: "bg-indigo-50 text-indigo-700" };
export const itemStatusText: Record<string, string> = { NEW: "รอครัวรับ", PREPARING: "กำลังทำ", READY: "พร้อมแล้ว", SERVED: "เสิร์ฟแล้ว" };
export const money = (value: number) => `฿${value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const timeText = (value?: string) => value ? new Date(value).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) : "-";
