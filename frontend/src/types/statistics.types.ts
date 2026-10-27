/** Định nghĩa kiểu dữ liệu Thống kê */

export interface MonthlyData {
  month: string;
  existingUsers: number;
  newUsers: number;
  valTotal: string;
  isActive?: boolean;
  newText?: string;
  existText?: string;
}

export interface Transaction {
  id: string;
  customer: string;
  product: string;
  status: 'Success' | 'Pending' | 'Refunded';
  qty: number;
  unitPrice: string;
  total: string;
}

export interface CategoryRevenue {
  categoryName: string;
  revenue: number;
  percentage: number;
  orderCount: number;
}

export interface IncomeSummary {
  totalRevenue: number;
  monthlyRevenue: number;
  totalOrders: number;
  growthPercent: number;
  shopViews?: number;
  categoryBreakdown?: CategoryRevenue[];
  monthlyMatrix: MonthlyData[];
  recentTransactions: Transaction[];
}
