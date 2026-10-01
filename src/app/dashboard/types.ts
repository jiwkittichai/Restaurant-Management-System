export type MenuItem = { id: number; name: string; price: number };
export type TableItem = { status: string };
export type OrderItem = { name: string; price: number; qty: number };
export type Order = { status: string; paymentStatus: string; total: number; discount?: number; createdAt: string; items?: OrderItem[] };
export type Role = "OWNER" | "CASHIER" | "KITCHEN" | "STOCK";
export type Employee = { id: number; username: string; displayName: string; active: boolean; lastLoginAt?: string | null; roles: Role[] };
