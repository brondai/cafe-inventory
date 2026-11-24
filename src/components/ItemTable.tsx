import { Pencil } from "lucide-react";
import type { InventoryItem } from "../types/inventory";
import { StockControls } from "./StockControls";

interface ItemTableProps {
  items: InventoryItem[];
  categoryMap: Map<string, string>;
  onAdjust: (id: string, delta: number, note?: string) => void;
  onEdit: (item: InventoryItem) => void;
}

export function ItemTable({
  items,
  categoryMap,
  onAdjust,
  onEdit,
}: ItemTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
      <table className="w-full min-w-[540px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
          <tr>
            <th className="px-3 py-2.5">Item</th>
            <th className="px-3 py-2.5 text-right">Stock</th>
            <th className="px-3 py-2.5 text-center">Adjust Stock</th>
            <th className="w-10 px-2 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item) => {
            const isLow = item.currentStock <= item.minStockAlert;
            return (
              <tr
                key={item.id}
                className={isLow ? "bg-red-50/50" : "hover:bg-slate-50/70"}
              >
                <td className="px-3 py-2">
                  <div className="font-medium text-slate-900">{item.name}</div>
                  <div className="text-xs text-slate-500">
                    {categoryMap.get(item.categoryId) ?? "Uncategorized"}
                  </div>
                </td>

                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <span
                    className={`font-bold ${
                      isLow ? "text-red-600" : "text-slate-900"
                    }`}
                  >
                    {item.currentStock}
                  </span>
                  <span className="ml-1 text-xs text-slate-500">
                    {item.unit}
                  </span>
                </td>

                <td className="px-3 py-2">
                  <StockControls
                    itemId={item.id}
                    currentStock={item.currentStock}
                    onAdjust={onAdjust}
                    compact
                  />
                </td>

                <td className="px-2 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    aria-label={`Edit ${item.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
