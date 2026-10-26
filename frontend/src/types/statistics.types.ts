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
  date?: string;
}

export interface CategoryRevenue {
  categoryName: string;
  revenue: number;
  itemsSold: number;
  percentage: number;
}

export interface IncomeSummary {
  totalRevenue: number;
  monthlyRevenue: number;
  weeklyRevenue?: number;
  yearlyRevenue?: number;
  totalOrders: number;
  totalCustomers?: number;
  newCustomers?: number;
  conversionRate?: number;
  growthPercent: number;
  monthlyMatrix: MonthlyData[];
  recentTransactions: Transaction[];
  categoryBreakdown?: CategoryRevenue[];
}
