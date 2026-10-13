/**
 * รวมรูปแบบข้อมูลที่ใช้ในการสั่งอาหารผ่าน QR
 * ใช้กำหนดว่าข้อมูลจาก API สถานะของหน้าจอ และข้อมูลที่ส่งระหว่างส่วนประกอบต้องมีหน้าตาอย่างไร
 */

import type { RestaurantBrand } from "@/lib/restaurant-brand";

export type ModifierOption = { id: number; name: string; price: number };

export type ModifierGroup = {
  id: number;
  name: string;
  minSelect: number;
  maxSelect: number;
  options: ModifierOption[];
};

export type GuestMenuItem = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  available: boolean;
  category: { id: number; name: string };
  modifierGroups: ModifierGroup[];
};

export type CartLine = {
  key: string;
  menu: GuestMenuItem;
  qty: number;
  note: string;
  modifierIds: number[];
};

export type SubmittedItem = {
  id: number;
  name: string;
  qty: number;
  price: number;
  status: string;
  mine: boolean;
  note: string | null;
  modifiers: Array<{ name: string }>;
};

export type GuestOrderData = {
  brand: RestaurantBrand;
  restaurantName: string;
  tableName: string;
  paused: boolean;
  billRequestedAt: string | null;
  menu: GuestMenuItem[];
  order: {
    total: number;
    subtotal: number;
    discount: number;
    items: SubmittedItem[];
  } | null;
};

export type GuestTab = "menu" | "mine" | "table";
