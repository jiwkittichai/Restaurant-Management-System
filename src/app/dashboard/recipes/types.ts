/**
 * รวมรูปแบบข้อมูลที่ใช้ในสูตรอาหาร
 * ใช้กำหนดว่าข้อมูลจาก API สถานะของหน้าจอ และข้อมูลที่ส่งระหว่างส่วนประกอบต้องมีหน้าตาอย่างไร
 */

export type Ingredient = { id: number; name: string; unit: string; stock: number; minStock: number };
export type Recipe = { ingredientId: number; quantity: number; ingredient: Ingredient };
export type ModifierOption = { id: number; name: string; price: number; recipes: Recipe[] };
export type ModifierGroup = { id: number; name: string; required: boolean; minSelect: number; maxSelect: number; options: ModifierOption[] };
export type Menu = { id: number; name: string; saleUnit: string; category: { name: string }; recipes: Recipe[]; modifierGroups: ModifierGroup[] };
export type RecipeTarget = { type: "menu"; id: number; label: string; recipes: Recipe[] } | { type: "modifier"; id: number; label: string; groupName: string; recipes: Recipe[] };
