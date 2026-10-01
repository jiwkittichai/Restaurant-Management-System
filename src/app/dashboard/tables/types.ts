import type { BillOrder } from "../_components/BillModal";

export type ActiveOrder = BillOrder & { status: string; paymentStatus: string; createdAt?: string };
export type RestaurantTable = { id: number; name: string; seats: number; status: string; orders: ActiveOrder[]; sessions: Array<{ id: number; paused: boolean; billRequestedAt: string | null }> };
export type TableTab = "ALL" | "AVAILABLE" | "ACTIVE" | "READY";
