export type MenuCategory = { id: number; name: string };

export type ModifierOptionDraft = { name: string; price: string };

export type ModifierGroupDraft = {
  name: string;
  required: boolean;
  minSelect: string;
  maxSelect: string;
  options: ModifierOptionDraft[];
};

export type MenuItemForm = {
  name: string;
  sku: string;
  description: string;
  price: string;
  saleUnit: string;
  categoryId: string;
};

export type MenuItemListItem = {
  id: number;
  name: string;
  sku: string;
  description?: string;
  price: number;
  saleUnit: string;
  image?: string;
  available: boolean;
  stockTracked: boolean;
  maxServings: number | null;
  sellable: boolean;
  category: { name: string };
};

export type EditableMenuItem = {
  id: number;
  name: string;
  sku: string;
  description?: string;
  price: number;
  saleUnit: string;
  image?: string;
  available: boolean;
  categoryId: number;
  modifierGroups?: Array<{
    name: string;
    required: boolean;
    minSelect: number;
    maxSelect: number;
    options: Array<{ name: string; price: number }>;
  }>;
};
