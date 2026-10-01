export type ReportOrder = {
  id: number;
  orderNumber: string;
  table: string;
  type: string;
  status: string;
  subtotal: number;
  discount: number;
  total: number;
  note?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  method: string;
  paidAt: string;
  receivedAmount?: number | null;
  changeAmount?: number | null;
  items: Array<{ id: number; name: string; qty: number; price: number; saleUnit: string; note?: string | null; status: string; modifiers?: Array<{ id: number; name: string; price: number }> }>;
};

export type Report = {
  summary: { sales: number; discounts: number; orders: number; average: number };
  meta: { oldestPaidAt?: string | null; latestPaidAt?: string | null };
  topItems: Array<{ name: string; qty: number; sales: number }>;
  payments: Array<{ method: string; amount: number }>;
  daily: Array<{ date: string; amount: number; orders?: number; average?: number }>;
  chart?: Array<{ key?: string; label: string; amount: number; orders: number; average: number }>;
  chartMode?: "hour" | "day" | "month" | "year";
  recent: ReportOrder[];
};

export type RangeMode = "ALL" | "TODAY" | "7D" | "MONTH" | "YEAR" | "CUSTOM";

export const emptyReport: Report = { summary: { sales: 0, discounts: 0, orders: 0, average: 0 }, meta: {}, topItems: [], payments: [], daily: [], chart: [], recent: [] };
