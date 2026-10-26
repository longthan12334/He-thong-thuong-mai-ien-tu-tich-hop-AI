/** Định nghĩa kiểu dữ liệu Xác thực */

export interface AuthUser {
  userId: number;
  id?: number;
  fullName: string;
  email: string;
  role: 'Admin' | 'Seller' | 'Customer';
  avatarUrl?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  /** Mặc định đăng ký tài khoản Khách hàng; nâng cấp Seller qua luồng "Mở Gian Hàng" */
  role?: 'Customer' | 'Seller';
}

export interface LoginResponse {
  token: string;
  userId: number;
  fullName: string;
  email: string;
  role: 'Admin' | 'Seller' | 'Customer';
  avatarUrl?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ApplySellerRequest {
  storeName: string;
  phoneNumber?: string;
  address?: string;
  description?: string;
}

