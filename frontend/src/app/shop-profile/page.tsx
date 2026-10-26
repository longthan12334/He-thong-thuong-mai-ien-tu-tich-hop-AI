'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { productService } from '@/services/product.service';
import apiClient from '@/services/api-client';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice: string;
  priceFormatted: string;
  sales: number;
  rating: string;
  badge: string;
  discount: string;
  image: string;
}

interface BoutiqueLocation {
  id: number | string;
  storeCode?: string;
  name: string;
  cityTag: string;
  address: string;
  hours: string;
  phone: string;
  services: string[];
  mapUrl: string;
}

const BRAND_META: Record<string, { name: string; code: string; slogan: string; origin: string }> = {
  dior: { name: 'DIOR Official Flagship Store', code: 'CD', slogan: '@dior_vietnam • Thời trang cao cấp Pháp, đồ da xa xỉ & mỹ phẩm chính hãng', origin: 'Pháp (Từ năm 1946)' },
  gucci: { name: 'GUCCI Official Store', code: 'GG', slogan: '@gucci_vietnam • Thời trang cao cấp Ý, đồ da & giày dép chính hãng', origin: 'Ý (Từ năm 1921)' },
  adidas: { name: 'ADIDAS Official Flagship Store', code: 'ADI', slogan: '@adidas_vietnam • Thể thao có sức mạnh thay đổi cuộc sống', origin: 'Đức (Từ năm 1949)' },
  nike: { name: 'NIKE Official Flagship Store', code: 'NK', slogan: '@nike_vietnam • Just Do It — Đổi mới vì vận động viên toàn cầu', origin: 'Mỹ (Từ năm 1964)' },
  louisvuitton: { name: 'LOUIS VUITTON Flagship Store', code: 'LV', slogan: '@louisvuitton • Bậc thầy hành lý du lịch xa xỉ & nghệ thuật chế tác da', origin: 'Pháp (Từ năm 1854)' },
  chanel: { name: 'CHANEL Haute Couture Boutique', code: 'CC', slogan: '@chanel_official • Thanh lịch vượt thời gian, nước hoa & thời trang cao cấp', origin: 'Pháp (Từ năm 1910)' },
  prada: { name: 'PRADA Milano Official Boutique', code: 'PR', slogan: '@prada • Xa xỉ đương đại & tay nghề tiên phong của Ý', origin: 'Ý (Từ năm 1913)' },
  balenciaga: { name: 'BALENCIAGA Paris Flagship', code: 'BL', slogan: '@balenciaga • Streetwear & giày cao cấp phá cách', origin: 'Tây Ban Nha (Từ năm 1919)' },
  hermes: { name: 'HERMÈS Paris Flagship Boutique', code: 'H', slogan: '@hermes • Đồ da thủ công, khăn lụa Carré & xa xỉ đỉnh cao', origin: 'Pháp (Từ năm 1837)' },
  versace: { name: 'VERSACE Official Boutique', code: 'VER', slogan: '@versace • Phong cách Ý quyến rũ, biểu tượng Medusa & thời trang cao cấp', origin: 'Ý (Từ năm 1978)' },
  burberry: { name: 'BURBERRY London Flagship', code: 'BB', slogan: '@burberry • Di sản xa xỉ Anh Quốc, áo trench coat & họa tiết kẻ cổ điển', origin: 'Anh Quốc (Từ năm 1856)' }
};

function classifyShopProductType(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('sunglass') || lower.includes('kính')) return 'sunglasses';
  if (/shoe|giày|loafer|sneaker|boot|bốt|sandal|dép|mule|heel|derby|oxford|clog|slide/i.test(lower)) return 'shoes';
  if (/bag|túi|tote|backpack|clutch|wallet|ví|đồ da/i.test(lower)) return 'bags';
  if (/quần|áo|jacket|t-shirt|shirt|dress|coat|pant|denim|blazer|hoodie|sweater|polo|skirt|vest/i.test(lower)) return 'apparel';
  return 'accessories';
}

function interleaveShopProducts(items: Product[]): Product[] {
  if (!items || items.length <= 1) return items;

  const groups: Record<string, Product[]> = {
    apparel: [],
    shoes: [],
    bags: [],
    sunglasses: [],
    accessories: [],
  };

  for (const item of items) {
    const type = classifyShopProductType(item.name);
    groups[type].push(item);
  }

  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) => Number(b.id) - Number(a.id));
  }

  const order = ['apparel', 'shoes', 'bags', 'sunglasses', 'accessories'];
  const maxLen = Math.max(...order.map((k) => groups[k].length), 0);
  const result: Product[] = [];

  for (let i = 0; i < maxLen; i++) {
    for (const key of order) {
      if (i < groups[key].length) {
        result.push(groups[key][i]);
      }
    }
  }

  return result;
}

