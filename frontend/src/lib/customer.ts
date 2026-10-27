/**
 * Tiện ích nghiệp vụ dành riêng cho phân hệ Khách hàng (Customer)
 * - Nhận diện thương hiệu, chuẩn hóa biến thể (size/màu)
 * - Bộ máy gợi ý sản phẩm cá nhân hóa (AI Recommendation Engine phía client)
 * - Tính tiền đơn hàng khớp 100% công thức OrderService ở Backend
 * - Kiểm tra định dạng số điện thoại Việt Nam, chuẩn hóa trạng thái đơn
 */

import type { Product, ProductVariant } from '@/types';
import type { ProductSnapshot } from '@/contexts/ShopperContext';

type AnyProduct = Product | ProductSnapshot;

/* ------------------------------------------------------------------ */
/* 1. THƯƠNG HIỆU                                                      */
/* ------------------------------------------------------------------ */

const BRAND_PATTERNS: { brand: string; keys: string[] }[] = [
  { brand: 'Louis Vuitton', keys: ['louis vuitton', 'lv '] },
  { brand: 'Bottega Veneta', keys: ['bottega'] },
  { brand: 'Off-White', keys: ['off-white', 'offwhite', 'off white'] },
  { brand: 'Hermès', keys: ['hermès', 'hermes'] },
  { brand: 'Balenciaga', keys: ['balenciaga'] },
  { brand: 'Burberry', keys: ['burberry'] },
  { brand: 'Gucci', keys: ['gucci'] },
  { brand: 'Prada', keys: ['prada'] },
  { brand: 'Fendi', keys: ['fendi'] },
  { brand: 'Dior', keys: ['dior'] },
  { brand: 'Chanel', keys: ['chanel'] },
  { brand: 'Nike', keys: ['nike', 'jordan'] },
  { brand: 'Adidas', keys: ['adidas'] },
  { brand: 'Puma', keys: ['puma'] },
  { brand: 'Uniqlo', keys: ['uniqlo'] },
  { brand: 'Essentials', keys: ['essential'] },
];

/** Nhận diện thương hiệu từ tên / bộ sưu tập. Trả về '' nếu không xác định được */
export function extractBrand(p: Pick<AnyProduct, 'name'> & { collectionName?: string }): string {
  const haystack = ` ${p.name || ''} ${p.collectionName || ''} `.toLowerCase();
  const found = BRAND_PATTERNS.find((b) => b.keys.some((k) => haystack.includes(k)));
  if (found) return found.brand;

  if (p.name && p.name.includes(' - ')) {
    const candidate = p.name.split(' - ')[0].trim();
    if (candidate.length > 1 && candidate.length < 35) {
      return candidate;
    }
  }

  return '';
}

/* ------------------------------------------------------------------ */
/* 2. BIẾN THỂ SẢN PHẨM                                                */
/* ------------------------------------------------------------------ */

export interface OptionValue {
  value: string;
  stock: number;
}

export interface ProductOptions {
  sizes: OptionValue[];
  colors: OptionValue[];
  hasVariants: boolean;
}

/** Gom các biến thể thành danh sách size / màu kèm tồn kho cộng dồn */
export function getProductOptions(variants?: ProductVariant[]): ProductOptions {
  if (!variants || variants.length === 0) {
    return { sizes: [], colors: [], hasVariants: false };
  }
  const sizeMap = new Map<string, number>();
  const colorMap = new Map<string, number>();
  variants.forEach((v) => {
    if (v.size) sizeMap.set(v.size, (sizeMap.get(v.size) || 0) + (v.stockQuantity || 0));
    if (v.color) colorMap.set(v.color, (colorMap.get(v.color) || 0) + (v.stockQuantity || 0));
  });
  return {
    sizes: Array.from(sizeMap, ([value, stock]) => ({ value, stock })),
    colors: Array.from(colorMap, ([value, stock]) => ({ value, stock })),
    hasVariants: true,
  };
}

/** Tìm biến thể khớp size + màu đang chọn (ưu tiên khớp cả 2) */
export function findVariant(
  variants: ProductVariant[] | undefined,
  size?: string,
  color?: string
): ProductVariant | undefined {
  if (!variants || variants.length === 0) return undefined;
  return (
    variants.find((v) => (!size || v.size === size) && (!color || v.color === color)) ||
    variants.find((v) => (size && v.size === size) || (color && v.color === color))
  );
}

/**
 * Chuỗi phân loại gửi lên Backend (OrderItem.Specs).
 * Backend dò biến thể bằng cách tìm Size/Color nằm trong chuỗi này, nên giữ nguyên giá trị gốc.
 */
