export type Ingredient = { id: number; name: string; unit: string };
export type Recipe = { id: number; ingredientId: number; quantity: number; ingredient: Ingredient };
export type Modifier = { id: number; name: string; price: number; modifier?: { recipes: Recipe[] } | null };
export type KitchenItem = { source?: string; id: number; name: string; qty: number; note?: string; status: string; menuItem?: { recipes: Recipe[] }; modifiers?: Modifier[] };
export type KitchenOrder = { id: number; orderNumber: string; type: string; queueNumber?: string; customerName?: string; paymentStatus: string; status: string; createdAt: string; table?: { name: string }; items: KitchenItem[] };
export type MonitorTab = "ALL" | "NEW" | "PREPARING" | "READY";
export type SelectedRecipe = { order: KitchenOrder; item: KitchenItem };
export type RecipeLine = { key: string; ingredientName: string; unit: string; source: string; perUnitQuantity: number; totalQuantity: number };
