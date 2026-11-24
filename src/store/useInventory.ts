import { useState, useEffect } from "react";
import type {
  Category,
  InventoryItem,
  StockMovement,
} from "../types/inventory";
import { SEED_CATEGORIES, SEED_ITEMS } from "../data/seedInventory";

const KEYS = {
  categories: "cafe_inv_categories_v1",
  items: "cafe_inv_items_v1",
  movements: "cafe_inv_movements_v1",
};

function loadState<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useInventory() {
  const [categories, setCategories] = useState<Category[]>(() =>
    loadState(KEYS.categories, SEED_CATEGORIES),
  );
  const [items, setItems] = useState<InventoryItem[]>(() =>
    loadState(KEYS.items, SEED_ITEMS),
  );
  const [movements, setMovements] = useState<StockMovement[]>(() =>
    loadState(KEYS.movements, []),
  );

  useEffect(() => {
    localStorage.setItem(KEYS.categories, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(KEYS.items, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(KEYS.movements, JSON.stringify(movements));
  }, [movements]);

  // Adjust stock (+ or -) and record movement history
  const adjustStock = (itemId: string, delta: number, note?: string) => {
    if (!delta || isNaN(delta)) return;
    const now = new Date().toISOString();

    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const previousStock = item.currentStock;
        const newStock = Math.max(0, previousStock + delta);

        const log: StockMovement = {
          id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          itemId: item.id,
          itemName: item.name,
          delta: newStock - previousStock,
          previousStock,
          newStock,
          note,
          createdAt: now,
        };
        setMovements((m) => [log, ...m].slice(0, 500));

        return { ...item, currentStock: newStock, updatedAt: now };
      }),
    );
  };

  // Dynamic Item CRUD
  const addItem = (data: Omit<InventoryItem, "id" | "updatedAt">) => {
    const newItem: InventoryItem = {
      ...data,
      id: `item-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    setItems((prev) => [newItem, ...prev]);
  };

  const updateItem = (
    id: string,
    updates: Partial<Omit<InventoryItem, "id">>,
  ) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, ...updates, updatedAt: new Date().toISOString() }
          : item,
      ),
    );
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Dynamic Category CRUD
  const addCategory = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: trimmed,
      sortOrder: categories.length + 1,
    };
    setCategories((prev) => [...prev, newCat]);
    return newCat.id;
  };

  const renameCategory = (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name: trimmed } : c)),
    );
  };

  const deleteCategory = (id: string, moveItemsToCategoryId?: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    if (moveItemsToCategoryId) {
      setItems((prev) =>
        prev.map((item) =>
          item.categoryId === id
            ? { ...item, categoryId: moveItemsToCategoryId }
            : item,
        ),
      );
    } else {
      setItems((prev) => prev.filter((item) => item.categoryId !== id));
    }
  };

  return {
    categories,
    items,
    movements,
    adjustStock,
    addItem,
    updateItem,
    deleteItem,
    addCategory,
    renameCategory,
    deleteCategory,
  };
}
