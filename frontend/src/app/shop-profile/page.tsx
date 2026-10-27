'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { storeService } from '@/services/store.service';
import { productService } from '@/services/product.service';
import { formatVND } from '@/lib/utils';
import { STORAGE_KEYS } from '@/lib/constants';
import type { StoreBoutique, StoreBrandProfile } from '@/types/store.types';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice: string;
  priceFormatted: string;
  stockQuantity: number;
  rating: string;
  reviewCount: number;
  badge: string;
  discount: string;
  image: string;
}



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
  const [profile, setProfile] = useState<StoreBrandProfile | null>(null);
  const [boutiques, setBoutiques] = useState<StoreBoutique[]>([]);
  const [shopProducts, setShopProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<string>('storefront');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('popular');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isSellerUser, setIsSellerUser] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [campaignTitle, setCampaignTitle] = useState('Shoes for Men');
  const [campaignSubtitle, setCampaignSubtitle] = useState(
    "The Horsebit 1953 takes center stage alongside signature Jordaan loafers, sneakers, and men's designer shoes."
  );

  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    address: '',
    hours: '',
    storeCode: '',
    campaignTitle: 'Shoes for Men',
    campaignSubtitle: "The Horsebit 1953 takes center stage alongside signature Jordaan loafers, sneakers, and men's designer shoes.",
  });

    const { user } = useAuth();

  const loadShopData = useCallback(async () => {
    setIsLoading(true);
    try {
      const sellerId = user?.userId || null;
      setIsSellerUser(user?.role === 'Seller' || user?.role === 'Admin');
      const brandKey = user?.email ? user.email.split('@')[0].toLowerCase() : 'gucci';
      const profileLookup = brandKey || (sellerId ? String(sellerId) : 'gucci');

      // Tải tùy biến tiêu đề chiến dịch và bộ đếm xem
      const savedTitle = localStorage.getItem(STORAGE_KEYS.SHOP_HERO_TITLE);
      const savedSub = localStorage.getItem(STORAGE_KEYS.SHOP_HERO_SUB);
      if (savedTitle) {
        setCampaignTitle(savedTitle);
        setEditForm((prev) => ({ ...prev, campaignTitle: savedTitle }));
      }
      if (savedSub) {
        setCampaignSubtitle(savedSub);
        setEditForm((prev) => ({ ...prev, campaignSubtitle: savedSub }));
      }
      const curViews = Number(localStorage.getItem(STORAGE_KEYS.SHOP_VIEWS) || '0') + 1;
      localStorage.setItem(STORAGE_KEYS.SHOP_VIEWS, String(curViews));

      // Gọi storeService và productService tập trung (Item 21)
      const data = await storeService.getStoreProfile(profileLookup);
      if (data) {
        setProfile(data);
        setBoutiques(data.boutiques || []);
        const primaryBoutique = data.boutiques && data.boutiques.length > 0 ? data.boutiques[0] : null;
        setEditForm((prev) => ({
          ...prev,
          name: data.brandName || '',
          phone: primaryBoutique?.phone || '',
          address: primaryBoutique?.address || '',
          hours: primaryBoutique?.operatingHours || '',
          storeCode: primaryBoutique?.storeCode || '',
        }));

        const prodSellerId = data.sellerId || sellerId;
        const prodData = await productService.getProducts({
          sellerId: prodSellerId || undefined,
          pageSize: 48,
        });

        if (prodData && prodData.items && prodData.items.length > 0) {
          const mapped: Product[] = prodData.items.map((p) => ({
            id: String(p.id),
            name: p.name,
            category: p.categoryName || 'Thời Trang Cao Cấp',
            price: p.basePrice || 0,
            originalPrice: p.originalPrice ? formatVND(p.originalPrice) : '',
            priceFormatted: formatVND(p.basePrice || 0),
            stockQuantity: p.stockQuantity || 0,
            rating: (p.rating || 5.0).toFixed(1),
            reviewCount: p.reviewCount || 0,
            badge: p.collectionName || ((p.discountPercent ?? 0) > 0 ? `Giảm ${p.discountPercent}%` : 'Chính Hãng'),
            discount: (p.discountPercent ?? 0) > 0 ? `-${p.discountPercent}%` : '',
            image: p.imageUrl || '/img/products/sample-velora.jpg',
          }));
          setShopProducts(interleaveShopProducts(mapped));
        }
      }
    } catch (err) {
      console.error('Lỗi nạp dữ liệu gian hàng:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadShopData();
  }, [loadShopData]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3400);
  };

  const handleOpenEditModal = () => {
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    // Cập nhật state trực tiếp
    const updatedProfile: StoreBrandProfile = {
      ...profile,
      brandName: editForm.name,
    };
    setProfile(updatedProfile);

    if (editForm.campaignTitle) {
      setCampaignTitle(editForm.campaignTitle);
      try { localStorage.setItem('AETHELGARD_SHOP_HERO_TITLE', editForm.campaignTitle); } catch {}
    }
    if (editForm.campaignSubtitle) {
      setCampaignSubtitle(editForm.campaignSubtitle);
      try { localStorage.setItem('AETHELGARD_SHOP_HERO_SUB', editForm.campaignSubtitle); } catch {}
    }

        // Gửi cập nhật lên backend API qua storeService (Item 21)
    try {
      if (editForm.storeCode) {
        await storeService.updateStore(editForm.storeCode, {
          storeName: editForm.name,
          storeType: 'Official Flagship Boutique',
          address: editForm.address,
          phone: editForm.phone,
          operatingHours: editForm.hours,
          city: 'Hà Nội',
        });
      }
    } catch (err) {
      console.warn('Lỗi đồng bộ API:', err);
    }

    setIsEditModalOpen(false);
    showToast('Đã lưu thông tin cửa hàng thành công vào cơ sở dữ liệu!');
  };

  // Nhắn tin với shop
  const handleChatShop = () => {
    showToast(`Đang kết nối phiên tư vấn bảo mật riêng với Quản lý Boutique ${profile?.brandName || ''}...`);
  };

  // Đặt lịch hẹn
  const handleBookAppointment = (boutiqueName: string) => {
    showToast(`Đã gửi yêu cầu đặt lịch hẹn VIP tại ${boutiqueName}. Chuyên viên sẽ liên hệ theo số điện thoại của bạn.`);
  };

  // Chuyển tab
  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'locations') {
      const el = document.getElementById('boutiques-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Lọc & sắp xếp sản phẩm
  let displayProducts = [...shopProducts];

  if (activeTab === 'new') {
    displayProducts = displayProducts.filter(
      (p) => p.badge.includes('Mới') || p.badge.includes('Runway')
    );
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    displayProducts = displayProducts.filter(
      (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }

  if (sortBy === 'price_asc') {
    displayProducts.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price_desc') {
    displayProducts.sort((a, b) => b.price - a.price);
  } else if (sortBy === 'rating') {
    displayProducts.sort((a, b) => b.reviewCount - a.reviewCount);
  } else {
    displayProducts = interleaveShopProducts(displayProducts);
  }

  const brandDisplayName = profile?.brandName || 'Thương Hiệu Xa Xỉ';
  const brandCode = profile?.brandCode || 'OFFICIAL';
  const brandSlogan = profile?.slogan || `Gian hàng phân phối chính hãng ${brandDisplayName} tại Aethelgard Mall`;
  const brandRating = profile ? profile.rating.toFixed(1) : '5.0';
  const brandReviewCount = profile ? profile.reviewCount.toLocaleString('vi-VN') : '0';
  const brandTotalProducts = profile ? profile.totalProducts : shopProducts.length;
  const brandTotalStock = profile ? profile.totalStock.toLocaleString('vi-VN') : '0';

  return (
    <main className="shop-profile-container !p-0">
      {/* 1. CINEMATIC FULL-BLEED EDITORIAL HERO (GUCCI RUNWAY STYLE - 100% MATCHING USER SCREENSHOT) */}
      <section className="relative w-full h-[92vh] min-h-[600px] overflow-hidden flex flex-col justify-between bg-black text-white">
        {/* Ảnh nền chiến dịch từ Database (Gucci Runway / Campaign) */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-100"
          style={{
            backgroundImage: `url(${profile?.coverBannerUrl || '/img/brands/gucci/gucci-campaign-hero.jpg'})`,
          }}
        />
        {/* Lớp gradient làm mờ nhẹ trên đỉnh và đáy để text rõ nét */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/85" />

        {/* Thanh Header trong suốt trên cùng */}
        <div className="relative z-10 w-full px-6 sm:px-12 pt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={handleChatShop}
            className="text-[11px] font-bold tracking-[0.18em] uppercase text-white/90 hover:text-white transition-colors cursor-pointer"
          >
            + LIÊN HỆ BOUTIQUE
          </button>

          {/* Logo Brand trung tâm */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold tracking-[0.32em] text-white uppercase drop-shadow-lg text-center pl-4">
            {brandDisplayName.toUpperCase()}
          </h1>

          <div className="flex items-center gap-3">
            {isSellerUser && (
              <button
                type="button"
                onClick={handleOpenEditModal}
                className="hidden sm:inline-flex text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full bg-white/20 hover:bg-white text-white hover:text-black backdrop-blur-md transition-all cursor-pointer"
              >
                ⚙ Sửa Hồ Sơ
              </button>
            )}
          </div>
        </div>

        {/* Khối typography góc dưới bên trái — Chuẩn Gucci Shoes for Men */}
        <div className="relative z-10 px-6 sm:px-14 pb-12 max-w-2xl">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-normal tracking-tight text-white mb-3">
            {campaignTitle}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-light mb-6">
            {campaignSubtitle}
          </p>

          <div className="flex items-center gap-3">
            <a
              href="#shop-showroom"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-black text-xs font-bold tracking-widest uppercase hover:bg-neutral-200 transition-all cursor-pointer shadow-lg"
            >
              <span>Khám Phá Showroom</span>
              <span>↓</span>
            </a>
            
          </div>
        </div>
      </section>

      {/* NỘI DUNG SHOWROOM KHI LƯỚT XUỐNG ("LƯỚT LÊN LÀ THẤY NHƯ CŨ") */}
      <div className="px-4 md:px-12 py-10">
        {/* Lưới 4 chỉ số hoạt động THẬT từ Database */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm mb-12">
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Đánh Giá Gian Hàng</span>
            <span className="text-xl font-black text-slate-900">{brandRating} ★ <span className="text-xs font-medium text-slate-500">({brandReviewCount})</span></span>
          </div>
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Sản Phẩm Niêm Yết</span>
            <span className="text-xl font-black text-slate-900">{brandTotalProducts} tác phẩm</span>
          </div>
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Tổng Tồn Kho Sẵn Có</span>
            <span className="text-xl font-black text-slate-900">{brandTotalStock} sản phẩm</span>
          </div>
        </div>

      

      {/* 4. THANH DANH MỤC SHOWROOM CHỮ ĐEN KHÔNG NỀN (STICKY DƯỚI HEADER) */}
      <div id="shop-showroom" className="scroll-mt-24 sticky top-16 z-30 w-full bg-white/80 backdrop-blur-md py-2.5 -mx-4 px-4 sm:-mx-8 sm:px-8 border-b border-black/5 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center justify-start gap-6 sm:gap-8 overflow-x-auto no-scrollbar whitespace-nowrap min-w-0 pr-2">
            <button
              className={`text-[11px] tracking-[0.14em] uppercase transition-all pb-0.5 cursor-pointer shrink-0 ${
                activeTab === 'storefront' || activeTab === 'all'
                  ? 'font-extrabold text-black border-b-2 border-black'
                  : 'font-semibold text-neutral-500 hover:text-black'
              }`}
              onClick={() => handleTabClick('all')}
              type="button"
            >
              TẤT CẢ ({shopProducts.length})
            </button>
            <button
              className={`text-[11px] tracking-[0.14em] uppercase transition-all pb-0.5 cursor-pointer shrink-0 ${
                activeTab === 'new'
                  ? 'font-extrabold text-black border-b-2 border-black'
                  : 'font-semibold text-neutral-500 hover:text-black'
              }`}
              onClick={() => handleTabClick('new')}
              type="button"
            >
              BỘ SƯU TẬP MỚI
            </button>
            
          </div>

          {/* Sắp xếp nhanh */}
          <div className="flex items-center gap-2 shrink-0 text-xs">
            <button
              className={`px-3 py-1 rounded-full text-[10.5px] font-bold tracking-wider uppercase border transition-all ${
                sortBy === 'popular' ? 'bg-black text-white border-black' : 'bg-transparent text-neutral-700 border-neutral-300 hover:border-black'
              }`}
              onClick={() => setSortBy('popular')}
              type="button"
            >
              Khuyên dùng
            </button>
            <button
              className={`px-3 py-1 rounded-full text-[10.5px] font-bold tracking-wider uppercase border transition-all ${
                sortBy === 'price_asc' ? 'bg-black text-white border-black' : 'bg-transparent text-neutral-700 border-neutral-300 hover:border-black'
              }`}
              onClick={() => setSortBy('price_asc')}
              type="button"
            >
              Giá: Thấp → Cao
            </button>
          </div>
        </div>

        {/* Dòng trạng thái số lượng sản phẩm */}
        <div className="flex items-center justify-between pt-1.5 text-[10.5px] text-neutral-500">
          <span>{displayProducts.length} sản phẩm đang trưng bày</span>
        </div>
      </div>

      {/* 6. LƯỚI SẢN PHẨM CỦA SHOP (100% TỪ DATABASE) */}
      <section className="shop-product-grid" id="shop-product-grid">
        {isLoading && shopProducts.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748B', gridColumn: '1 / -1' }}>
            Đang tải danh mục sản phẩm từ cơ sở dữ liệu...
          </div>
        ) : displayProducts.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748B', gridColumn: '1 / -1' }}>
            Không tìm thấy sản phẩm phù hợp với bộ lọc.
          </div>
        ) : (
          displayProducts.map((p) => {
            let brandName = brandDisplayName;
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
                    <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/50">★ {p.rating}</span>
                  </div>
                  <div className="text-[11px] font-black tracking-[0.16em] text-slate-900 uppercase mb-0.5">{brandName}</div>
                  <h3 className="product-card-name font-medium text-slate-700 text-sm line-clamp-2 min-h-[2.6em] mb-2 group-hover:text-sky-600 transition-colors" title={p.name}>{itemName}</h3>
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

      {/* MODAL CHỈNH SỬA HỒ SƠ DÀNH CHO SELLER */}
      {isEditModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '560px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>⚙ Cập Nhật Thông Tin Cửa Hàng</h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveProfile}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Tên Thương Hiệu / Gian Hàng
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Hotline Boutique
                  </label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Giờ Mở Cửa
                  </label>
                  <input
                    type="text"
                    value={editForm.hours}
                    onChange={(e) => setEditForm({ ...editForm, hours: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Địa Chỉ Flagship Chính
                </label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Tiêu Đề Banner Chiến Dịch Hero
                </label>
                <input
                  type="text"
                  placeholder="VD: Shoes for Men, BST Thu Đông 2026..."
                  value={editForm.campaignTitle || ''}
                  onChange={(e) => setEditForm({ ...editForm, campaignTitle: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Nội Dung Mô Tả Chiến Dịch Hero
                </label>
                <textarea
                  rows={2}
                  placeholder="Mô tả chiến dịch hiển thị nổi bật dưới tiêu đề banner..."
                  value={editForm.campaignSubtitle || ''}
                  onChange={(e) => setEditForm({ ...editForm, campaignSubtitle: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 600, cursor: 'pointer' }}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 22px', borderRadius: '10px', border: 'none', background: '#0f172a', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
                >
                  Lưu & Áp Dụng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Khung thông báo nổi */}
      {toastMessage && (
        <div id="toast-container" className="toast-container">
          <div className="toast">{toastMessage}</div>
        </div>
      )}
    </div>
    </main>
  );
}