export function buildSpecs(color?: string, size?: string): string {
  const parts: string[] = [];
  if (color) parts.push(`Màu ${color}`);
  if (size) parts.push(`Size ${size}`);
  return parts.length > 0 ? parts.join(', ') : 'Tiêu chuẩn';
}

/** Bảng mã màu hiển thị cho các tên màu phổ biến (fallback xám) */
const COLOR_HEX: Record<string, string> = {
  black: '#111827', đen: '#111827', noir: '#111827', onyx: '#111827',
  white: '#F8FAFC', trắng: '#F8FAFC', ivory: '#F5F0E6', cream: '#E5E0D8', kem: '#E5E0D8',
  beige: '#D6C7A8', be: '#D6C7A8', brown: '#78350F', nâu: '#78350F', camel: '#B07A45', tan: '#C19A6B',
  gray: '#9CA3AF', grey: '#9CA3AF', xám: '#9CA3AF', charcoal: '#374151',
  red: '#DC2626', đỏ: '#DC2626', burgundy: '#7F1D1D', pink: '#F472B6', hồng: '#F472B6',
  blue: '#2563EB', 'xanh dương': '#2563EB', navy: '#1E3A8A', green: '#16A34A', 'xanh lá': '#16A34A',
  olive: '#4D5D2C', yellow: '#FACC15', vàng: '#FACC15', gold: '#D4AF37', silver: '#C0C0C0',
  orange: '#F97316', cam: '#F97316', purple: '#7C3AED', tím: '#7C3AED',
};

export function colorToHex(color: string): string {
  const key = color.toLowerCase();
  const hit = Object.keys(COLOR_HEX).find((k) => key.includes(k));
  return hit ? COLOR_HEX[hit] : '#CBD5E1';
}

/* ------------------------------------------------------------------ */
/* 3. BỘ MÁY GỢI Ý CÁ NHÂN HÓA                                         */
/* ------------------------------------------------------------------ */

export interface ScoredProduct<T> {
  product: T;
  score: number;
  reason: string;
}

/**
 * Chấm điểm sản phẩm dựa trên tín hiệu hành vi của khách:
 *  - Danh mục & thương hiệu của sản phẩm đã xem (trọng số giảm dần theo độ cũ)
 *  - Danh mục & thương hiệu trong danh sách yêu thích (trọng số cao hơn)
 *  - Khoảng giá quen thuộc của khách
 *  - Chất lượng: điểm đánh giá, độ phổ biến, mức giảm giá, còn hàng
 * Sản phẩm đã xem / đã thích bị loại để luôn gợi ý cái mới.
 */
