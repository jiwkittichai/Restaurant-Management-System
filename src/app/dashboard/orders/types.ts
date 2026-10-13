/**
 * รวมรูปแบบข้อมูลที่ใช้ในการรับออเดอร์
 * ใช้กำหนดว่าข้อมูลจาก API สถานะของหน้าจอ และข้อมูลที่ส่งระหว่างส่วนประกอบต้องมีหน้าตาอย่างไร
 */

export type Modifier = { id: number; name: string; price: number };
export type ModifierGroup = {
  id: number;
  name: string;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  options: Modifier[];
};
export type MenuItem = {
  id: number;
  name: string;
  price: number;
  saleUnit: string;
  image?: string;
  available: boolean;
  sellable: boolean;
  stockTracked: boolean;
  maxServings: number | null;
  modifiers: Modifier[];
  modifierGroups: ModifierGroup[];
  category: { id: number; name: string };
};
export type Category = { id: number; name: string };
export type ActiveOrder = {
  id: number;
  orderNumber: string;
  subtotal: number;
  discount: number;
  total: number;
  status: string;
  paymentStatus: string;
  items: Array<{
    id: number;
    name: string;
    qty: number;
    price: number;
    status: string;
    source?: string;
    modifiers?: Modifier[];
  }>;
};
export type RestaurantTable = {
  id: number;
  name: string;
  status: string;
  orders: ActiveOrder[];
  sessions?: Array<{ billRequestedAt: string | null }>;
};
export type CartItem = MenuItem & {
  lineId: string;
  qty: number;
  note: string;
  modifierIds: number[];
};
export type OrderType = "DINE_IN" | "TAKEAWAY";