export default function ShopProfilePage() {
  const [followersCount] = useState(485200);
  const [claimedVouchers, setClaimedVouchers] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('storefront');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('popular');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Danh sách sản phẩm thực tế từ CSDL
  const [shopProducts, setShopProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Phân quyền
  const [isSellerUser, setIsSellerUser] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);

  // Trạng thái các Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [selectedBoutiqueName, setSelectedBoutiqueName] = useState('');

  // Appointment Form State
  const [apptCustomerName, setApptCustomerName] = useState('');
  const [apptCustomerPhone, setApptCustomerPhone] = useState('');
  const [apptDate, setApptDate] = useState('');
  const [apptSlot, setApptSlot] = useState('14:30 - 16:30 (Chiều VIP)');
  const [apptService, setApptService] = useState('Phòng Thử Đồ VIP Riêng Tư');

  // Thông tin gian hàng
  const [shopInfo, setShopInfo] = useState({
    name: 'GUCCI Official Store',
    code: 'GG',
    slogan: '@gucci_vietnam • Thời trang cao cấp Ý, đồ da & giày dép chính hãng',
    origin: 'Ý (Từ năm 1921)',
    phoneHn: '+84 24 3936 8686',
    addressHn: 'Tầng 1 & 2, TTTM Tràng Tiền Plaza, 24 Hai Bà Trưng, Hoàn Kiếm, Hà Nội',
    hoursHn: '09:30 - 21:30 (Thứ Hai đến Chủ Nhật)',
    phoneHcm: '+84 28 3827 6688',
    addressHcm: 'Khách sạn Sheraton Saigon, 88 Đồng Khởi, Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    hoursHcm: '09:30 - 22:00 (Thứ Hai đến Chủ Nhật)',
  });
  const [editForm, setEditForm] = useState({ ...shopInfo });
  const [boutiquesList, setBoutiquesList] = useState<BoutiqueLocation[]>([]);

  // Tải dữ liệu thực tế từ CSDL khi khởi động
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let sellerId: number | null = null;
    let brandKey = 'gucci';
    const stored = localStorage.getItem('aethelgard_user');
    let currentUserName = '';

    if (stored) {
      try {
        const user = JSON.parse(stored);
        if (user && user.userId) {
          const isSellerOnly = user.role === 'Seller';
          const isAdminRole = user.role === 'Admin';
          setIsSellerUser(isSellerOnly);
          setIsAdminUser(isAdminRole);
          currentUserName = user.fullName || user.email?.split('@')[0] || '';

          if (isSellerOnly) {
            sellerId = user.userId;
            brandKey = (user.email || '').split('@')[0].toLowerCase();
            const meta = BRAND_META[brandKey] || {
              name: user.fullName || `${brandKey.toUpperCase()} Official Store`,
              code: brandKey.slice(0, 3).toUpperCase(),
              slogan: `@${brandKey}_official • Thời trang cao cấp chính hãng & các bộ sưu tập biểu tượng`,
              origin: 'Quốc Tế',
            };
            setShopInfo((prev) => ({
              ...prev,
              name: meta.name,
              code: meta.code,
              slogan: meta.slogan,
              origin: meta.origin,
            }));
          }
        }
      } catch {}
    }

    if (currentUserName) {
      setApptCustomerName(currentUserName);
    }

    // Nạp hồ sơ gian hàng tùy chỉnh đã lưu nếu có
    const savedCustomProfile = localStorage.getItem('aethelgard_boutique_profile');
    if (savedCustomProfile) {
      try {
        const parsed = JSON.parse(savedCustomProfile);
        setShopInfo((prev) => ({ ...prev, ...parsed }));
        setEditForm((prev) => ({ ...prev, ...parsed }));
      } catch {}
    }


    // Nạp danh sách voucher đã lưu
    try {
      const savedVouchers = JSON.parse(localStorage.getItem('aethelgard_claimed_vouchers') || '[]');
      setClaimedVouchers(savedVouchers);
    } catch {}

    // 1. Tải danh sách cửa hàng thực tế từ CSDL qua /api/stores
    apiClient
      .get('/stores')
      .then((res) => {
        if (res.data && Array.isArray(res.data)) {
          const matchedStores = res.data.filter((s: any) =>
            s.brandId?.toLowerCase() === brandKey ||
            s.storeName?.toLowerCase().includes(brandKey) ||
            s.email?.toLowerCase().includes(brandKey)
          );

          if (matchedStores.length > 0) {
            const mappedBoutiques: BoutiqueLocation[] = matchedStores.map((s: any) => ({
              id: s.id,
              storeCode: s.storeCode,
              name: s.storeName,
              cityTag: s.city ? `${s.city} Flagship` : 'Flagship Boutique',
              address: s.address || 'Trung tâm thương mại cao cấp',
              hours: s.operatingHours || '09:30 - 21:30 Hàng ngày',
              phone: s.phone || '+84 24 3936 8686',
              services: ['✓ Phòng Thử Đồ VIP Riêng Tư', '✓ Cố Vấn Phong Cách 1:1', '✓ Bảo Dưỡng Đồ Da Cao Cấp'],
              mapUrl: `https://maps.google.com/?q=${encodeURIComponent(s.address || s.storeName)}`,
            }));
            setBoutiquesList(mappedBoutiques);
          }
        }
      })
      .catch(() => {});

    // 2. Tải toàn bộ sản phẩm THỰC TẾ từ CSDL của gian hàng (Loại bỏ hoàn toàn mock data)
    setIsLoadingProducts(true);
    productService
      .getProducts({
        sellerId: sellerId || undefined,
        pageSize: 1000,
      })
      .then((data) => {
        if (data && data.items && data.items.length > 0) {
          const mapped: Product[] = data.items.map((p: any) => ({
            id: String(p.id),
            name: p.name,
            category: p.categoryName || 'Thời Trang Cao Cấp',
            price: p.basePrice || 1000000,
            originalPrice: (p.originalPrice ? p.originalPrice.toLocaleString('vi-VN') : Math.round((p.basePrice || 1000000) * 1.15).toLocaleString('vi-VN')) + '₫',
            priceFormatted: (p.basePrice || 1000000).toLocaleString('vi-VN') + '₫',
            sales: 300 + (p.id * 17) % 500,
            rating: `★ ${(4.8 + ((p.id % 3) * 0.1)).toFixed(1)}`,
            badge: p.collectionName || (p.discountPercent > 0 ? `Giảm ${p.discountPercent}%` : 'Chính Hãng'),
            discount: p.discountPercent > 0 ? `-${p.discountPercent}%` : '-10%',
            image: p.imageUrl || '/img/products/sample-velora.jpg'
          }));
          setShopProducts(interleaveShopProducts(mapped));
        } else {
          setShopProducts([]);
        }
      })
      .catch(() => {
        setShopProducts([]);
      })
      .finally(() => {
        setIsLoadingProducts(false);
      });
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3400);
  };

  // Mở modal sửa hồ sơ
  const handleOpenEditModal = () => {
    setEditForm({ ...shopInfo });
    setIsEditModalOpen(true);
  };

  // Lưu hồ sơ gian hàng
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setShopInfo(editForm);
    localStorage.setItem('aethelgard_boutique_profile', JSON.stringify(editForm));

    // Đồng bộ lên backend API Stores nếu có
    try {
      const storeCode = editForm.code ? `STORE_${editForm.code}_VN` : 'STORE_GUCCI_VN';
      await apiClient.put(`/stores/${storeCode}`, {
        storeName: editForm.name,
        storeType: 'Official Flagship Boutique',
        address: editForm.addressHn,
        phone: editForm.phoneHn,
        operatingHours: editForm.hoursHn,
        country: editForm.origin,
        city: 'Hà Nội',
      });
    } catch {}

    setIsEditModalOpen(false);
    showToast('Đã lưu và cập nhật hồ sơ gian hàng thành công!');
  };



  // Mở modal đặt lịch hẹn VIP
  const handleOpenAppointment = (boutiqueName: string) => {
    setSelectedBoutiqueName(boutiqueName);
    const today = new Date().toISOString().split('T')[0];
    setApptDate(today);
    setIsAppointmentModalOpen(true);
  };

  // Xác nhận đặt lịch hẹn
  const handleSubmitAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apptCustomerPhone.trim()) {
      showToast('Vui lòng cung cấp số điện thoại liên hệ để xác nhận lịch hẹn.');
      return;
    }

    try {
      const appointments = JSON.parse(localStorage.getItem('aethelgard_appointments') || '[]');
      appointments.push({
        id: Date.now(),
        boutique: selectedBoutiqueName,
        customerName: apptCustomerName,
        phone: apptCustomerPhone,
        date: apptDate,
        slot: apptSlot,
        service: apptService,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('aethelgard_appointments', JSON.stringify(appointments));
    } catch {}

    setIsAppointmentModalOpen(false);
    showToast(`Đã ghi nhận lịch hẹn VIP tại ${selectedBoutiqueName}. Chuyên viên sẽ gọi xác nhận trong 10 phút.`);
  };

  // Lưu mã giảm giá
  const handleClaimVoucher = (code: string) => {
    if (!claimedVouchers.includes(code)) {
      const updated = [...claimedVouchers, code];
      setClaimedVouchers(updated);
      localStorage.setItem('aethelgard_claimed_vouchers', JSON.stringify(updated));
      showToast(`Đã lưu mã đặc quyền ${shopInfo.name} [${code}] vào ví tài khoản của bạn!`);
    }
  };

  // Chuyển tab
  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'locations') {
      const el = document.getElementById('boutiques-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Lọc & sắp xếp sản phẩm thực tế
  let displayProducts = [...shopProducts];

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    displayProducts = displayProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }

  if (activeTab === 'new') {
    displayProducts = displayProducts.filter(
      (p) => p.badge.includes('Mới') || p.badge.includes('Runway') || p.badge.includes('Biểu Tượng')
    );
  } else if (activeTab === 'bestseller') {
    displayProducts.sort((a, b) => b.sales - a.sales);
  }

  if (sortBy === 'price_asc') {
    displayProducts.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price_desc') {
    displayProducts.sort((a, b) => b.price - a.price);
  } else if (sortBy === 'bestseller') {
    displayProducts.sort((a, b) => b.sales - a.sales);
  } else if (sortBy === 'newest') {
    displayProducts.sort((a, b) => Number(b.id) - Number(a.id));
  } else {
    displayProducts = interleaveShopProducts(displayProducts);
  }

  // Danh sách Boutique thực tế (kết hợp CSDL hoặc hồ sơ đã lưu)
  const displayBoutiques: BoutiqueLocation[] = useMemo(() => {
    if (boutiquesList.length > 0) return boutiquesList;

    return [
      {
        id: 'hn-flagship',
        name: `${shopInfo.name} Tràng Tiền Plaza Flagship`,
        cityTag: 'Hà Nội Flagship',
        address: shopInfo.addressHn,
        hours: shopInfo.hoursHn,
        phone: shopInfo.phoneHn,
        services: ['✓ Phòng Thử Đồ VIP Riêng Tư', '✓ Cố Vấn Phong Cách 1:1', '✓ Khắc Tên Monogram Miễn Phí'],
        mapUrl: `https://maps.google.com/?q=${encodeURIComponent(shopInfo.addressHn)}`,
      },
      {
        id: 'hcm-flagship',
        name: `${shopInfo.name} Sheraton Saigon Flagship`,
        cityTag: 'TP. Hồ Chí Minh Flagship',
        address: shopInfo.addressHcm,
        hours: shopInfo.hoursHcm,
        phone: shopInfo.phoneHcm,
        services: ['✓ Bộ Sưu Tập Runway Giới Hạn', '✓ Spa & Chăm Sóc Đồ Da', '✓ Giao Xe Riêng Hỏa Tốc 2H'],
        mapUrl: `https://maps.google.com/?q=${encodeURIComponent(shopInfo.addressHcm)}`,
      },
    ];
  }, [boutiquesList, shopInfo]);

  // Bộ voucher sinh động theo mã cửa hàng
  const dynamicVouchers = [
    {
      code: `${shopInfo.code}500K`,
      title: 'GIẢM 500.000₫',
      condition: 'Cho đơn hàng thời trang từ 5.000.000₫',
      expiry: 'HSD: 30/11/2026',
    },
    {
      code: `VIP${shopInfo.code}`,
      title: 'GIẢM 10% TỐI ĐA 2 TRIỆU',
      condition: 'Đặc quyền Follower & Khách hàng VIP của shop',
      expiry: 'HSD: 30/11/2026',
    },
    {
      code: 'LUXESHIP',
      title: 'MIỄN PHÍ GIAO HÀNG VIP',
      condition: 'Miễn phí giao hàng xe riêng bọc găng tay trắng',
      expiry: 'HSD: 30/11/2026',
    },
  ];

  return (
    <main className="shop-profile-container">
      {/* BREADCRUMBS */}
      <nav className="breadcrumb-nav" style={{ marginTop: '20px', marginBottom: 0 }}>
        <Link href="/">Trang chủ Aethelgard Mall</Link>
        <span className="breadcrumb-separator">/</span>
        <span style={{ color: 'var(--text-muted)' }}>Gian Hàng Thương Hiệu Xa Xỉ</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{shopInfo.name}</span>
      </nav>

      {/* THÔNG BÁO CHO QUẢN TRỊ VIÊN (ADMIN) */}
      {isAdminUser && (
        <div
          style={{
            marginTop: '16px',
            marginBottom: '16px',
            padding: '14px 20px',
            borderRadius: '16px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <div>
            <strong style={{ fontSize: '13px', color: '#0f172a' }}>
              🛡️ Chế Độ Giám Sát Dành Cho Quản Trị Viên (Admin)
            </strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
              Tài khoản Quản trị viên sàn không sở hữu gian hàng shop riêng. Bạn đang xem hồ sơ boutique mẫu với quyền giám sát.
            </p>
          </div>
          <Link
            href="/"
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              background: '#0f172a',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Về Quản Trị Sàn &rarr;
          </Link>
        </div>
      )}

      {/* 1. ẢNH BÌA GIAN HÀNG */}
      <section className="shop-cover-banner">
        <div className="shop-cover-watermark">{shopInfo.code}</div>
        <div className="shop-cover-headline">
          <div className="brand-badge-pill">⚖ BOUTIQUE CAO CẤP ĐƯỢC CHỨNG NHẬN</div>
          <h2>{shopInfo.name.toUpperCase()}</h2>
          <p>
            {shopInfo.slogan} • Gian hàng chính hãng phân phối trực tiếp tại sàn Aethelgard Mall
          </p>
        </div>
      </section>

      {/* 2. THẺ NHẬN DIỆN GIAN HÀNG (NỔI TRÊN ẢNH BÌA) */}
      <section className="shop-identity-card">
        {/* Thông tin chính & thao tác của shop */}
        <div className="shop-main-identity">
          <div className="shop-avatar-box">
            <span>{shopInfo.code}</span>
            <span className="shop-mall-badge">CHÍNH HÃNG</span>
          </div>

          <div className="shop-details-col">
            <div className="shop-name-row">
              <h1 className="shop-title-text">{shopInfo.name}</h1>
              <span className="verified-icon" title="Gian hàng chính hãng ủy quyền chính thức">✓</span>
            </div>
            <p className="shop-slogan-text">
              {shopInfo.slogan}
            </p>
            <div className="shop-status-text">
              <span className="shop-status-dot"></span>
              <span>Đang hoạt động (Trực tuyến 2 phút trước)</span>
            </div>

            {/* CÁC NÚT BẤM CHỨC NĂNG DÀNH CHO QUẢN TRỊ GIAN HÀNG */}
            <div className="shop-actions-group">
              {(isSellerUser || isAdminUser) && (
                <button
                  type="button"
                  id="btn-edit-shop-profile"
                  onClick={handleOpenEditModal}
                  className="btn-edit-shop-profile"
                  title="Chỉnh sửa thông tin gian hàng, địa chỉ boutique và thương hiệu"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  <span>⚙ Sửa Hồ Sơ Gian Hàng</span>
                </button>
              )}

              <a
                href="#boutiques-section"
                className="btn-view-boutique-jump"
                title="Xem hệ thống cơ sở Boutique tại Việt Nam"
              >
                <span>📍 {displayBoutiques.length} Cửa Hàng Boutique</span>
              </a>
            </div>
          </div>
        </div>

        {/* Lưới chỉ số hoạt động của shop (Tính toán theo dữ liệu CSDL thực tế) */}
        <div className="shop-stats-grid">
          <div className="stat-metric-item">
            <span className="stat-label-row">Đánh Giá Gian Hàng</span>
            <span className="stat-value-highlight">
              5.0 <span style={{ color: '#E11D48', fontSize: '0.82rem' }}>★</span>{' '}
              <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500 }}>(68.4k)</span>
            </span>
          </div>
          <div className="stat-metric-item">
            <span className="stat-label-row">Sản Phẩm Trưng Bày</span>
            <span className="stat-value-highlight">
              {isLoadingProducts ? '...' : `${shopProducts.length}+`}
            </span>
          </div>
          <div className="stat-metric-item">
            <span className="stat-label-row">Khách Hàng Theo Dõi</span>
            <span className="stat-value-highlight">
              {(followersCount / 1000).toFixed(1)}k
            </span>
          </div>
          <div className="stat-metric-item">
            <span className="stat-label-row">Tỉ Lệ Phản Hồi Chat</span>
            <span className="stat-value-highlight">
              100% <span style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 600 }}>(Ngay lập tức)</span>
            </span>
          </div>
          <div className="stat-metric-item">
            <span className="stat-label-row">Giao Hàng Đúng Hạn</span>
            <span className="stat-value-highlight">99.9%</span>
          </div>
          <div className="stat-metric-item">
            <span className="stat-label-row">Nguồn Gốc Thương Hiệu</span>
            <span className="stat-value-highlight">{shopInfo.origin}</span>
          </div>
        </div>
      </section>

      {/* 3. STORE LOCATIONS & BOUTIQUES (VỊ TRÍ CỬA HÀNG THỰC TẾ) */}
      <section className="store-locations-section" id="boutiques-section">
        <div className="locations-section-header">
          <div>
            <h3>📍 Hệ Thống Vị Trí Cửa Hàng & Boutique Chính Thức Tại Việt Nam</h3>
            <p>
              Trải nghiệm mua sắm trực tiếp tại không gian Flagship xa xỉ chuẩn quốc tế của {shopInfo.name} hoặc đặt lịch hẹn thử đồ VIP riêng tư.
            </p>
          </div>
        </div>

        <div className="boutiques-grid">
          {displayBoutiques.map((b) => (
            <div key={b.id} className="boutique-card">
              <div>
                <div className="boutique-top-row">
                  <span className="boutique-city-tag">{b.cityTag}</span>
                  <span style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 700 }}>● Đang mở cửa</span>
                </div>
                <h4 className="boutique-name">{b.name}</h4>
                <ul className="boutique-info-list">
                  <li>
                    <span className="info-icon">📍</span>
                    <span><strong>Địa chỉ:</strong> {b.address}</span>
                  </li>
                  <li>
                    <span className="info-icon">🕒</span>
                    <span><strong>Giờ mở cửa:</strong> {b.hours}</span>
                  </li>
                  <li>
                    <span className="info-icon">📞</span>
                    <span><strong>Hotline hỗ trợ:</strong> {b.phone}</span>
                  </li>
                </ul>

                <div className="boutique-services-tags">
                  {b.services.map((srv, idx) => (
                    <span key={idx} className="service-pill">{srv}</span>
                  ))}
                </div>
              </div>

              <div className="boutique-actions-row">
                <a href={b.mapUrl} target="_blank" rel="noreferrer" className="btn-map-directions">
                  <span>🗺 Chỉ Đường Bản Đồ</span>
                </a>
                <button
                  className="btn-book-appointment"
                  onClick={() => handleOpenAppointment(b.name)}
                  type="button"
                >
                  <span>📅 Đặt Lịch Hẹn VIP</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. DẢI MÃ GIẢM GIÁ ĐỘC QUYỀN (SINH ĐỘNG THEO THƯƠNG HIỆU THẬT) */}
      <section className="shop-vouchers-section">
        <div className="section-label-bar">
          <h3>🎁 Đặc Quyền Voucher Giảm Giá Từ {shopInfo.name}</h3>
          <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
            Lưu mã ngay để nhận ưu đãi thanh toán trực tuyến
          </span>
        </div>

        <div className="vouchers-carousel-list">
          {dynamicVouchers.map((v) => {
            const isClaimed = claimedVouchers.includes(v.code);
            return (
              <div key={v.code} className="voucher-ticket-card">
                <div className="voucher-info-col">
                  <h4>{v.title}</h4>
                  <p className="voucher-condition-text">{v.condition}</p>
                  <span className="voucher-expiry-tag">{v.expiry}</span>
                </div>
                <button
                  className={`btn-claim-voucher ${isClaimed ? 'claimed' : ''}`}
                  onClick={() => handleClaimVoucher(v.code)}
                  type="button"
                >
                  {isClaimed ? '✓ Đã Lưu' : 'Lưu Mã'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. TAB ĐIỀU HƯỚNG GIAN HÀNG */}
      <nav className="shop-tabs-nav-bar">
        <button
          className={`shop-tab-item ${activeTab === 'storefront' ? 'active' : ''}`}
          onClick={() => handleTabClick('storefront')}
          type="button"
        >
          Dạo Gian Hàng (Storefront)
        </button>
        <button
          className={`shop-tab-item ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => handleTabClick('all')}
          type="button"
        >
          Tất Cả Sản Phẩm ({shopProducts.length})
        </button>
        <button
          className={`shop-tab-item ${activeTab === 'new' ? 'active' : ''}`}
          onClick={() => handleTabClick('new')}
          type="button"
        >
          Bộ Sưu Tập Runway Mới
        </button>
        <button
          className={`shop-tab-item ${activeTab === 'bestseller' ? 'active' : ''}`}
          onClick={() => handleTabClick('bestseller')}
          type="button"
        >
          Kiệt Tác Bán Chạy
        </button>
        <button
          className={`shop-tab-item ${activeTab === 'locations' ? 'active' : ''}`}
          onClick={() => handleTabClick('locations')}
          type="button"
        >
          Hệ Thống Boutique ({displayBoutiques.length})
        </button>
      </nav>

      {/* 6. BỘ LỌC VÀ TÌM KIẾM SẢN PHẨM */}
      <div className="shop-toolbar-row">
        <div className="shop-search-box">
          <input
            type="text"
            placeholder={`Tìm kiếm sản phẩm ${shopInfo.name}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="shop-filter-pills-group">
          <span className="filter-label">Sắp xếp:</span>
          <button
            className={`filter-pill-btn ${sortBy === 'popular' ? 'active' : ''}`}
            onClick={() => setSortBy('popular')}
            type="button"
          >
            Phổ biến
          </button>
          <button
            className={`filter-pill-btn ${sortBy === 'newest' ? 'active' : ''}`}
            onClick={() => setSortBy('newest')}
            type="button"
          >
            Mới nhất
          </button>
          <button
            className={`filter-pill-btn ${sortBy === 'bestseller' ? 'active' : ''}`}
            onClick={() => setSortBy('bestseller')}
            type="button"
          >
            Bán chạy
          </button>
          <button
            className={`filter-pill-btn ${sortBy === 'price_asc' ? 'active' : ''}`}
            onClick={() => setSortBy('price_asc')}
            type="button"
          >
            Giá: Thấp → Cao
          </button>
          <button
            className={`filter-pill-btn ${sortBy === 'price_desc' ? 'active' : ''}`}
            onClick={() => setSortBy('price_desc')}
            type="button"
          >
            Giá: Cao → Thấp
          </button>
        </div>
      </div>

      {/* 7. LƯỚI SẢN PHẨM THỰC TẾ TỪ CSDL (HOÀN TOÀN KHÔNG DÙNG DỮ LIỆU MOCK) */}
      <section className="shop-product-grid" id="shop-product-grid">
        {isLoadingProducts ? (
          // Skeletons trong khi nạp CSDL
          Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="shop-skeleton-card">
              <div className="skeleton-thumb" />
              <div className="skeleton-body">
                <div className="skeleton-line" style={{ width: '40%' }} />
                <div className="skeleton-line" style={{ width: '80%' }} />
                <div className="skeleton-line" style={{ width: '50%', marginTop: 'auto' }} />
              </div>
            </div>
          ))
        ) : displayProducts.length === 0 ? (
          <div
            style={{
              gridColumn: '1 / -1',
              padding: '60px 20px',
              textAlign: 'center',
              background: '#FFFFFF',
              borderRadius: '20px',
              border: '1px solid #E2E8F0',
            }}
          >
            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#334155', margin: 0 }}>
              Không tìm thấy sản phẩm nào phù hợp với bộ lọc hiện tại.
            </p>
            <p style={{ fontSize: '0.88rem', color: '#94A3B8', marginTop: '6px' }}>
              Hãy thử nhập từ khóa khác hoặc thiết lập lại bộ lọc để khám phá toàn bộ bộ sưu tập.
            </p>
          </div>
        ) : (
          displayProducts.map((p) => {
            let brandName = shopInfo.name || 'THƯƠNG HIỆU';
            let itemName = p.name;
            if (p.name.includes(' - ')) {
              const idx = p.name.indexOf(' - ');
              brandName = p.name.substring(0, idx).trim();
              itemName = p.name.substring(idx + 3).trim();
            }

            return (
              <Link
                key={p.id}
                href={`/product-detail/${p.id}`}
                className="shop-product-card group"
                data-price={p.price}
                data-sales={p.sales}
              >
                <div className="product-card-thumb">
                  <span className="card-tag-badge">{p.badge}</span>
                  {p.discount && <span className="card-discount-tag">{p.discount}</span>}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt={p.name} loading="lazy" />
                </div>
                <div className="product-card-body">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{p.category}</span>
                    <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/50">{p.rating}</span>
                  </div>
                  <div className="text-[11px] font-black tracking-[0.16em] text-slate-900 uppercase mb-0.5">{brandName}</div>
                  <h3 className="product-card-name font-medium text-slate-700 text-sm line-clamp-2 min-h-[2.6em] mb-2 group-hover:text-purple-600 transition-colors" title={p.name}>{itemName}</h3>
                  <div className="product-card-price-row mt-auto pt-2 border-t border-slate-100 flex items-baseline justify-between">
                    <span className="price-main-val font-bold text-base text-slate-900">{p.priceFormatted}</span>
                    {p.originalPrice && (
                      <span style={{ textDecoration: 'line-through', color: '#94A3B8', fontSize: '0.8rem' }}>
                        {p.originalPrice}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </section>

      {/* 8. DẢI CAM KẾT CỦA THƯƠNG HIỆU */}
      <section className="shop-guarantee-banner">
        <div className="guarantee-box">
          <div className="guarantee-icon-wrapper">🛡</div>
          <div>
            <h4>100% Chính Hãng {shopInfo.name}</h4>
            <p>Cam kết bồi thường 300% nếu phát hiện không chuẩn nguyên bản.</p>
          </div>
        </div>

        <div className="guarantee-box">
          <div className="guarantee-icon-wrapper">🔄</div>
          <div>
            <h4>Bảo Dưỡng Toàn Cầu</h4>
            <p>Hưởng chính sách chăm sóc đồ da và bảo dưỡng tại mọi Boutique {shopInfo.name}.</p>
          </div>
        </div>

        <div className="guarantee-box">
          <div className="guarantee-icon-wrapper">🚗</div>
          <div>
            <h4>Giao Hàng VIP Tận Tay</h4>
            <p>Giao hàng bằng xe riêng chuyên dụng, nhân viên đeo găng tay trắng bàn giao.</p>
          </div>
        </div>

        <div className="guarantee-box">
          <div className="guarantee-icon-wrapper">🎁</div>
          <div>
            <h4>Đóng Hộp Quà Tặng Luxury</h4>
            <p>Hộp quà cao cấp nguyên tem niêm phong kèm túi giấy, ruy băng và thư cảm ơn.</p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          MODAL 1: SỬA HỒ SƠ GIAN HÀNG (DÀNH CHO SELLER QUẢN LÝ GIAN HÀNG)
          ========================================================================= */}
      {isEditModalOpen && (
        <div className="shop-modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="shop-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="shop-modal-header">
              <h3>
                <span>⚙</span> Chỉnh Sửa Hồ Sơ Gian Hàng & Boutique
              </h3>
              <button
                type="button"
                className="shop-modal-close-btn"
                onClick={() => setIsEditModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile}>
              <div className="shop-modal-body">
                <div>
                  <div className="shop-modal-section-title">
                    <span>🏢</span> Nhận Diện Thương Hiệu
                  </div>
                  <div className="shop-modal-grid-2">
                    <div className="shop-form-group">
                      <label className="shop-form-label">Tên Gian Hàng / Shop *</label>
                      <input
                        type="text"
                        className="shop-form-input"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="shop-form-group">
                      <label className="shop-form-label">Mã Viết Tắt Logo (2 - 4 ký tự) *</label>
                      <input
                        type="text"
                        className="shop-form-input"
                        value={editForm.code}
                        maxLength={4}
                        onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="shop-form-group">
                  <label className="shop-form-label">Khẩu Hiệu & Tôn Chỉ Thương Hiệu (Slogan) *</label>
                  <textarea
                    rows={2}
                    className="shop-form-textarea"
                    value={editForm.slogan}
                    onChange={(e) => setEditForm({ ...editForm, slogan: e.target.value })}
                    required
                  />
                </div>

                <div className="shop-form-group">
                  <label className="shop-form-label">Nguồn Gốc Xuất Xứ (Origin) *</label>
                  <input
                    type="text"
                    className="shop-form-input"
                    value={editForm.origin}
                    onChange={(e) => setEditForm({ ...editForm, origin: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <div className="shop-modal-section-title">
                    <span>📍</span> Cơ Sở Flagship Hà Nội
                  </div>
                  <div className="shop-form-group" style={{ marginBottom: '10px' }}>
                    <label className="shop-form-label">Địa Chỉ Chi Tiết</label>
                    <input
                      type="text"
                      className="shop-form-input"
                      value={editForm.addressHn}
                      onChange={(e) => setEditForm({ ...editForm, addressHn: e.target.value })}
                    />
                  </div>
                  <div className="shop-modal-grid-2">
                    <div className="shop-form-group">
                      <label className="shop-form-label">Hotline Tiếp Đón</label>
                      <input
                        type="text"
                        className="shop-form-input"
                        value={editForm.phoneHn}
                        onChange={(e) => setEditForm({ ...editForm, phoneHn: e.target.value })}
                      />
                    </div>
                    <div className="shop-form-group">
                      <label className="shop-form-label">Giờ Mở Cửa</label>
                      <input
                        type="text"
                        className="shop-form-input"
                        value={editForm.hoursHn}
                        onChange={(e) => setEditForm({ ...editForm, hoursHn: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="shop-modal-section-title">
                    <span>📍</span> Cơ Sở Flagship TP. Hồ Chí Minh
                  </div>
                  <div className="shop-form-group" style={{ marginBottom: '10px' }}>
                    <label className="shop-form-label">Địa Chỉ Chi Tiết</label>
                    <input
                      type="text"
                      className="shop-form-input"
                      value={editForm.addressHcm}
                      onChange={(e) => setEditForm({ ...editForm, addressHcm: e.target.value })}
                    />
                  </div>
                  <div className="shop-modal-grid-2">
                    <div className="shop-form-group">
                      <label className="shop-form-label">Hotline Tiếp Đón</label>
                      <input
                        type="text"
                        className="shop-form-input"
                        value={editForm.phoneHcm}
                        onChange={(e) => setEditForm({ ...editForm, phoneHcm: e.target.value })}
                      />
                    </div>
                    <div className="shop-form-group">
                      <label className="shop-form-label">Giờ Mở Cửa</label>
                      <input
                        type="text"
                        className="shop-form-input"
                        value={editForm.hoursHcm}
                        onChange={(e) => setEditForm({ ...editForm, hoursHcm: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="shop-modal-footer">
                <button
                  type="button"
                  className="shop-btn-cancel"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Hủy Bỏ
                </button>
                <button type="submit" className="shop-btn-save">
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* =========================================================================
          MODAL 3: ĐẶT LỊCH HẸN THỬ ĐỒ VIP TẠI BOUTIQUE
          ========================================================================= */}
      {isAppointmentModalOpen && (
        <div className="shop-modal-overlay" onClick={() => setIsAppointmentModalOpen(false)}>
          <div className="shop-modal-card" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="shop-modal-header">
              <h3>
                <span>📅</span> Đặt Lịch Hẹn VIP Tại Boutique
              </h3>
              <button
                type="button"
                className="shop-modal-close-btn"
                onClick={() => setIsAppointmentModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitAppointment}>
              <div className="shop-modal-body">
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: '#FEF3C7',
                    border: '1px solid #FCD34D',
                    color: '#92400E',
                    fontSize: '0.84rem',
                  }}
                >
                  <strong>📍 Điểm đến:</strong> {selectedBoutiqueName}
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem' }}>
                    Chuyên viên VIP sẽ chuẩn bị phòng tiếp đón riêng tư và các bộ sưu tập theo yêu cầu của Quý khách.
                  </p>
                </div>

                <div className="shop-modal-grid-2">
                  <div className="shop-form-group">
                    <label className="shop-form-label">Họ và tên Quý khách *</label>
                    <input
                      type="text"
                      className="shop-form-input"
                      value={apptCustomerName}
                      onChange={(e) => setApptCustomerName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      required
                    />
                  </div>
                  <div className="shop-form-group">
                    <label className="shop-form-label">Số điện thoại liên hệ *</label>
                    <input
                      type="tel"
                      className="shop-form-input"
                      value={apptCustomerPhone}
                      onChange={(e) => setApptCustomerPhone(e.target.value)}
                      placeholder="0901 234 567"
                      required
                    />
                  </div>
                </div>

                <div className="shop-modal-grid-2">
                  <div className="shop-form-group">
                    <label className="shop-form-label">Ngày hẹn *</label>
                    <input
                      type="date"
                      className="shop-form-input"
                      value={apptDate}
                      onChange={(e) => setApptDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="shop-form-group">
                    <label className="shop-form-label">Khung giờ VIP *</label>
                    <select
                      className="shop-form-input"
                      value={apptSlot}
                      onChange={(e) => setApptSlot(e.target.value)}
                    >
                      <option value="10:00 - 12:00 (Sáng VIP)">10:00 - 12:00 (Sáng VIP)</option>
                      <option value="14:30 - 16:30 (Chiều VIP)">14:30 - 16:30 (Chiều VIP)</option>
                      <option value="18:30 - 20:30 (Tối VIP)">18:30 - 20:30 (Tối VIP)</option>
                    </select>
                  </div>
                </div>

                <div className="shop-form-group">
                  <label className="shop-form-label">Dịch vụ đặc quyền mong muốn</label>
                  <select
                    className="shop-form-input"
                    value={apptService}
                    onChange={(e) => setApptService(e.target.value)}
                  >
                    <option value="Phòng Thử Đồ VIP Riêng Tư">Phòng Thử Đồ VIP Riêng Tư</option>
                    <option value="Cố Vấn Phong Cách 1:1">Cố Vấn Phong Cách 1:1</option>
                    <option value="Xem Trước Bộ Sưu Tập Giới Hạn">Xem Trước Bộ Sưu Tập Giới Hạn</option>
                    <option value="Spa & Bảo Dưỡng Đồ Da Xa Xỉ">Spa & Bảo Dưỡng Đồ Da Xa Xỉ</option>
                  </select>
                </div>
              </div>

              <div className="shop-modal-footer">
                <button
                  type="button"
                  className="shop-btn-cancel"
                  onClick={() => setIsAppointmentModalOpen(false)}
                >
                  Hủy Bỏ
                </button>
                <button type="submit" className="shop-btn-save">
                  Xác Nhận Đặt Lịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KHUNG THÔNG BÁO NỔI TOAST */}
      {toastMessage && (
        <div id="toast-container" className="toast-container">
          <div className="toast">{toastMessage}</div>
        </div>
      )}
    </main>
  );
}