export function recommendProducts<T extends AnyProduct>(
  catalog: T[],
  signals: { viewed: AnyProduct[]; wishlist: AnyProduct[]; excludeIds?: number[] },
  limit = 8
): ScoredProduct<T>[] {
  const { viewed, wishlist, excludeIds = [] } = signals;
  const seen = new Set<number>([...excludeIds, ...viewed.map((p) => p.id), ...wishlist.map((p) => p.id)]);

  const catWeight = new Map<number, number>();
  const brandWeight = new Map<string, number>();
  const prices: number[] = [];

  const absorb = (list: AnyProduct[], base: number) => {
    list.forEach((p, idx) => {
      const w = base * Math.pow(0.85, idx); // tín hiệu mới quan trọng hơn
      catWeight.set(p.categoryId, (catWeight.get(p.categoryId) || 0) + w);
      const brand = extractBrand(p);
      if (brand) brandWeight.set(brand, (brandWeight.get(brand) || 0) + w);
      prices.push(p.basePrice);
    });
  };
  absorb(viewed, 1);
  absorb(wishlist, 1.6);

  const hasSignals = prices.length > 0;
  const avgPrice = hasSignals ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  const maxReviews = Math.max(1, ...catalog.map((p) => p.reviewCount || 0));

  const scored = catalog
    .filter((p) => !seen.has(p.id) && (p.stockQuantity ?? 1) > 0)
    .map((p) => {
      const brand = extractBrand(p);
      const cat = catWeight.get(p.categoryId) || 0;
      const br = brand ? brandWeight.get(brand) || 0 : 0;
      const priceFit = hasSignals && avgPrice > 0
        ? Math.max(0, 1 - Math.abs(p.basePrice - avgPrice) / avgPrice)
        : 0;
      const quality =
        ((p.rating || 0) / 5) * 0.6 +
        ((p.reviewCount || 0) / maxReviews) * 0.3 +
        Math.min(p.discountPercent || 0, 50) / 50 * 0.1;

      const score = cat * 2 + br * 2.5 + priceFit * 1.2 + quality;

      let reason = 'Được đánh giá cao trên sàn';
      if (br > 0 && br >= cat) reason = `Vì bạn quan tâm ${brand}`;
      else if (cat > 0) reason = `Cùng nhóm ${p.categoryName || 'sản phẩm'} bạn đã xem`;
      else if (priceFit > 0.75) reason = 'Hợp tầm giá bạn thường chọn';
      else if ((p.discountPercent || 0) >= 15) reason = `Đang giảm ${p.discountPercent}%`;

      return { product: p, score, reason };
    });

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Sản phẩm tương tự cho trang chi tiết: cùng danh mục / thương hiệu / tầm giá */
export function similarProducts<T extends AnyProduct>(catalog: T[], current: AnyProduct, limit = 4): T[] {
  const brand = extractBrand(current);
  return catalog
    .filter((p) => p.id !== current.id)
    .map((p) => {
      let score = 0;
      if (p.categoryId === current.categoryId) score += 3;
      if (brand && extractBrand(p) === brand) score += 2;
      if (current.basePrice > 0) {
        score += Math.max(0, 1 - Math.abs(p.basePrice - current.basePrice) / current.basePrice);
      }
      score += (p.rating || 0) / 10;
      return { p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.p);
}

/* ------------------------------------------------------------------ */
/* 4. ĐƠN HÀNG                                                         */
/* ------------------------------------------------------------------ */

/** Ngưỡng & tỷ lệ khớp với OrderService.CreateOrderAsync (Backend) */
export const FREE_SHIPPING_THRESHOLD = 10_000_000;
export const SHIPPING_FEE = 50_000;
export const VAT_RATE = 0.08;

export function calcOrderTotals(subtotal: number) {
  const shipping = subtotal > FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FEE;
  const taxes = Math.round(subtotal * VAT_RATE);
  return { subtotal, shipping, taxes, total: subtotal + shipping + taxes };
}

/** SĐT Việt Nam: 0xxxxxxxxx hoặc +84xxxxxxxxx (đầu số 3,5,7,8,9) */
export function isValidVNPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s.-]/g, '');
  return /^(0|\+84|84)(3|5|7|8|9)\d{8}$/.test(cleaned);
}

export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[\s.-]/g, '');
  if (cleaned.startsWith('+84')) return '0' + cleaned.slice(3);
  if (cleaned.startsWith('84') && cleaned.length === 11) return '0' + cleaned.slice(2);
  return cleaned;
}

/** Chuẩn hóa trạng thái từ Backend ("Pending") về dạng IN HOA */
export function normalizeStatus(status?: string): string {
  return (status || 'PENDING').toUpperCase();
}

export const CUSTOMER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PROCESSING: 'Đang đóng gói',
  SHIPPED: 'Đang giao hàng',
  SHIPPING: 'Đang giao hàng',
  DELIVERED: 'Đã giao thành công',
  COMPLETED: 'Đã giao thành công',
  CANCELLED: 'Đã hủy',
};

/** Các mốc hiển thị trên timeline của khách */
export const CUSTOMER_ORDER_STEPS = [
  { key: 'PENDING', title: 'Đặt hàng thành công', desc: 'Sàn đã tiếp nhận đơn hàng của bạn' },
  { key: 'CONFIRMED', title: 'Shop xác nhận', desc: 'Boutique kiểm tra hàng chính hãng & tồn kho' },
  { key: 'PROCESSING', title: 'Đóng gói', desc: 'Đóng hộp quà cao cấp, niêm phong seal' },
  { key: 'SHIPPED', title: 'Đang vận chuyển', desc: 'Đơn vị vận chuyển đang giao tới bạn' },
  { key: 'DELIVERED', title: 'Giao thành công', desc: 'Bạn đã nhận được kiện hàng' },
];

/** Vị trí bước hiện tại (0-based) trên timeline. -1 nếu đơn đã hủy */
export function statusToStepIndex(status?: string): number {
  const s = normalizeStatus(status);
  if (s === 'CANCELLED') return -1;
  if (s === 'SHIPPING') return 3;
  if (s === 'COMPLETED') return 4;
  const idx = CUSTOMER_ORDER_STEPS.findIndex((step) => step.key === s);
  return idx < 0 ? 0 : idx;
}

export function formatDateTimeVN(value?: string): string {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Thông điệp lỗi thân thiện từ lỗi axios / Backend GlobalExceptionMiddleware */
export function getErrorMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message || fallback;
}
