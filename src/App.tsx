import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  FolderCog,
  AlertTriangle,
  History,
  LayoutGrid,
  Table,
  ClipboardCopy,
  Check,
} from "lucide-react";
import { useInventory } from "./store/useInventory";
import { ItemCard } from "./components/ItemCard";
import { ItemModal, CategoryModal } from "./components/Modals";
import type { InventoryItem } from "./types/inventory";
import { ItemTable } from "./components/ItemTable";

export default function App() {
  const {
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
  } = useInventory();

  const [viewMode, setViewMode] = useState<"cards" | "table">(() =>
    typeof window !== "undefined" && window.innerWidth >= 768
      ? "table"
      : "cards",
  );

  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);

  const [copiedList, setCopiedList] = useState(false);

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const lowCount = useMemo(
    () => items.filter((i) => i.currentStock <= i.minStockAlert).length,
    [items],
  );

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (selectedCat !== "all" && item.categoryId !== selectedCat)
        return false;
      if (lowOnly && item.currentStock > item.minStockAlert) return false;
      if (q && !item.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, selectedCat, lowOnly, search]);

  const handleCopyShoppingList = async () => {
    const lowItems = items.filter((i) => i.currentStock <= i.minStockAlert);
    if (lowItems.length === 0) return;

    const dateLabel = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    // Group low-stock items by category
    const grouped = new Map<string, typeof lowItems>();
    for (const item of lowItems) {
      const catName = categoryMap.get(item.categoryId) ?? "Uncategorized";
      const list = grouped.get(catName) ?? [];
      list.push(item);
      grouped.set(catName, list);
    }

    const lines: string[] = [`*Cafe Restock List (${dateLabel})*`, ""];
    for (const [catName, catItems] of grouped.entries()) {
      lines.push(`*${catName}:*`);
      for (const it of catItems) {
        lines.push(`- ${it.name} (${it.currentStock} ${it.unit} left)`);
      }
      lines.push("");
    }

    await navigator.clipboard.writeText(lines.join("\n").trim());
    setCopiedList(true);
    setTimeout(() => setCopiedList(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 text-slate-900">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 py-3 shadow-2xs">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                Cafe Inventory
              </h1>
              <p className="text-xs text-slate-500">
                {items.length} items • {categories.length} categories
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowHistory((s) => !s)}
                className={`rounded-lg border px-2.5 py-2 text-xs font-medium ${
                  showHistory
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
                title="Recent stock changes"
              >
                <History className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setViewMode((v) => (v === "cards" ? "table" : "cards"))
                }
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700"
                title={
                  viewMode === "cards"
                    ? "Switch to Table View"
                    : "Switch to Card View"
                }
              >
                {viewMode === "cards" ? (
                  <Table className="h-4 w-4" />
                ) : (
                  <LayoutGrid className="h-4 w-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsCatModalOpen(true)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700"
                title="Manage Categories"
              >
                <FolderCog className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null);
                  setIsItemModalOpen(true);
                }}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
              >
                <Plus className="h-4 w-4" />
                New Item
              </button>
            </div>
          </div>

          {/* Search & Low Stock Filter */}
          <div className="mt-3 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pr-3 pl-9 text-sm focus:border-slate-400 focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => setLowOnly((v) => !v)}
              className={`inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold ${
                lowOnly
                  ? "border-red-600 bg-red-600 text-white"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Low ({lowCount})
            </button>

            {lowCount > 0 && (
              <button
                type="button"
                onClick={handleCopyShoppingList}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-95"
                title="Copy low-stock items for WhatsApp/Viber"
              >
                {copiedList ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <ClipboardCopy className="h-3.5 w-3.5" />
                    Copy List
                  </>
                )}
              </button>
            )}
          </div>

          {/* Dynamic Category Filter Pills */}
          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSelectedCat("all")}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                selectedCat === "all"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCat(cat.id)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                  selectedCat === cat.id
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 pt-4">
        {showHistory ? (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-700">
              Recent Stock Changes
            </h2>
            {movements.length === 0 ? (
              <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                No changes recorded yet. Tap + or - on any item.
              </p>
            ) : (
              movements.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
                >
                  <div>
                    <p className="font-medium">{m.itemName}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(m.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-bold ${
                        m.delta >= 0 ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {m.delta >= 0 ? `+${m.delta}` : m.delta}
                    </span>
                    <p className="text-xs text-slate-500">Now: {m.newStock}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : filteredItems.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            No matching items found.
          </p>
        ) : viewMode === "table" ? (
          <ItemTable
            items={filteredItems}
            categoryMap={categoryMap}
            onAdjust={adjustStock}
            onEdit={(it) => {
              setEditingItem(it);
              setIsItemModalOpen(true);
            }}
          />
        ) : (
          <div className="space-y-2.5">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                categoryName={
                  categoryMap.get(item.categoryId) ?? "Uncategorized"
                }
                onAdjust={adjustStock}
                onEdit={(it) => {
                  setEditingItem(it);
                  setIsItemModalOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </main>

      {isItemModalOpen && (
        <ItemModal
          item={editingItem}
          categories={categories}
          defaultCategoryId={
            selectedCat !== "all" ? selectedCat : (categories[0]?.id ?? "")
          }
          onClose={() => setIsItemModalOpen(false)}
          onSave={(data, id) => {
            if (id) updateItem(id, data);
            else addItem(data);
          }}
          onDelete={deleteItem}
        />
      )}

      {isCatModalOpen && (
        <CategoryModal
          categories={categories}
          onClose={() => setIsCatModalOpen(false)}
          onAdd={addCategory}
          onRename={renameCategory}
          onDelete={deleteCategory}
        />
      )}
    </div>
  );
}
