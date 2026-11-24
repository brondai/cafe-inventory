// import { useState, useEffect } from "react";
// import type {
//   Category,
//   InventoryItem,
//   StockMovement,
// } from "../types/inventory";
// import { SEED_CATEGORIES, SEED_ITEMS } from "../data/seedInventory";

// const KEYS = {
//   categories: "cafe_inv_categories_v1",
//   items: "cafe_inv_items_v1",
//   movements: "cafe_inv_movements_v1",
// };

// function loadState<T>(key: string, fallback: T): T {
//   try {
//     const raw = localStorage.getItem(key);
//     return raw ? (JSON.parse(raw) as T) : fallback;
//   } catch {
//     return fallback;
//   }
// }

// export function useInventory() {
//   const [categories, setCategories] = useState<Category[]>(() =>
//     loadState(KEYS.categories, SEED_CATEGORIES),
//   );
//   const [items, setItems] = useState<InventoryItem[]>(() =>
//     loadState(KEYS.items, SEED_ITEMS),
//   );
//   const [movements, setMovements] = useState<StockMovement[]>(() =>
//     loadState(KEYS.movements, []),
//   );

//   useEffect(() => {
//     localStorage.setItem(KEYS.categories, JSON.stringify(categories));
//   }, [categories]);

//   useEffect(() => {
//     localStorage.setItem(KEYS.items, JSON.stringify(items));
//   }, [items]);

//   useEffect(() => {
//     localStorage.setItem(KEYS.movements, JSON.stringify(movements));
//   }, [movements]);

//   // Adjust stock (+ or -) and record movement history
//   const adjustStock = (itemId: string, delta: number, note?: string) => {
//     if (!delta || isNaN(delta)) return;
//     const now = new Date().toISOString();

//     setItems((prev) =>
//       prev.map((item) => {
//         if (item.id !== itemId) return item;
//         const previousStock = item.currentStock;
//         const newStock = Math.max(0, previousStock + delta);

//         const log: StockMovement = {
//           id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
//           itemId: item.id,
//           itemName: item.name,
//           delta: newStock - previousStock,
//           previousStock,
//           newStock,
//           note,
//           createdAt: now,
//         };
//         setMovements((m) => [log, ...m].slice(0, 500));

//         return { ...item, currentStock: newStock, updatedAt: now };
//       }),
//     );
//   };

//   // Dynamic Item CRUD
//   const addItem = (data: Omit<InventoryItem, "id" | "updatedAt">) => {
//     const newItem: InventoryItem = {
//       ...data,
//       id: `item-${Date.now()}`,
//       updatedAt: new Date().toISOString(),
//     };
//     setItems((prev) => [newItem, ...prev]);
//   };

//   const updateItem = (
//     id: string,
//     updates: Partial<Omit<InventoryItem, "id">>,
//   ) => {
//     setItems((prev) =>
//       prev.map((item) =>
//         item.id === id
//           ? { ...item, ...updates, updatedAt: new Date().toISOString() }
//           : item,
//       ),
//     );
//   };

//   const deleteItem = (id: string) => {
//     setItems((prev) => prev.filter((item) => item.id !== id));
//   };

//   // Dynamic Category CRUD
//   const addCategory = (name: string) => {
//     const trimmed = name.trim();
//     if (!trimmed) return;
//     const newCat: Category = {
//       id: `cat-${Date.now()}`,
//       name: trimmed,
//       sortOrder: categories.length + 1,
//     };
//     setCategories((prev) => [...prev, newCat]);
//     return newCat.id;
//   };

//   const renameCategory = (id: string, name: string) => {
//     const trimmed = name.trim();
//     if (!trimmed) return;
//     setCategories((prev) =>
//       prev.map((c) => (c.id === id ? { ...c, name: trimmed } : c)),
//     );
//   };

//   const deleteCategory = (id: string, moveItemsToCategoryId?: string) => {
//     setCategories((prev) => prev.filter((c) => c.id !== id));
//     if (moveItemsToCategoryId) {
//       setItems((prev) =>
//         prev.map((item) =>
//           item.categoryId === id
//             ? { ...item, categoryId: moveItemsToCategoryId }
//             : item,
//         ),
//       );
//     } else {
//       setItems((prev) => prev.filter((item) => item.categoryId !== id));
//     }
//   };

//   return {
//     categories,
//     items,
//     movements,
//     adjustStock,
//     addItem,
//     updateItem,
//     deleteItem,
//     addCategory,
//     renameCategory,
//     deleteCategory,
//   };
// }

import { useState, useEffect, useCallback } from "react";
import type {
  Category,
  InventoryItem,
  StockMovement,
} from "../types/inventory";
import { SEED_CATEGORIES, SEED_ITEMS } from "../data/seedInventory";
import { supabase } from "../lib/supabase";

function mapCategory(row: Record<string, unknown>): Category {
  return {
    id: String(row.id),
    name: String(row.name),
    sortOrder: Number(row.sort_order ?? 0),
  };
}

