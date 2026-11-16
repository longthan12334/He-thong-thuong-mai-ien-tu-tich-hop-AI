/** Định nghĩa kiểu dữ liệu Tồn kho */

export interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  categoryName: string;
  imageUrl: string;
  price: number;
  stockQuantity: number;
  stockStatus: string;
  safetyThreshold: number;
  costPrice?: number;
  reservedStock?: number;
  isActive?: boolean;
}

export interface InventorySummary {
  totalSku: number;
  totalStockItems: number;
  totalStockValue: number;
  lowStockAlertCount: number;
  items: InventoryItem[];
}

export interface RestockRequest {
  productId: number;
  additionalQuantity: number;
  note?: string;
}
