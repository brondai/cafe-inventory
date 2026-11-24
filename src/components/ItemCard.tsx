import { AlertTriangle, Pencil } from "lucide-react";
import type { InventoryItem } from "../types/inventory";
import { StockControls } from "./StockControls";

interface ItemCardProps {
  item: InventoryItem;
  categoryName: string;
  onAdjust: (id: string, delta: number, note?: string) => void;
  onEdit: (item: InventoryItem) => void;
}

export function ItemCard({
  item,
  categoryName,
  onAdjust,
  onEdit,
}: ItemCardProps) {
  const isLow = item.currentStock <= item.minStockAlert;

  return (
    <div
      className={`rounded-xl border bg-white p-3.5 shadow-xs transition ${
        isLow ? "border-red-300 bg-red-50/40" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-slate-900">
              {item.name}
            </h3>
            {isLow && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                <AlertTriangle className="h-3 w-3" />
                Low
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">{categoryName}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <span
              className={`text-lg font-bold ${
                isLow ? "text-red-600" : "text-slate-900"
              }`}
            >
              {item.currentStock}
            </span>
            <span className="ml-1 text-xs text-slate-500">{item.unit}</span>
          </div>
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label={`Edit ${item.name}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3">
        <StockControls
          itemId={item.id}
          currentStock={item.currentStock}
          onAdjust={onAdjust}
        />
      </div>
    </div>
  );
}
