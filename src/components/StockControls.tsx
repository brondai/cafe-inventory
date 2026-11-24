import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';

interface StockControlsProps {
  itemId: string;
  currentStock: number;
  onAdjust: (id: string, delta: number, note?: string) => void;
  compact?: boolean;
}

export function StockControls({
  itemId,
  currentStock,
  onAdjust,
  compact = false,
}: StockControlsProps) {
  const [customQty, setCustomQty] = useState('');

  const handleCustom = (sign: 1 | -1) => {
    const qty = Number(customQty);
    if (!qty || qty <= 0) return;
    onAdjust(itemId, sign * qty);
    setCustomQty('');
  };

  const btnSize = compact ? 'h-7 w-8' : 'h-9 w-11';
  const inputSize = compact ? 'h-7 w-14 text-xs' : 'h-9 w-16 text-sm';
  const actionSize = compact ? 'h-7 px-2 text-xs' : 'h-9 px-2.5 text-xs';

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={() => onAdjust(itemId, -1)}
        disabled={currentStock <= 0}
        className={`flex ${btnSize} items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-700 active:scale-95 disabled:opacity-40`}
        aria-label="Decrease by 1"
      >
        <Minus className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      </button>
      <button
        type="button"
        onClick={() => onAdjust(itemId, 1)}
        className={`flex ${btnSize} items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 active:scale-95`}
        aria-label="Increase by 1"
      >
        <Plus className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      </button>

      <div className="ml-auto flex items-center gap-1">
        <input
          type="number"
          min="1"
          inputMode="numeric"
          placeholder="Qty"
          value={customQty}
          onChange={(e) => setCustomQty(e.target.value)}
          className={`${inputSize} rounded-lg border border-slate-300 px-1.5 text-center focus:border-slate-500 focus:outline-none`}
        />
        <button
          type="button"
          onClick={() => handleCustom(1)}
          className={`${actionSize} rounded-lg bg-emerald-600 font-semibold text-white active:scale-95`}
        >
          {compact ? '+' : '+ Add'}
        </button>
        <button
          type="button"
          onClick={() => handleCustom(-1)}
          className={`${actionSize} rounded-lg bg-rose-600 font-semibold text-white active:scale-95`}
        >
          {compact ? '-' : '- Used'}
        </button>
      </div>
    </div>
  );
}