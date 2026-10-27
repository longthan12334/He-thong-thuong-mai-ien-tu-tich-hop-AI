export interface AdminMonthlyGmv {
  month: string;
  revenue: number;
  orderCount: number;
  averageOrderValue: number;
}

export interface AdminActionItem {
  id: string;
  type: 'KYC' | 'Order' | 'Payout' | 'Report';
  title: string;
  subtitle: string;
  timeAgo: string;
  status: 'Pending' | 'Processed';
}

export interface AdminDashboardStats {
  totalSellers: number;
  activeSellers: number;
  pendingKycSellers: number;
  suspendedSellers: number;
  totalProducts: number;
  totalCategories: number;
  grossGmv: number;
  platformCommission: number;
  escrowBalance: number;
  totalOrders: number;
  pendingOrders: number;
  totalCustomers: number;
  monthlyGrowthRate: number;
  monthlyGmv: AdminMonthlyGmv[];
  pendingActions: AdminActionItem[];
}

export interface AdminSeller {
  id: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string;
  sellerStatus: 'Active' | 'PendingKYC' | 'Suspended';
  isMallVerified: boolean;
  suspendedReason?: string;
  kycNotes?: string;
  commissionRate: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  createdAt: string;
  storeCount: number;
  mainStoreAddress?: string;
}

export interface AdminSellerListResponse {
  items: AdminSeller[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  statusCounts: {
    All: number;
    Active: number;
    PendingKYC: number;
    Suspended: number;
  };
}

export interface AdminSellerStatusUpdatePayload {
  sellerStatus?: string;
  isMallVerified?: boolean;
  suspendedReason?: string;
  kycNotes?: string;
}