function mapItem(row: Record<string, unknown>): InventoryItem {
  return {
    id: String(row.id),
    name: String(row.name),
    categoryId: String(row.category_id ?? ""),
    currentStock: Number(row.current_stock ?? 0),
    unit: String(row.unit ?? "pcs"),
    minStockAlert: Number(row.min_stock_alert ?? 2),
    isSellable: Boolean(row.is_sellable),
    sellingPrice:
      row.selling_price != null ? Number(row.selling_price) : undefined,
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

function mapMovement(row: Record<string, unknown>): StockMovement {
  return {
    id: String(row.id),
    itemId: String(row.item_id ?? ""),
    itemName: String(row.item_name ?? ""),
    delta: Number(row.delta ?? 0),
    previousStock: Number(row.previous_stock ?? 0),
    newStock: Number(row.new_stock ?? 0),
    note: row.note ? String(row.note) : undefined,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export function useInventory() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const [catRes, itemRes, movRes] = await Promise.all([
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("inventory_items").select("*").order("name"),
      supabase
        .from("stock_movements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    if (catRes.error || itemRes.error) {
      console.error("Supabase load error:", catRes.error ?? itemRes.error);
      setLoading(false);
      return;
    }

    // Seed Supabase once if the database is empty
    if ((catRes.data?.length ?? 0) === 0 && (itemRes.data?.length ?? 0) === 0) {
      await supabase.from("categories").insert(
        SEED_CATEGORIES.map((c) => ({
          id: c.id,
          name: c.name,
          sort_order: c.sortOrder,
        })),
      );
      await supabase.from("inventory_items").insert(
        SEED_ITEMS.map((i) => ({
          id: i.id,
          name: i.name,
          category_id: i.categoryId,
          current_stock: i.currentStock,
          unit: i.unit,
          min_stock_alert: i.minStockAlert,
          updated_at: i.updatedAt,
        })),
      );
      setCategories(SEED_CATEGORIES);
      setItems(SEED_ITEMS);
      setMovements([]);
      setLoading(false);
      return;
    }

    setCategories((catRes.data ?? []).map(mapCategory));
    setItems((itemRes.data ?? []).map(mapItem));
    setMovements((movRes.data ?? []).map(mapMovement));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();

    const channel = supabase
      .channel("cafe-inventory-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories" },
        () => fetchAll(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inventory_items" },
        () => fetchAll(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "stock_movements" },
        () => fetchAll(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAll]);

  const adjustStock = async (itemId: string, delta: number, note?: string) => {
    if (!delta || isNaN(delta)) return;
    const target = items.find((i) => i.id === itemId);
    if (!target) return;

    const now = new Date().toISOString();
    const previousStock = target.currentStock;
    const newStock = Math.max(0, previousStock + delta);
    const actualDelta = newStock - previousStock;

    const log: StockMovement = {
      id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      itemId: target.id,
      itemName: target.name,
      delta: actualDelta,
      previousStock,
      newStock,
      note,
      createdAt: now,
    };

    // Optimistic UI update
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId ? { ...i, currentStock: newStock, updatedAt: now } : i,
      ),
    );
    setMovements((prev) => [log, ...prev].slice(0, 200));

    await Promise.all([
      supabase
        .from("inventory_items")
        .update({ current_stock: newStock, updated_at: now })
        .eq("id", itemId),
      supabase.from("stock_movements").insert({
        id: log.id,
        item_id: log.itemId,
        item_name: log.itemName,
        delta: log.delta,
        previous_stock: log.previousStock,
        new_stock: log.newStock,
        note: log.note ?? null,
        created_at: log.createdAt,
      }),
    ]);
  };

  const addItem = async (data: Omit<InventoryItem, "id" | "updatedAt">) => {
    const newItem: InventoryItem = {
      ...data,
      id: `item-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    setItems((prev) => [newItem, ...prev]);

    await supabase.from("inventory_items").insert({
      id: newItem.id,
      name: newItem.name,
      category_id: newItem.categoryId,
      current_stock: newItem.currentStock,
      unit: newItem.unit,
      min_stock_alert: newItem.minStockAlert,
      is_sellable: newItem.isSellable ?? false,
      selling_price: newItem.sellingPrice ?? null,
      updated_at: newItem.updatedAt,
    });
  };

  const updateItem = async (
    id: string,
    updates: Partial<Omit<InventoryItem, "id">>,
  ) => {
    const now = new Date().toISOString();
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ...updates, updatedAt: now } : item,
      ),
    );

    const payload: Record<string, unknown> = { updated_at: now };
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.categoryId !== undefined)
      payload.category_id = updates.categoryId;
    if (updates.currentStock !== undefined)
      payload.current_stock = updates.currentStock;
    if (updates.unit !== undefined) payload.unit = updates.unit;
    if (updates.minStockAlert !== undefined)
      payload.min_stock_alert = updates.minStockAlert;

    await supabase.from("inventory_items").update(payload).eq("id", id);
  };

  const deleteItem = async (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    await supabase.from("inventory_items").delete().eq("id", id);
  };

  const addCategory = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: trimmed,
      sortOrder: categories.length + 1,
    };
    setCategories((prev) => [...prev, newCat]);

    await supabase.from("categories").insert({
      id: newCat.id,
      name: newCat.name,
      sort_order: newCat.sortOrder,
    });
    return newCat.id;
  };

  const renameCategory = async (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name: trimmed } : c)),
    );
    await supabase.from("categories").update({ name: trimmed }).eq("id", id);
  };

  const deleteCategory = async (id: string, moveItemsToCategoryId?: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    if (moveItemsToCategoryId) {
      setItems((prev) =>
        prev.map((item) =>
          item.categoryId === id
            ? { ...item, categoryId: moveItemsToCategoryId }
            : item,
        ),
      );
      await supabase
        .from("inventory_items")
        .update({ category_id: moveItemsToCategoryId })
        .eq("category_id", id);
    } else {
      setItems((prev) => prev.filter((item) => item.categoryId !== id));
      await supabase.from("inventory_items").delete().eq("category_id", id);
    }
    await supabase.from("categories").delete().eq("id", id);
  };

  return {
    categories,
    items,
    movements,
    loading,
    adjustStock,
    addItem,
    updateItem,
    deleteItem,
    addCategory,
    renameCategory,
    deleteCategory,
  };
}
