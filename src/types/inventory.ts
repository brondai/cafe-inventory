export interface Category {
  id: string;
  name: string;
  sortOrder: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  categoryId: string;
  currentStock: number;
  unit: string;
  minStockAlert: number;
  notes?: string;
  updatedAt: string;
  // Ready for phase 2
  isSellable?: boolean;
  sellingPrice?: number;
}

export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  delta: number; // + for Addition, - for Subtraction
  previousStock: number;
  newStock: number;
  note?: string;
  createdAt: string;
}
