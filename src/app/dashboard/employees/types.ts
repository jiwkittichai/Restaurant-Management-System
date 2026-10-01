export type Role = "OWNER" | "CASHIER" | "KITCHEN" | "STOCK";
export type Employee = { id: number; username: string; displayName: string; active: boolean; lastLoginAt?: string; createdAt: string; roles: Role[] };
