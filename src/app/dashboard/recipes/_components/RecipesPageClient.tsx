"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Ingredient, Menu, RecipeTarget } from "../types";
import RecipeEditor from "./RecipeEditor";
import RecipeMenuList from "./RecipeMenuList";

export default function RecipesPageClient() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [menu, setMenu] = useState<Menu[]>([]);
  const [selectedMenu, setSelectedMenu] = useState("");
  const [targetKey, setTargetKey] = useState("");
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(
    () => Promise.all([fetch("/api/inventory").then((response) => response.json()), fetch("/api/recipes").then((response) => response.json())]).then(([inventoryData, menuData]) => {
      setIngredients(Array.isArray(inventoryData) ? inventoryData : []);
      setMenu(Array.isArray(menuData) ? menuData : []);
    }),
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  const filteredMenu = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return menu;
    return menu.filter((item) => `${item.name} ${item.category.name}`.toLowerCase().includes(query));
  }, [menu, search]);

  const selected = useMemo(() => menu.find((item) => item.id === Number(selectedMenu)), [menu, selectedMenu]);
  const recipeTargets = useMemo<RecipeTarget[]>(() => {
    if (!selected) return [];
    return [
      { type: "menu", id: selected.id, label: "สูตรเมนูหลัก", recipes: selected.recipes },
      ...selected.modifierGroups.flatMap((group) => group.options.map((option) => ({
        type: "modifier" as const,
        id: option.id,
        label: option.name,
        groupName: group.name,
        recipes: option.recipes,
      }))),
    ];
  }, [selected]);
  const selectedTarget = recipeTargets.find((target) => `${target.type}:${target.id}` === targetKey) || recipeTargets[0];

  useEffect(() => {
    if (!selected) {
      setTargetKey("");
      return;
    }
    setTargetKey(`menu:${selected.id}`);
  }, [selected]);

  useEffect(() => {
    const next: Record<number, string> = {};
    selectedTarget?.recipes.forEach((recipe) => {
      next[recipe.ingredientId] = String(recipe.quantity);
    });
    setQuantities(next);
  }, [selectedTarget?.type, selectedTarget?.id]);

  function chooseMenu(item: Menu) {
    setSelectedMenu(String(item.id));
    setMessage("");
  }

  function chooseTarget(key: string) {
    setTargetKey(key);
    setMessage("");
  }

  async function saveRecipe() {
    if (!selectedTarget) return;
    setSaving(true);
    setMessage("");
    const list = Object.entries(quantities)
      .filter(([, quantity]) => Number(quantity) > 0)
      .map(([ingredientId, quantity]) => ({ ingredientId: Number(ingredientId), quantity: Number(quantity) }));
    const response = await fetch("/api/recipes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetType: selectedTarget.type,
        menuItemId: selectedTarget.type === "menu" ? selectedTarget.id : undefined,
        modifierId: selectedTarget.type === "modifier" ? selectedTarget.id : undefined,
        ingredients: list,
      }),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) return setMessage(data.error || "บันทึกสูตรอาหารไม่สำเร็จ");
    setMessage("บันทึกสูตรอาหารแล้ว");
    load();
  }

  return (
    <div className="grid min-h-0 gap-5 overflow-y-auto p-4 sm:p-6 xl:h-[calc(100dvh-96px)] xl:grid-cols-[360px_minmax(0,1fr)] xl:overflow-hidden">
      <RecipeMenuList menu={filteredMenu} selectedMenuId={selectedMenu} search={search} onSearch={setSearch} onSelect={chooseMenu} />
      <RecipeEditor
        menu={selected}
        targets={recipeTargets}
        selectedTarget={selectedTarget}
        targetKey={targetKey}
        ingredients={ingredients}
        quantities={quantities}
        message={message}
        saving={saving}
        onTarget={chooseTarget}
        onQuantity={(ingredientId, value) => setQuantities({ ...quantities, [ingredientId]: value })}
        onSave={saveRecipe}
      />
    </div>
  );
}
