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

// 1. Quản lý người dùng toàn sàn (Task 9, 10, 11)
export interface AdminUser {
  id: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string;
  role: 'Customer' | 'Seller' | 'Admin';
  isActive: boolean;
  createdAt: string;
  totalSpent: number;
  orderCount: number;
}

export interface AdminUserListResponse {
  items: AdminUser[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  roleCounts: {
    All: number;
    Customer: number;
    Seller: number;
    Admin: number;
  };
}

export interface AdminUserStatusUpdatePayload {
  isActive?: boolean;
  role?: string;
}

// 2. Đối soát & duyệt lệnh rút tiền (Task 20)
export interface AdminPayout {
  id: number;
  sellerId: number;
  sellerName: string;
  sellerEmail: string;
  amount: number;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
  processedAt?: string;
  transactionRef?: string;
  note?: string;
}

export interface AdminPayoutActionPayload {
  status: 'Approved' | 'Rejected';
  transactionRef?: string;
  note?: string;
}

// 3. Kiểm duyệt sản phẩm toàn sàn (Task 15)
export interface AdminProduct {
  id: number;
  name: string;
  sku: string;
  basePrice: number;
  discountPercent?: number;
  stockQuantity: number;
  isActive: boolean;
  categoryId: number;
  categoryName: string;
  sellerId: number;
  sellerName: string;
  imageUrl?: string;
  createdAt: string;
}

export interface AdminProductListResponse {
  items: AdminProduct[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminProductStatusUpdatePayload {
  isActive: boolean;
  moderationNote?: string;
}

// 4. Cấu hình sàn & hoa hồng (Task 19)
export interface PlatformSettings {
  defaultCommissionRate: number;
  mallCommissionRate: number;
  escrowHoldDays: number;
  minPayoutAmount: number;
  supportEmail: string;
  supportHotline: string;
  maintenanceMode: boolean;
}
