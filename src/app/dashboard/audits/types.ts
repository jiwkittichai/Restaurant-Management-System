/**
 * รวมรูปแบบข้อมูลที่ใช้ในประวัติกิจกรรม
 * ใช้กำหนดว่าข้อมูลจาก API สถานะของหน้าจอ และข้อมูลที่ส่งระหว่างส่วนประกอบต้องมีหน้าตาอย่างไร
 */

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

export type AuditBillItem = {
  key: string;
  name: string;
  qty: number;
  unitPrice: number;
  note: string;
  modifiers: Array<{ name: string; price: number }>;
  lineTotal: number;
};

export type AuditMeta = { totalCount: number; oldestAt?: string | null; latestAt?: string | null; limit: number; nextCursor: string | null };
export type RangeMode = "ALL" | "TODAY" | "7D" | "MONTH" | "YEAR" | "CUSTOM";
export type AuditFilterState = { query: string; action: string; rangeMode: RangeMode; from: string; to: string };
export type AuditListClientProps = { initialAudits: Audit[]; initialMeta: AuditMeta; initialFilters?: AuditFilterState; employeeId?: number; title?: string; description?: string; backHref?: string; backLabel?: string; employeeSummary?: Array<{ label: string; value: string; accent?: string }> };
