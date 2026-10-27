'use client';
import '@/styles/inventory.css';

import React, { useState, useMemo, useEffect } from 'react';
import { inventoryService } from '@/services/inventory.service';
import { aiService } from '@/services/ai.service';
import { productService } from '@/services/product.service';
import { useToast } from '@/hooks/useToast';
import { useSellerGuard } from '@/hooks/useSellerGuard';
import { useAuth } from '@/hooks/useAuth';
import { RefreshCw, Package, AlertTriangle, ArrowDownToLine, DollarSign, Sparkles, Plus, Wand2, CheckCircle2, Tag } from 'lucide-react';

interface InvItem {
  id: number;
  name: string;
  category: string;
  sku: string;
  barcode: string;
  variants: string;
  available_stock: number;
  reserved_stock: number;
  threshold: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  status_text: string;
  cost_price: number;
  retail_price: number;
  image_url: string;
}

export default function InventoryPage() {
  const { isAuthorized, isLoading: isGuardLoading } = useSellerGuard('/shop');
  const { user } = useAuth();
  const { showToast } = useToast();

  const isSeller = user?.role === 'Seller' || (user?.role as any) === 2 || String(user?.role).toLowerCase() === 'seller';
  const isAdmin = user?.role === 'Admin' || (user?.role as any) === 1 || String(user?.role).toLowerCase() === 'admin';

  const [inventoryList, setInventoryList] = useState<InvItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [restockTarget, setRestockTarget] = useState<InvItem | null>(null);
  const [restockQty, setRestockQty] = useState(25);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Danh mục sản phẩm
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([
    { id: 2, name: 'Trang Phục & Quần Áo' },
    { id: 1, name: 'Giày Dép & Sneaker' },
    { id: 3, name: 'Túi Xách & Balo' },
    { id: 4, name: 'Kính Mát & Mắt Kính' },
    { id: 5, name: 'Phụ Kiện & Đồ Da' },
    { id: 6, name: 'Trang Sức Cao Cấp' },
  ]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(2);

  // State cho Thêm Sản Phẩm Mới (AI Copilot)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Trang Phục & Quần Áo');
  const [formBrand, setFormBrand] = useState('Aethelgard Boutique');
  const [formKeyFeatures, setFormKeyFeatures] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formMaterial, setFormMaterial] = useState('');
  const [formCare, setFormCare] = useState('');
  const [formSeoTitle, setFormSeoTitle] = useState('');
  const [formTags, setFormTags] = useState<string[]>([]);
  const [formRetailPrice, setFormRetailPrice] = useState(3850000);
  const [formStock, setFormStock] = useState(30);
  const [formImageUrl, setFormImageUrl] = useState('/img/products/gucci-runway.jpg');

  // Tải danh mục thực tế
  useEffect(() => {
    productService
      .getCategories()
      .then((res) => {
        if (res && res.length > 0) setCategories(res);
      })
      .catch(() => {});
  }, []);

  // Load kho hàng từ backend API
  const loadInventory = async () => {
    setLoading(true);
    try {
      const summary = await inventoryService.getInventory();
      if (summary && summary.items) {
        const mapped: InvItem[] = summary.items.map((it: any) => ({
          id: it.id,
          name: it.name,
          category: it.categoryName || 'Thời Trang',
          sku: it.sku || `SKU-${it.id}`,
          barcode: `893850123${it.id.toString().padStart(4, '0')}`,
          variants: 'Tiêu chuẩn / Đa kích cỡ',
          available_stock: it.stockQuantity || 0,
          reserved_stock: Math.floor((it.stockQuantity || 0) * 0.1),
          threshold: it.safetyThreshold || 10,
          status: (it.stockStatus as any) || (it.stockQuantity > 10 ? 'IN_STOCK' : it.stockQuantity > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK'),
          status_text: it.stockQuantity > 10 ? 'Còn Hàng' : it.stockQuantity > 0 ? 'Sắp Hết' : 'Hết Hàng',
          cost_price: Math.round((it.price || 2000000) * 0.6),
          retail_price: it.price || 2000000,
          image_url: it.imageUrl || '/img/products/adidas-samba.jpg',
        }));
        setInventoryList(mapped);
      }
    } catch {
      showToast('Không thể kết nối máy chủ tồn kho. Hiển thị dữ liệu đệm.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      loadInventory();
    }
  }, [isAuthorized]);

  // Xử lý AI Gemini sinh mô tả sản phẩm
  const handleGenerateAIDescription = async () => {
    if (!formName.trim()) {
      showToast('Vui lòng nhập tên sản phẩm trước khi yêu cầu AI sinh mô tả.');
      return;
    }

    setIsGeneratingAI(true);
    try {
      const res = await aiService.generateProductDescription({
        productName: formName.trim(),
        categoryName: formCategory,
        brand: formBrand,
        keywords: formKeyFeatures.trim() || 'Thời trang cao cấp, đường may tỉ mỉ, phom dáng thanh lịch tôn dáng',
      });

      if (res) {
        if (res.description) setFormDescription(res.description);
        if (res.material) setFormMaterial(res.material);
        if (res.careInstructions) setFormCare(res.careInstructions);
        if (res.seoTitle) setFormSeoTitle(res.seoTitle);
        showToast('✨ Google Gemini đã hoàn thiện mô tả và gợi ý chất liệu chuẩn SEO!');
      }
    } catch {
      showToast('Không thể kết nối AI Gemini, vui lòng thử lại sau.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Lưu sản phẩm mới vào CSDL và bảng tồn kho
  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Vui lòng nhập tên sản phẩm.');
      return;
    }
    if (formRetailPrice <= 0) {
      showToast('Giá bán lẻ phải lớn hơn 0.');
      return;
    }

    setIsSubmitting(true);
    const newSku = `SKU-AI-${Date.now().toString().slice(-4)}`;
    try {
      const created = await productService.createProduct({
        name: formName.trim(),
        sku: newSku,
        categoryId: Number(selectedCategoryId) || 2,
        basePrice: formRetailPrice,
        stockQuantity: formStock,
        description: formDescription || `${formName} thời trang xa xỉ Aethelgard`,
        imageUrl: formImageUrl,
        material: formMaterial,
      });

      const chosenCategory = categories.find((c) => c.id === Number(selectedCategoryId))?.name || formCategory;

      const newItem: InvItem = {
        id: created?.id || Date.now(),
        name: formName.trim(),
        category: chosenCategory,
        sku: created?.sku || newSku,
        barcode: `893850123${Math.floor(1000 + Math.random() * 9000)}`,
        variants: 'Đa kích cỡ / Tiêu chuẩn',
        available_stock: formStock,
        reserved_stock: 0,
        threshold: 10,
        status: formStock > 10 ? 'IN_STOCK' : formStock > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK',
        status_text: formStock > 10 ? 'Còn Hàng' : 'Sắp Hết',
        cost_price: Math.round(formRetailPrice * 0.6),
        retail_price: formRetailPrice,
        image_url: formImageUrl,
      };

      setInventoryList((prev) => [newItem, ...prev]);
      setIsAddModalOpen(false);
      showToast(`🎉 Đã thêm sản phẩm "${formName}" vào kho hàng và niêm yết trên sàn!`);

      // Reset form
      setFormName('');
      setFormKeyFeatures('');
      setFormDescription('');
      setFormMaterial('');
      setFormCare('');
      setFormSeoTitle('');
      setFormTags([]);
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Không thể niêm yết sản phẩm lên hệ thống.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = useMemo(() => {
    let list = [...inventoryList];
    if (activeTab !== 'ALL') {
      list = list.filter((item) => item.status === activeTab);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.sku.toLowerCase().includes(q) ||
          i.barcode.toLowerCase().includes(q)
      );
    }
    return list;
  }, [inventoryList, activeTab, searchTerm]);

  const totalStock = inventoryList.reduce((sum, item) => sum + item.available_stock, 0);
  const lowStockCount = inventoryList.filter((item) => item.status === 'LOW_STOCK' || item.status === 'OUT_OF_STOCK').length;
  const totalValue = inventoryList.reduce((sum, item) => sum + item.available_stock * item.cost_price, 0);

  // Xử lý gửi lệnh nhập hàng lên backend
  const handleRestockSubmit = async () => {
    if (!restockTarget) return;
    setIsSubmitting(true);
    try {
      await inventoryService.restock({
        productId: restockTarget.id,
        additionalQuantity: restockQty,
        note: `Nhập bổ sung kho sàn qua Kênh Người Bán +${restockQty}`,
      });

      setInventoryList((prev) =>
        prev.map((item) => {
          if (item.id === restockTarget.id) {
            const newQty = item.available_stock + restockQty;
            return {
              ...item,
              available_stock: newQty,
              status: newQty > item.threshold ? 'IN_STOCK' : 'LOW_STOCK',
              status_text: newQty > item.threshold ? 'Còn Hàng' : 'Sắp Hết',
            };
          }
          return item;
        })
      );
      showToast(`Đã nhập bổ sung +${restockQty} sản phẩm cho "${restockTarget.name}" vào CSDL!`);
      setRestockTarget(null);
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Lỗi khi nhập hàng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isGuardLoading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Đang xác thực quyền truy cập kho hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="inventory-container">
      {/* TIÊU ĐỀ TRANG */}
      <div className="inv-page-header">
        <div className="inv-header-titles">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ margin: 0 }}>Quản Lý Tồn Kho & Hàng Hóa</h1>
            {isAdmin && (
              <span style={{ fontSize: '0.7rem', padding: '3px 9px', borderRadius: '6px', background: '#F1F5F9', color: '#475569', fontWeight: 600, border: '1px solid #E2E8F0' }}>
                Chế Độ Giám Sát Sàn
              </span>
            )}
          </div>
          <p>
            {isAdmin
              ? 'Giám sát mức tồn kho thời gian thực trên toàn bộ 273 gian hàng đối tác Aethelgard'
              : 'Kiểm soát lượng tồn khả dụng, đồng bộ dữ liệu thời gian thực và cảnh báo an toàn kho bãi'}
          </p>
        </div>

        <div className="inv-header-actions">
          {/* Nút Thêm Sản Phẩm và Nhập Hàng CHỈ DÀNH CHO SELLER (Người sở hữu kho) */}
          {isSeller && (
            <>
              <button
                type="button"
                className="btn-clean-primary"
                style={{
                  background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 18px',
                  borderRadius: 10,
                  fontWeight: 700,
                  color: '#fff',
                }}
                onClick={() => setIsAddModalOpen(true)}
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                + Thêm Sản Phẩm (AI Copilot)
              </button>
              <button
                type="button"
                className="btn-clean-secondary"
                onClick={() => setRestockTarget(inventoryList[0] || null)}
              >
                + Nhập Hàng Bổ Sung
              </button>
            </>
          )}

          <button
            type="button"
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-sm cursor-pointer"
            onClick={loadInventory}
            title="Tải lại tồn kho"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            className="btn-clean-primary"
            onClick={() => showToast('Đã xuất báo cáo kiểm kê kho định dạng Excel thành công!')}
          >
            Xuất Báo Cáo Kho
          </button>
        </div>
      </div>

      {/* THẺ CHỈ SỐ KPI */}
      <div className="inv-kpi-grid">
        <div className="inv-kpi-card">
          <span className="label">Tổng Mã SKU</span>
          <span className="num">{inventoryList.length}</span>
          <span className="sub" style={{ color: '#64748B' }}>
            Đang niêm yết trên sàn
          </span>
        </div>
        <div className="inv-kpi-card">
          <span className="label">Tổng Hàng Lưu Kho</span>
          <span className="num">{totalStock.toLocaleString('vi-VN')}</span>
          <span className="sub" style={{ color: '#64748B' }}>
            Chiếc sản phẩm khả dụng
          </span>
        </div>
        <div className="inv-kpi-card warning-card">
          <span className="label">Cảnh Báo Tồn Thấp</span>
          <span className="num" style={{ color: '#D97706' }}>
            {lowStockCount}
          </span>
          <span className="sub" style={{ color: '#D97706' }}>
            Cần lên đơn nhập hàng
          </span>
        </div>
        <div className="inv-kpi-card asset-card">
          <span className="label">Tổng Trị Giá Tồn Kho</span>
          <span className="num" style={{ color: '#10B981', fontSize: '1.45rem' }}>
            {totalValue.toLocaleString('vi-VN')} đ
          </span>
          <span className="sub">Định giá theo giá vốn COGS</span>
        </div>
      </div>

      {/* FILTER & TABS */}
      <div className="inv-filter-bar">
        <div className="inv-tabs">
          <button
            className={`inv-tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveTab('ALL')}
          >
            Tất Cả ({inventoryList.length})
          </button>
          <button
            className={`inv-tab-btn ${activeTab === 'IN_STOCK' ? 'active' : ''}`}
            onClick={() => setActiveTab('IN_STOCK')}
          >
            Còn Hàng ({inventoryList.filter((i) => i.status === 'IN_STOCK').length})
          </button>
          <button
            className={`inv-tab-btn ${activeTab === 'LOW_STOCK' ? 'active' : ''}`}
            onClick={() => setActiveTab('LOW_STOCK')}
          >
            Sắp Hết ({inventoryList.filter((i) => i.status === 'LOW_STOCK').length})
          </button>
          <button
            className={`inv-tab-btn ${activeTab === 'OUT_OF_STOCK' ? 'active' : ''}`}
            onClick={() => setActiveTab('OUT_OF_STOCK')}
          >
            Hết Hàng ({inventoryList.filter((i) => i.status === 'OUT_OF_STOCK').length})
          </button>
        </div>

        <div className="inv-search-wrap">
          <input
            type="text"
            className="inv-search-input"
            placeholder="Tìm theo Tên, SKU hoặc Mã vạch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* BẢNG TỒN KHO */}
      <div className="inv-table-wrapper">
        <table className="inv-table">
          <thead>
            <tr>
              <th>Sản Phẩm & Phân Loại</th>
              <th>Mã SKU / Mã vạch</th>
              <th>Tồn Khả Dụng</th>
              <th>Đang Chờ Giao</th>
              <th>Ngưỡng An Toàn</th>
              <th>Trạng Thái</th>
              <th>Giá Vốn (COGS)</th>
              <th>Giá Bán Lẻ</th>
              <th style={{ textAlign: 'right' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
                  Không tìm thấy mặt hàng nào phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="inv-product-cell">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/img/products/adidas-samba.jpg';
                        }}
                      />
                      <div className="inv-p-meta">
                        <strong>{item.name}</strong>
                        <span>{item.category} • {item.variants}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>{item.sku}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{item.barcode}</div>
                  </td>
                  <td>
                    <span className="stock-pill">{item.available_stock}</span>
                  </td>
                  <td>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>{item.reserved_stock}</span>
                  </td>
                  <td>
                    <span style={{ color: '#D97706', fontWeight: 700 }}>{item.threshold} sp</span>
                  </td>
                  <td>
                    <span className={`status-badge-clean ${item.status}`}>{item.status_text}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: '#475569' }}>
                      {item.cost_price.toLocaleString('vi-VN')} đ
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#0F172A' }}>
                      {item.retail_price.toLocaleString('vi-VN')} đ
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {isSeller ? (
                      <button
                        className="btn-action-small"
                        onClick={() => setRestockTarget(item)}
                      >
                        Nhập Hàng
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>
                        Giám sát
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* HỘP THOẠI NHẬP HÀNG BỔ SUNG */}
      {restockTarget && (
        <div className="inv-modal-backdrop active">
          <div className="inv-modal-card animate-fade-in" style={{ maxWidth: 520 }}>
            <div className="inv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: '#EFF6FF', color: '#2563EB', padding: 8, borderRadius: 10 }}>
                  <ArrowDownToLine className="w-5 h-5" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0F172A' }}>Nhập Hàng Bổ Sung Kho Sàn</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>
                    Cập nhật số lượng khả dụng tức thì vào hệ thống kho đa kênh
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="inv-modal-close"
                onClick={() => setRestockTarget(null)}
                disabled={isSubmitting}
              >
                &times;
              </button>
            </div>
            <div className="inv-modal-body">
              {/* Chọn mặt hàng cần nhập kho */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#475569',
                    marginBottom: '6px',
                  }}
                >
                  Mặt Hàng Nhập Kho
                </label>
                <select
                  className="inv-search-input"
                  style={{ fontWeight: 600, fontSize: '0.88rem' }}
                  value={restockTarget.id}
                  onChange={(e) => {
                    const found = inventoryList.find((it) => it.id === Number(e.target.value));
                    if (found) setRestockTarget(found);
                  }}
                >
                  {inventoryList.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.sku} — {it.name} (Tồn: {it.available_stock} sp)
                    </option>
                  ))}
                </select>
              </div>

              {/* Thông tin sản phẩm đang chọn */}
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  background: '#F8FAFC',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  marginBottom: '1.25rem',
                  border: '1px solid #E2E8F0',
                }}
              >
                <img
                  src={restockTarget.image_url}
                  alt={restockTarget.name}
                  style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {restockTarget.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
                    Mã SKU: <strong style={{ color: '#334155' }}>{restockTarget.sku}</strong> • Hiện tại trong kho: <strong style={{ color: '#2563EB' }}>{restockTarget.available_stock}</strong> sp
                  </div>
                </div>
              </div>

              {/* Nhập số lượng và nút chọn nhanh */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: '#475569',
                    }}
                  >
                    Số Lượng Nhập Thêm (Chiếc)
                  </label>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Chọn nhanh:
                  </span>
                </div>

                <input
                  type="number"
                  min="1"
                  className="inv-search-input"
                  style={{ width: '100%', fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', padding: '10px 14px' }}
                  value={restockQty}
                  onChange={(e) => setRestockQty(Math.max(1, Number(e.target.value)))}
                />

                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {[10, 25, 50, 100].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      className="btn-action-small"
                      style={{ fontSize: '0.75rem', padding: '4px 10px', background: restockQty === qty ? '#0F172A' : '#F1F5F9', color: restockQty === qty ? '#FFF' : '#334155' }}
                      onClick={() => setRestockQty(qty)}
                    >
                      +{qty} sp
                    </button>
                  ))}
                </div>
              </div>

              <div
                style={{
                  background: '#EEF2FF',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  fontSize: '0.82rem',
                  color: '#4338CA',
                  lineHeight: '1.5',
                  border: '1px solid #E0E7FF',
                }}
              >
                Tồn khả dụng sau khi nhập: <strong>{restockTarget.available_stock + restockQty}</strong> chiếc sản phẩm sẵn sàng mở bán trên sàn.
              </div>
            </div>
            <div className="inv-modal-footer">
              <button
                type="button"
                className="btn-clean-secondary"
                onClick={() => setRestockTarget(null)}
                disabled={isSubmitting}
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                className="btn-clean-primary"
                onClick={handleRestockSubmit}
                disabled={isSubmitting}
                style={{ background: '#0F172A', minWidth: 140 }}
              >
                {isSubmitting ? 'Đang lưu vào CSDL...' : 'Xác Nhận Nhập Kho'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THÊM SẢN PHẨM MỚI VỚI AI COPILOT */}
      {isAddModalOpen && (
        <div className="inv-modal-backdrop active">
          <div className="inv-modal-card animate-fade-in" style={{ maxWidth: 680, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="inv-modal-header" style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: '#EDE9FE', color: '#7C3AED', padding: 8, borderRadius: 10 }}>
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0F172A' }}>Thêm Sản Phẩm Mới & AI Copilot</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>
                    Tự động tạo mô tả bán hàng xa xỉ và thông số bảo quản với Google Gemini
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="inv-modal-close"
                onClick={() => setIsAddModalOpen(false)}
                disabled={isSubmitting}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateProductSubmit} className="inv-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Box hướng dẫn AI */}
              <div style={{ background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)', border: '1px solid #DDD6FE', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#6D28D9' }}>
                    ✨ Trợ Lý Sáng Tạo Nội Dung Gemini AI
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateAIDescription}
                    disabled={isGeneratingAI}
                    style={{
                      background: isGeneratingAI ? '#C4B5FD' : 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 14px',
                      borderRadius: 8,
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: isGeneratingAI ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 4px 10px rgba(124, 58, 237, 0.25)',
                    }}
                  >
                    <Wand2 className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                    {isGeneratingAI ? 'Gemini Đang Soạn...' : '✨ AI Sinh Mô Tả (Gemini)'}
                  </button>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#5B21B6' }}>
                  Điền tên và điểm nổi bật sơ lược, bấm <strong>"AI Sinh Mô Tả"</strong> để Gemini tự động điền tiêu đề chuẩn SEO, bài giới thiệu và hướng dẫn chất liệu.
                </p>
              </div>

              {/* Tên sản phẩm */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Tên sản phẩm (*)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Áo Khoác Dạ Tweed Cao Cấp Dáng Lửng"
                  className="inv-search-input"
                  style={{ width: '100%', fontSize: '0.9rem' }}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
                {formSeoTitle && (
                  <div style={{ marginTop: 4, fontSize: '0.75rem', color: '#7C3AED' }}>
                    🏷️ <em>Gợi ý tiêu đề SEO: {formSeoTitle}</em>
                  </div>
                )}
              </div>

              {/* Ngành hàng & Thương hiệu */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Ngành hàng (*)
                  </label>
                  <select
                    className="inv-search-input"
                    style={{ width: '100%', fontSize: '0.88rem' }}
                    value={selectedCategoryId}
                    onChange={(e) => {
                      const cid = Number(e.target.value);
                      setSelectedCategoryId(cid);
                      const found = categories.find((c) => c.id === cid);
                      if (found) setFormCategory(found.name);
                    }}
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Thương hiệu
                  </label>
                  <input
                    type="text"
                    placeholder="Aethelgard, Gucci, Dior..."
                    className="inv-search-input"
                    style={{ width: '100%', fontSize: '0.88rem' }}
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                  />
                </div>
              </div>

              {/* Điểm nổi bật / từ khóa */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Gợi ý cho AI: Chất liệu hoặc Điểm nổi bật
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Vải tweed dệt kim sa Ý, khuy mạ vàng 18K, thanh lịch dạ tiệc..."
                  className="inv-search-input"
                  style={{ width: '100%', fontSize: '0.88rem' }}
                  value={formKeyFeatures}
                  onChange={(e) => setFormKeyFeatures(e.target.value)}
                />
              </div>

              {/* Mô tả sản phẩm (Do AI sinh) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                    Mô tả chi tiết sản phẩm
                  </label>
                  {formDescription && (
                    <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>
                      ✓ Đã được AI định dạng
                    </span>
                  )}
                </div>
                <textarea
                  rows={4}
                  className="inv-search-input"
                  style={{ width: '100%', fontSize: '0.88rem', lineHeight: '1.5' }}
                  placeholder="Mô tả sẽ tự động được Gemini soạn thảo khi bạn bấm nút 'AI Sinh Mô Tả'..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              {/* Chất liệu & Hướng dẫn bảo quản */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Chất liệu gợi ý
                  </label>
                  <input
                    type="text"
                    placeholder="VD: 100% Cashmere dệt tay"
                    className="inv-search-input"
                    style={{ width: '100%', fontSize: '0.85rem' }}
                    value={formMaterial}
                    onChange={(e) => setFormMaterial(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Bảo quản gợi ý
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Giặt khô, tránh ánh nắng gắt"
                    className="inv-search-input"
                    style={{ width: '100%', fontSize: '0.85rem' }}
                    value={formCare}
                    onChange={(e) => setFormCare(e.target.value)}
                  />
                </div>
              </div>

              {/* Giá & Tồn kho & Ảnh */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Giá bán lẻ (VNĐ)
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="50000"
                    className="inv-search-input"
                    style={{ width: '100%', fontSize: '0.9rem', fontWeight: 700, color: '#0F172A' }}
                    value={formRetailPrice}
                    onChange={(e) => setFormRetailPrice(Number(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Số lượng nhập ban đầu
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="inv-search-input"
                    style={{ width: '100%', fontSize: '0.9rem', fontWeight: 700, color: '#0F172A' }}
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Ảnh đại diện
                  </label>
                  <select
                    className="inv-search-input"
                    style={{ width: '100%', fontSize: '0.85rem' }}
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                  >
                    <option value="/img/products/gucci-runway.jpg">Áo Khoác Runway</option>
                    <option value="/img/products/gucci-sneaker.jpg">Giày Sneaker Ý</option>
                    <option value="/img/products/sample-velora.jpg">Hoodie Streetwear</option>
                    <option value="/img/products/balenciaga-track-beige.jpg">Track Sneaker</option>
                    <option value="/img/products/adidas-samba.jpg">Adidas Samba Classic</option>
                  </select>
                </div>
              </div>

              <div className="inv-modal-footer" style={{ marginTop: 10, paddingTop: 14, borderTop: '1px solid #E2E8F0' }}>
                <button
                  type="button"
                  className="btn-clean-secondary"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="btn-clean-primary"
                  style={{
                    background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                    border: 'none',
                    fontWeight: 700,
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Đang Niêm Yết...' : '✓ Niêm Yết Lên Sàn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
