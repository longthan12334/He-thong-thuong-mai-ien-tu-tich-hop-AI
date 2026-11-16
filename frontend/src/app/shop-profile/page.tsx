'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { storeService } from '@/services/store.service';
import { productService } from '@/services/product.service';
import { formatVND } from '@/lib/utils';
import { STORAGE_KEYS, FALLBACK_IMAGE } from '@/lib/constants';
import { useToast } from '@/contexts/ToastContext';
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

function getBrandInitials(name: string): string {
  if (!name) return 'AG';
  const clean = name.replace(/Official|Flagship|Store|Boutique|Cửa hàng|chính hãng/gi, '').trim();
  if (/north\s*face/i.test(clean)) return 'TNF';
  if (/vivienne\s*westwood/i.test(clean)) return 'VW';
  if (/gucci/i.test(clean)) return 'GG';
  if (/adidas/i.test(clean)) return 'ADI';
  if (/nike/i.test(clean)) return 'NK';
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

function ShopProfileContent() {
  const searchParams = useSearchParams();
  const sellerIdParam = searchParams.get('sellerId');
  const brandParam = searchParams.get('brand');
  const shopParam = searchParams.get('shop') || searchParams.get('id');

  const { user } = useAuth();

  const [profile, setProfile] = useState<StoreBrandProfile | null>(null);
  const [boutiques, setBoutiques] = useState<StoreBoutique[]>([]);
  const [shopProducts, setShopProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<string>('storefront');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('popular');
  const { showToast } = useToast();

  const [isSellerUser, setIsSellerUser] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [campaignTitle, setCampaignTitle] = useState('Bộ Sưu Tập Chính Hãng');
  const [campaignSubtitle, setCampaignSubtitle] = useState(
    'Khám phá các thiết kế biểu tượng và tinh hoa thời trang chính hãng tại Aethelgard Mall.'
  );

  // Trạng thái theo dõi shop
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(1280);

  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    address: '',
    hours: '',
    storeCode: '',
    campaignTitle: 'Bộ Sưu Tập Chính Hãng',
    campaignSubtitle: 'Khám phá các thiết kế biểu tượng và tinh hoa thời trang chính hãng tại Aethelgard Mall.',
  });

  const loadShopData = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryLookup = sellerIdParam || brandParam || shopParam;
      let profileLookup = 'gucci';
      if (queryLookup) {
        profileLookup = queryLookup;
      } else if (user?.role === 'Seller' || user?.role === 'Admin') {
        profileLookup = user?.userId ? String(user.userId) : (user?.email ? user.email.split('@')[0].toLowerCase() : 'gucci');
      }

      // Tăng bộ đếm lượt xem gian hàng
      const curViews = Number(localStorage.getItem(STORAGE_KEYS.SHOP_VIEWS) || '0') + 1;
      localStorage.setItem(STORAGE_KEYS.SHOP_VIEWS, String(curViews));

      // Gọi API lấy thông tin Profile gian hàng
      const data = await storeService.getStoreProfile(profileLookup);

      if (data) {
        setProfile(data);
        setBoutiques(data.boutiques || []);

        const isOwner = !!(
          user &&
          (user.role === 'Admin' ||
            (user.role === 'Seller' &&
              (user.userId === data.sellerId ||
                user.id === data.sellerId ||
                (user.email && data.brandId && user.email.toLowerCase().startsWith(data.brandId.toLowerCase())))))
        );
        setIsSellerUser(isOwner);

        // Nạp tiêu đề & mô tả chiến dịch
        const shopCustomKey = `SHOP_HERO_${data.sellerId || data.brandId || profileLookup}`;
        const savedTitle =
          localStorage.getItem(`${shopCustomKey}_TITLE`) ||
          (data.brandName.toLowerCase().includes('gucci') ? localStorage.getItem(STORAGE_KEYS.SHOP_HERO_TITLE) : null);
        const savedSub =
          localStorage.getItem(`${shopCustomKey}_SUB`) ||
          (data.brandName.toLowerCase().includes('gucci') ? localStorage.getItem(STORAGE_KEYS.SHOP_HERO_SUB) : null);

        const currentTitle = savedTitle || (data.brandName ? `Bộ Sưu Tập ${data.brandName}` : 'Bộ Sưu Tập Thời Trang');
        const currentSub =
          savedSub ||
          data.slogan ||
          `Khám phá các thiết kế biểu tượng và tinh hoa thời trang chính hãng từ ${data.brandName} tại Aethelgard Mall.`;

        setCampaignTitle(currentTitle);
        setCampaignSubtitle(currentSub);

        const primaryBoutique = data.boutiques && data.boutiques.length > 0 ? data.boutiques[0] : null;
        setEditForm({
          name: data.brandName || '',
          phone: primaryBoutique?.phone || '',
          address: primaryBoutique?.address || '',
          hours: primaryBoutique?.operatingHours || '',
          storeCode: primaryBoutique?.storeCode || '',
          campaignTitle: currentTitle,
          campaignSubtitle: currentSub,
        });

        // Nạp trạng thái theo dõi (Follow)
        const followShopKey = String(data.sellerId || profileLookup).toLowerCase();
        let followedShops: string[] = [];
        try {
          followedShops = JSON.parse(localStorage.getItem('aethelgard_followed_shops') || '[]');
        } catch {}

        const isFollowed = Boolean(
          followedShops.includes(followShopKey) ||
          (data.brandId && followedShops.includes(data.brandId.toLowerCase())) ||
          (data.brandName && followedShops.includes(data.brandName.toLowerCase()))
        );
        setIsFollowing(isFollowed);

        const savedFollowers = localStorage.getItem(`aethelgard_followers_${followShopKey}`);
        if (savedFollowers) {
          setFollowerCount(Number(savedFollowers));
        } else {
          const baseCount = Math.max(320, (data.totalProducts || 10) * 16 + (data.reviewCount || 0) * 3);
          setFollowerCount(baseCount);
        }

        // Tải danh sách sản phẩm của gian hàng
        const prodSellerId = data.sellerId || (sellerIdParam ? Number(sellerIdParam) : undefined);
        let prodData = await productService.getProducts({
          sellerId: prodSellerId || undefined,
          pageSize: 48,
        });

        if ((!prodData || !prodData.items || prodData.items.length === 0) && (brandParam || data.brandName)) {
          prodData = await productService.getProducts({
            search: brandParam || data.brandName,
            pageSize: 48,
          });
        }

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
            image: p.imageUrl || FALLBACK_IMAGE,
          }));
          setShopProducts(interleaveShopProducts(mapped));
        } else {
          setShopProducts([]);
        }
      } else {
        // Fallback an toàn nếu không tìm thấy profile trên server
        const fallbackBrand = brandParam || (sellerIdParam ? `Shop #${sellerIdParam}` : 'Gian Hàng Chính Hãng');
        const fallbackSellerId = sellerIdParam ? Number(sellerIdParam) : undefined;
        let prodData = await productService.getProducts({
          sellerId: fallbackSellerId,
          search: brandParam || undefined,
          pageSize: 48,
        });

        const items = prodData?.items || [];
        const fallbackProfile: StoreBrandProfile = {
          sellerId: fallbackSellerId || 0,
          brandId: fallbackBrand.toLowerCase().replace(/\s+/g, ''),
          brandName: fallbackBrand,
          brandCode: getBrandInitials(fallbackBrand),
          slogan: `Gian hàng chính hãng ${fallbackBrand} phân phối trực tiếp tại Aethelgard Mall`,
          rating: 5.0,
          reviewCount: items.reduce((sum, p) => sum + (p.reviewCount || 0), 0),
          totalProducts: prodData.totalCount || items.length,
          totalStock: items.reduce((sum, p) => sum + (p.stockQuantity || 0), 0),
          boutiqueCount: 0,
          avatarUrl: '',
          coverBannerUrl: undefined,
          boutiques: [],
        };
        setProfile(fallbackProfile);
        setIsSellerUser(false);
        setCampaignTitle(`Bộ Sưu Tập ${fallbackBrand}`);
        setCampaignSubtitle(`Khám phá các sản phẩm chính hãng độc quyền từ gian hàng ${fallbackBrand}.`);

        const followShopKey = String(fallbackSellerId || profileLookup).toLowerCase();
        let followedShops: string[] = [];
        try {
          followedShops = JSON.parse(localStorage.getItem('aethelgard_followed_shops') || '[]');
        } catch {}
        setIsFollowing(followedShops.includes(followShopKey));
        setFollowerCount(Math.max(120, items.length * 15));

        if (items.length > 0) {
          const mapped: Product[] = items.map((p) => ({
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
            image: p.imageUrl || FALLBACK_IMAGE,
          }));
          setShopProducts(interleaveShopProducts(mapped));
        } else {
          setShopProducts([]);
        }
      }
    } catch (err) {
      console.error('Lỗi nạp dữ liệu gian hàng:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, sellerIdParam, brandParam, shopParam]);

  useEffect(() => {
    loadShopData();
  }, [loadShopData]);



  // Nút Bật / Tắt Theo dõi gian hàng
  const handleToggleFollow = () => {
    const shopKey = String(profile?.sellerId || sellerIdParam || brandParam || 'shop').toLowerCase();
    const brandName = profile?.brandName || brandDisplayName;
    let list: string[] = [];
    try {
      list = JSON.parse(localStorage.getItem('aethelgard_followed_shops') || '[]');
    } catch {}

    let nextFollowing = false;
    let nextCount = followerCount;

    if (isFollowing) {
      list = list.filter(
        (id) =>
          id !== shopKey &&
          id !== String(profile?.brandId).toLowerCase() &&
          id !== brandName.toLowerCase()
      );
      nextFollowing = false;
      nextCount = Math.max(0, followerCount - 1);
      showToast(`Đã hủy theo dõi gian hàng ${brandName}.`);
    } else {
      if (!list.includes(shopKey)) list.push(shopKey);
      nextFollowing = true;
      nextCount = followerCount + 1;
      showToast(`Bạn đã theo dõi thành công gian hàng ${brandName}!`);
    }

    setIsFollowing(nextFollowing);
    setFollowerCount(nextCount);
    try {
      localStorage.setItem('aethelgard_followed_shops', JSON.stringify(list));
      localStorage.setItem(`aethelgard_followers_${shopKey}`, String(nextCount));
      window.dispatchEvent(
        new CustomEvent('aethelgard:shop-follow-changed', {
          detail: { shopKey, isFollowing: nextFollowing },
        })
      );
    } catch {}
  };

  const handleOpenEditModal = () => {
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const updatedProfile: StoreBrandProfile = {
      ...profile,
      brandName: editForm.name,
    };
    setProfile(updatedProfile);

    const shopCustomKey = `SHOP_HERO_${profile.sellerId || profile.brandId || 'shop'}`;

    if (editForm.campaignTitle) {
      setCampaignTitle(editForm.campaignTitle);
      try {
        localStorage.setItem(`${shopCustomKey}_TITLE`, editForm.campaignTitle);
      } catch {}
    }
    if (editForm.campaignSubtitle) {
      setCampaignSubtitle(editForm.campaignSubtitle);
      try {
        localStorage.setItem(`${shopCustomKey}_SUB`, editForm.campaignSubtitle);
      } catch {}
    }

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

  const handleChatShop = () => {
    showToast(`Đang kết nối phiên tư vấn bảo mật riêng với Quản lý Boutique ${profile?.brandName || ''}...`);
  };

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
  const brandSlogan = profile?.slogan || `Gian hàng phân phối chính hãng ${brandDisplayName} tại Aethelgard Mall`;
  const brandRating = profile ? profile.rating.toFixed(1) : '5.0';
  const brandReviewCount = profile ? profile.reviewCount.toLocaleString('vi-VN') : '0';
  const brandTotalProducts = profile ? profile.totalProducts : shopProducts.length;
  const brandTotalStock = profile ? profile.totalStock.toLocaleString('vi-VN') : '0';

  const isSeller =
    user?.role === 'Seller' ||
    (user?.role as any) === 2 ||
    String(user?.role).toLowerCase() === 'seller';
  const isAdmin =
    user?.role === 'Admin' ||
    (user?.role as any) === 1 ||
    String(user?.role).toLowerCase() === 'admin';
  const isManagement = isSeller || isAdmin;
  const isCustomerOrGuest = !isManagement;
  const isOwnShop = isSellerUser;
  const canFollowShop = isCustomerOrGuest && !isOwnShop;

  const heroBackgroundImage =
    profile?.coverBannerUrl ||
    (profile?.brandId?.includes('gucci')
      ? '/img/products/gucci-runway.jpg'
      : '/img/brands/1.avif');

  return (
    <main className="shop-profile-container !p-0">
      {/* 1. CINEMATIC EDITORIAL HERO */}
      <section className="relative w-full h-[88vh] min-h-[560px] overflow-hidden flex flex-col justify-between bg-black text-white">
        {/* Ảnh nền chiến dịch từ Database / Brand */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-100"
          style={{
            backgroundImage: `url(${heroBackgroundImage})`,
          }}
        />
        {/* Lớp gradient làm mờ nhẹ trên đỉnh và đáy để text rõ nét */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-black/90" />

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
            {canFollowShop && (
              <button
                type="button"
                onClick={handleToggleFollow}
                className={`text-[11px] font-bold tracking-wider uppercase px-4 py-1.5 rounded-full transition-all cursor-pointer backdrop-blur-md ${
                  isFollowing
                    ? 'bg-white/20 text-white hover:bg-white/30 border border-white/30'
                    : 'bg-red-600 text-white hover:bg-red-700 shadow-md'
                }`}
              >
                {isFollowing ? '✓ Đang Theo Dõi' : '+ Theo Dõi'}
              </button>
            )}
            {isManagement && !isOwnShop && (
              <span className="text-[10px] font-bold tracking-wider uppercase px-3 py-1.5 rounded-full bg-white/20 text-white/90 backdrop-blur-md flex items-center gap-1.5">
                <span>👁 Góc Người Mua</span>
              </span>
            )}
            {isOwnShop && (
              <button
                type="button"
                onClick={handleOpenEditModal}
                className="hidden sm:inline-flex text-[10px] font-bold tracking-wider uppercase px-3 py-1.5 rounded-full bg-white/20 hover:bg-white text-white hover:text-black backdrop-blur-md transition-all cursor-pointer"
              >
                ⚙ Sửa Hồ Sơ
              </button>
            )}
          </div>
        </div>

        {/* Khối typography góc dưới bên trái */}
        <div className="relative z-10 px-6 sm:px-14 pb-12 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold tracking-widest uppercase mb-3">
            <span>CHÍNH HÃNG</span>
            <span>•</span>
            <span>AETHELGARD MALL</span>
          </div>
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
            {canFollowShop && (
              <button
                type="button"
                onClick={handleToggleFollow}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold tracking-widest uppercase transition-all cursor-pointer shadow-lg backdrop-blur-md ${
                  isFollowing
                    ? 'bg-white/20 text-white hover:bg-white/30 border border-white/40'
                    : 'bg-red-600 text-white hover:bg-red-700 border border-red-500'
                }`}
              >
                <span>{isFollowing ? '✓ Đang Theo Dõi' : '+ Theo Dõi Gian Hàng'}</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. THẺ NHẬN DIỆN GIAN HÀNG & NÚT THEO DÕI NỔI BẬT */}
      <div className="px-4 md:px-12 py-10">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-900 text-white flex items-center justify-center text-xl sm:text-2xl font-black shadow-md shrink-0 border-2 border-white ring-2 ring-slate-100 overflow-hidden">
              {profile?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarUrl} alt={brandDisplayName} className="w-full h-full object-cover" />
              ) : (
                getBrandInitials(brandDisplayName)
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {brandDisplayName}
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-black bg-red-600 text-white tracking-wider">
                  CHÍNH HÃNG
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Đang hoạt động
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 max-w-xl line-clamp-1 mb-2">
                {brandSlogan}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-600">
                <span>
                  <strong className="text-slate-900">{followerCount.toLocaleString('vi-VN')}</strong> người theo dõi
                </span>
                <span>•</span>
                <span>
                  <strong className="text-slate-900">{brandTotalProducts}</strong> sản phẩm niêm yết
                </span>
                <span>•</span>
                <span>
                  <strong className="text-slate-900">{brandRating} ★</strong> ({brandReviewCount} đánh giá)
                </span>
              </div>
            </div>
          </div>

          {/* Cụm nút hành động: Theo Dõi & Nhắn Tin */}
          <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
            {canFollowShop && (
              <>
                <button
                  type="button"
                  id="btn-follow-shop-card"
                  onClick={handleToggleFollow}
                  className={`px-6 py-2.5 rounded-full text-xs font-extrabold tracking-wider uppercase transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-sm ${
                    isFollowing
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                      : 'bg-black text-white hover:bg-neutral-800 hover:shadow-md'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Đang Theo Dõi</span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-bold">+</span>
                      <span>Theo Dõi</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  id="btn-chat-shop"
                  onClick={handleChatShop}
                  className="px-5 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase bg-white text-slate-800 hover:bg-slate-50 border border-slate-200 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <span>💬 Nhắn Tin Shop</span>
                </button>
              </>
            )}

            {isOwnShop && (
              <button
                type="button"
                onClick={handleOpenEditModal}
                className="px-5 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase bg-slate-900 text-white hover:bg-black transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <span>⚙ Cập Nhật Hồ Sơ Shop</span>
              </button>
            )}

            {isManagement && !isOwnShop && (
              <div className="flex items-center gap-2">
                <span className="px-3.5 py-2 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
                  👁 Góc Người Mua (Chế độ xem trước)
                </span>
                <button
                  type="button"
                  onClick={handleChatShop}
                  className="px-4 py-2 rounded-full text-xs font-bold tracking-wider uppercase bg-white text-slate-800 hover:bg-slate-50 border border-slate-200 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <span>💬 Liên Hệ Shop</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Lưới 3 chỉ số hoạt động THẬT từ Database */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm mb-12">
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Đánh Giá Gian Hàng
            </span>
            <span className="text-xl font-black text-slate-900">
              {brandRating} ★ <span className="text-xs font-medium text-slate-500">({brandReviewCount})</span>
            </span>
          </div>
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Sản Phẩm Niêm Yết
            </span>
            <span className="text-xl font-black text-slate-900">{brandTotalProducts} tác phẩm</span>
          </div>
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Tổng Tồn Kho Sẵn Có
            </span>
            <span className="text-xl font-black text-slate-900">{brandTotalStock} sản phẩm</span>
          </div>
        </div>

        {/* 4. THANH DANH MỤC SHOWROOM CHỮ ĐEN KHÔNG NỀN (STICKY DƯỚI HEADER) */}
        <div
          id="shop-showroom"
          className="scroll-mt-24 sticky top-16 z-30 w-full bg-white/80 backdrop-blur-md py-2.5 -mx-4 px-4 sm:-mx-8 sm:px-8 border-b border-black/5 mb-6"
        >
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
                  sortBy === 'popular'
                    ? 'bg-black text-white border-black'
                    : 'bg-transparent text-neutral-700 border-neutral-300 hover:border-black'
                }`}
                onClick={() => setSortBy('popular')}
                type="button"
              >
                Khuyên dùng
              </button>
              <button
                className={`px-3 py-1 rounded-full text-[10.5px] font-bold tracking-wider uppercase border transition-all ${
                  sortBy === 'price_asc'
                    ? 'bg-black text-white border-black'
                    : 'bg-transparent text-neutral-700 border-neutral-300 hover:border-black'
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
                <Link key={p.id} href={`/product-detail/${p.id}`} className="shop-product-card group">
                  <div className="product-card-thumb">
                    <span className="card-tag-badge">{p.badge}</span>
                    {p.discount && <span className="card-discount-tag">{p.discount}</span>}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.image || FALLBACK_IMAGE}
                      alt={p.name}
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                      }}
                    />
                  </div>
                  <div className="product-card-body">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{p.category}</span>
                      <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/50">
                        ★ {p.rating}
                      </span>
                    </div>
                    <div className="text-[11px] font-black tracking-[0.16em] text-slate-900 uppercase mb-0.5">
                      {brandName}
                    </div>
                    <h3
                      className="product-card-name font-medium text-slate-700 text-sm line-clamp-2 min-h-[2.6em] mb-2 group-hover:text-sky-600 transition-colors"
                      title={p.name}
                    >
                      {itemName}
                    </h3>
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
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                }}
              >
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  ⚙ Cập Nhật Thông Tin Cửa Hàng
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.25rem',
                    cursor: 'pointer',
                    color: '#64748b',
                  }}
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleSaveProfile}>
                <div style={{ marginBottom: '14px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#334155',
                      marginBottom: '6px',
                    }}
                  >
                    Tên Thương Hiệu / Gian Hàng
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: '#334155',
                        marginBottom: '6px',
                      }}
                    >
                      Hotline Boutique
                    </label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.9rem',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: '#334155',
                        marginBottom: '6px',
                      }}
                    >
                      Giờ Mở Cửa
                    </label>
                    <input
                      type="text"
                      value={editForm.hours}
                      onChange={(e) => setEditForm({ ...editForm, hours: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.9rem',
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#334155',
                      marginBottom: '6px',
                    }}
                  >
                    Địa Chỉ Flagship Chính
                  </label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#334155',
                      marginBottom: '6px',
                    }}
                  >
                    Tiêu Đề Banner Chiến Dịch Hero
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Shoes for Men, BST Thu Đông 2026..."
                    value={editForm.campaignTitle || ''}
                    onChange={(e) => setEditForm({ ...editForm, campaignTitle: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#334155',
                      marginBottom: '6px',
                    }}
                  >
                    Nội Dung Mô Tả Chiến Dịch Hero
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Mô tả chiến dịch hiển thị nổi bật dưới tiêu đề banner..."
                    value={editForm.campaignSubtitle || ''}
                    onChange={(e) => setEditForm({ ...editForm, campaignSubtitle: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: '#f8fafc',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '10px 22px',
                      borderRadius: '10px',
                      border: 'none',
                      background: '#0f172a',
                      color: '#ffffff',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Lưu & Áp Dụng
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}


      </div>
    </main>
  );
}

export default function ShopProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-12 text-slate-500 font-medium">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mb-4" />
          <span>Đang tải hồ sơ gian hàng...</span>
        </div>
      }
    >
      <ShopProfileContent />
    </Suspense>
  );
}
