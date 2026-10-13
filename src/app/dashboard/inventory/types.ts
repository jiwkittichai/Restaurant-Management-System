/**
 * รวมรูปแบบข้อมูลที่ใช้ในวัตถุดิบและสต็อก
 * ใช้กำหนดว่าข้อมูลจาก API สถานะของหน้าจอ และข้อมูลที่ส่งระหว่างส่วนประกอบต้องมีหน้าตาอย่างไร
 */

export type Movement = { id: number; type: string; quantity: number; note?: string; createdAt: string };
export type Ingredient = { id: number; name: string; unit: string; stock: number; minStock: number; _count: { recipes: number; modifierRecipes: number }; movements: Movement[] };
export type EditForm = { name: string; unit: string; stock: string; minStock: string };
export type IngredientForm = { name: string; unit: string; stock: string; minStock: string };
export type StockFilter = "ALL" | "LOW" | "READY";
