import type { BillOrder } from "../_components/BillModal";

export type TakeawayItem = { id: number; name: string; qty: number; price: number; note?: string | null; status?: string; modifiers?: Array<{ id: number; name: string; price: number }> };
export type TakeawayOrder = BillOrder & { queueNumber: string; customerName?: string; customerPhone?: string; status: string; paymentStatus: string; createdAt: string; items: TakeawayItem[] };
export type QueueTab = "ALL" | "UNPAID" | "READY" | "PAID";
