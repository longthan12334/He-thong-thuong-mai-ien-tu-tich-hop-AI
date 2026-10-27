'use client';
import '@/styles/inventory.css';

import React, { useState, useMemo, useEffect } from 'react';
import { inventoryService } from '@/services/inventory.service';
import { aiService } from '@/services/ai.service';
import { productService } from '@/services/product.service';
import { useToast } from '@/hooks/useToast';
import { useSellerGuard } from '@/hooks/useSellerGuard';
import { useStockAudit } from '@/hooks/useStockAudit';
import { formatVND, exportToCsv } from '@/lib/utils';
import { InventoryTableRowSkeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import {
  RefreshCw,
  Package,
  AlertTriangle,
  ArrowDownToLine,
  DollarSign,
  Sparkles,
  Plus,
  Wand2,
  CheckCircle2,
  Tag,
  History,
  CheckSquare,
  Square,
  Eye,
  EyeOff,
  X,
  FileSpreadsheet,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

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
  is_active: boolean;
}


export default function InventoryPage() {
  const { isAuthorized, isLoading: isGuardLoading } = useSellerGuard('/');
  const { showToast } = useToast();

  const [inventoryList, setInventoryList] = useState<InvItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [displayLimit, setDisplayLimit] = useState(25);
  const [isTabFading, setIsTabFading] = useState(false);

  // Debounce ô tìm kiếm 300ms (Item 46)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset phân trang và tạo hiệu ứng mờ chồng cross-fade khi đổi tab (Item 5)
  const handleTabChange = (tab: 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK') => {
    if (tab === activeTab) return;
    setIsTabFading(true);
    setActiveTab(tab);
    setDisplayLimit(25);
    setTimeout(() => setIsTabFading(false), 150);
  };
  const [restockTarget, setRestockTarget] = useState<InvItem | null>(null);
  const [restockQty, setRestockQty] = useState(25);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Batch / Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isBulkOperating, setIsBulkOperating] = useState(false);

  // Hook Quản lý Nhật Ký Biến Động Kho (Item 39)
  const { auditLogs, isAuditModalOpen, setIsAuditModalOpen, addAuditLog: saveAuditLog } = useStockAudit();

  // State cho hiệu ứng số tồn kho nhảy nhẹ (Item 15)
  const [bumpedStockId, setBumpedStockId] = useState<number | null>(null);

  // State cho Thêm Sản Phẩm Mới (Item 40 - Consolidated Form State)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Áo Khoác & Outerwear');
  const [formBrand, setFormBrand] = useState('Aethelgard Boutique');
  const [formKeyFeatures, setFormKeyFeatures] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formMaterial, setFormMaterial] = useState('');
  const [formCare, setFormCare] = useState('');
  const [formSeoTitle, setFormSeoTitle] = useState('');
  const [formRetailPrice, setFormRetailPrice] = useState(3850000);
  const [formStock, setFormStock] = useState(30);
  const [formImageUrl, setFormImageUrl] = useState('/img/products/gucci-runway.jpg');

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
          reserved_stock: it.reservedStock !== undefined ? it.reservedStock : 0,
          threshold: it.safetyThreshold || 10,
          status: (it.stockStatus as any) || (it.stockQuantity > 10 ? 'IN_STOCK' : it.stockQuantity > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK'),
          status_text: it.stockQuantity > 10 ? 'Còn Hàng' : it.stockQuantity > 0 ? 'Sắp Hết' : 'Hết Hàng',
          cost_price: it.costPrice !== undefined && it.costPrice > 0 ? it.costPrice : Math.round((it.price || 0) * 0.6),
          retail_price: it.price || 2000000,
          image_url: it.imageUrl || '/img/products/adidas-samba.jpg',
          is_active: it.isActive !== false,
        }));
        setInventoryList(mapped);
      }
    } catch {
      showToast('Không thể kết nối máy chủ tồn kho. Đang thử lại...');
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

  // Tạo sản phẩm mới
  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Vui lòng nhập tên sản phẩm.');
      return;
    }

    setIsSubmitting(true);
    try {
      const catMapping: Record<string, number> = {
        'Áo Khoác & Outerwear': 1,
        'Giày Sneaker Cao Cấp': 2,
        'Túi Xách Da Cao Cấp': 3,
        'Đầm Dạ Hội & Váy Sang Trọng': 4,
        'Phụ Kiện & Đồng Hồ': 5,
      };

      const payload = {
        name: formName.trim(),
        categoryId: catMapping[formCategory] || 1,
        sku: `AG-${Date.now().toString().slice(-5)}`,
        collectionName: formBrand || 'Aethelgard 2026',
        description: formDescription.trim() || `Sản phẩm thời trang cao cấp ${formName}.`,
        material: formMaterial.trim() || 'Vải cao cấp',
        careInstructions: formCare.trim() || 'Bảo quản nơi thoáng mát',
        basePrice: formRetailPrice,
        originalPrice: Math.round(formRetailPrice * 1.15),
        costPrice: Math.round(formRetailPrice * 0.6),
        stockQuantity: formStock,
        imageUrl: formImageUrl,
        slug: formName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4),
      };

      const created = await productService.createProduct(payload);
      if (created) {
        showToast(`🎉 Đã niêm yết thành công sản phẩm "${created.name}" lên sàn!`);
        setIsAddModalOpen(false);
        saveAuditLog({
          productName: created.name,
          sku: created.sku,
          change: formStock,
          newStock: formStock,
          type: 'RESTOCK',
          note: 'Tạo mới sản phẩm và nhập kho ban đầu',
          actor: 'Người bán (Seller)',
        });
        await loadInventory();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Không thể tạo sản phẩm lúc này.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle active/draft status per product
  const handleToggleStatus = async (item: InvItem) => {
    try {
      const res = await productService.toggleProductStatus(item.id);
      setInventoryList((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_active: res.isActive } : i))
      );
      saveAuditLog({
        productName: item.name,
        sku: item.sku,
        change: 0,
        newStock: item.available_stock,
        type: 'STATUS_CHANGE',
        note: res.isActive ? 'Kích hoạt hiển thị lên sàn' : 'Chuyển sang bản nháp (ẩn)',
        actor: 'Người bán (Seller)',
      });
      showToast(res.message || 'Đã cập nhật trạng thái niêm yết.');
    } catch {
      showToast('Không thể thay đổi trạng thái sản phẩm lúc này.');
    }
  };

  // Lọc sản phẩm
  const filteredItems = useMemo(() => {
    let list = inventoryList;
    if (activeTab === 'IN_STOCK') {
      list = list.filter((i) => i.status === 'IN_STOCK');
    } else if (activeTab === 'LOW_STOCK') {
      list = list.filter((i) => i.status === 'LOW_STOCK');
    } else if (activeTab === 'OUT_OF_STOCK') {
      list = list.filter((i) => i.status === 'OUT_OF_STOCK');
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.sku.toLowerCase().includes(q) ||
          i.barcode.toLowerCase().includes(q)
      );
    }
    return list;
  }, [inventoryList, activeTab, debouncedSearch]);

  const visibleItems = useMemo(() => {
    return filteredItems.slice(0, displayLimit);
  }, [filteredItems, displayLimit]);

  // Bulk actions logic
  const isAllSelected = filteredItems.length > 0 && filteredItems.every((item) => selectedIds.has(item.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((item) => item.id)));
    }
  };

  const toggleSelectItem = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Bulk Restock +10
  const handleBulkRestock = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkOperating(true);
    try {
      const targetItems = inventoryList.filter((item) => selectedIds.has(item.id));
      await Promise.all(
        targetItems.map((item) =>
          inventoryService.restock({ productId: item.id, additionalQuantity: 10 })
        )
      );

      setInventoryList((prev) =>
        prev.map((item) => {
          if (selectedIds.has(item.id)) {
            const newQty = item.available_stock + 10;
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

      targetItems.forEach((item) => {
        saveAuditLog({
          productName: item.name,
          sku: item.sku,
          change: 10,
          newStock: item.available_stock + 10,
          type: 'RESTOCK',
          note: 'Thao tác nhập kho hàng loạt (+10 chiếc)',
          actor: 'Người bán (Seller)',
        });
      });

      showToast(`Đã nhập bổ sung +10 chiếc cho ${selectedIds.size} sản phẩm thành công!`);
      setSelectedIds(new Set());
    } catch {
      showToast('Đã xảy ra lỗi trong quá trình nhập hàng loạt.');
    } finally {
      setIsBulkOperating(false);
    }
  };

  // Bulk Toggle Status
  const handleBulkToggleStatus = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkOperating(true);
    try {
      const targetItems = inventoryList.filter((item) => selectedIds.has(item.id));
      await Promise.all(targetItems.map((item) => productService.toggleProductStatus(item.id)));
      await loadInventory();
      showToast(`Đã cập nhật trạng thái niêm yết cho ${selectedIds.size} sản phẩm!`);
      setSelectedIds(new Set());
    } catch {
      showToast('Không thể thay đổi trạng thái hàng loạt lúc này.');
    } finally {
      setIsBulkOperating(false);
    }
  };

  const totalStock = inventoryList.reduce((sum, item) => sum + item.available_stock, 0);
  const lowStockCount = inventoryList.filter((item) => item.status === 'LOW_STOCK' || item.status === 'OUT_OF_STOCK').length;
  const totalValue = inventoryList.reduce((sum, item) => sum + item.available_stock * item.cost_price, 0);

  // Xử lý gửi lệnh nhập hàng đơn chiếc
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

      saveAuditLog({
        productName: restockTarget.name,
        sku: restockTarget.sku,
        change: restockQty,
        newStock: restockTarget.available_stock + restockQty,
        type: 'RESTOCK',
        note: `Nhập kho bổ sung +${restockQty} chiếc`,
        actor: 'Người bán (Seller)',
      });

      showToast(`Đã nhập bổ sung +${restockQty} sản phẩm cho "${restockTarget.name}" vào CSDL!`);
      setRestockTarget(null);
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Lỗi khi nhập hàng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xuất file CSV kho hàng dùng utility tập trung (Item 38)
  const handleExportInventoryCSV = () => {
    if (inventoryList.length === 0) {
      showToast('Không có dữ liệu tồn kho để xuất.');
      return;
    }
    exportToCsv(
      filteredItems,
      [
        { key: 'sku', label: 'Mã SKU' },
        { key: 'name', label: 'Tên Mặt Hàng' },
        { key: 'category', label: 'Danh Mục' },
        { key: 'available_stock', label: 'Tồn Kho Khả Dụng' },
        { key: 'reserved_stock', label: 'Đang Chờ Giao' },
        { key: 'threshold', label: 'Định Mức An Toàn' },
        { key: 'status_text', label: 'Trạng Thái Kho' },
        { key: (item) => formatVND(item.cost_price), label: 'Giá Vốn COGS' },
        { key: (item) => formatVND(item.retail_price), label: 'Giá Niêm Yết' },
        { key: (item) => (item.is_active ? 'Đang Bán' : 'Tạm Ẩn'), label: 'Hiển Thị Sàn' },
      ],
      `Aethelgard_TonKho_${new Date().toISOString().slice(0, 10)}.csv`
    );
    showToast(`Đã xuất thành công ${filteredItems.length} sản phẩm ra file CSV Excel!`);
  };

  if (isGuardLoading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Đang xác thực quyền truy cập kho hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="inventory-container pb-28">
      {/* TIÊU ĐỀ TRANG */}
      <div className="inv-page-header">
        <div className="inv-header-titles">
          <h1>Quản Lý Tồn Kho & Hàng Hóa</h1>
          <p>Kiểm soát lượng tồn khả dụng, đồng bộ dữ liệu thời gian thực và ghi nhận biến động kho</p>
        </div>

        <div className="inv-header-actions">
          <button
            type="button"
            className="btn-clean-primary"
            style={{
              background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
              border: 'none',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
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
            className="btn-clean-secondary flex items-center gap-2"
            onClick={() => setIsAuditModalOpen(true)}
          >
            <History className="w-4 h-4 text-sky-600" />
            <span>Nhật Ký Biến Động Kho</span>
          </button>
          <button
            type="button"
            className="btn-clean-secondary flex items-center gap-1.5"
            onClick={handleExportInventoryCSV}
            title="Xuất danh sách tồn kho ra file CSV/Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Xuất CSV</span>
          </button>
          <button
            type="button"
            className="btn-clean-secondary"
            onClick={() => setRestockTarget(inventoryList[0] || null)}
          >
            + Nhập Hàng Bổ Sung
          </button>
          <button
            type="button"
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-sm cursor-pointer"
            onClick={loadInventory}
            title="Tải lại tồn kho"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
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
          <span className="num" style={{ color: '#0284C7', fontSize: '1.45rem' }}>
            {formatVND(totalValue)}
          </span>
          <span className="sub">Định giá theo giá vốn COGS thực tế</span>
        </div>
      </div>

      {/* FILTER & TABS */}
      <div className="inv-filter-bar">
        <div className="inv-tabs">
          <button
            className={`inv-tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
            onClick={() => handleTabChange('ALL')}
          >
            Tất Cả ({inventoryList.length})
          </button>
          <button
            className={`inv-tab-btn ${activeTab === 'IN_STOCK' ? 'active' : ''}`}
            onClick={() => handleTabChange('IN_STOCK')}
          >
            Còn Hàng ({inventoryList.filter((i) => i.status === 'IN_STOCK').length})
          </button>
          <button
            className={`inv-tab-btn ${activeTab === 'LOW_STOCK' ? 'active' : ''}`}
            onClick={() => handleTabChange('LOW_STOCK')}
          >
            Sắp Hết ({inventoryList.filter((i) => i.status === 'LOW_STOCK').length})
          </button>
          <button
            className={`inv-tab-btn ${activeTab === 'OUT_OF_STOCK' ? 'active' : ''}`}
            onClick={() => handleTabChange('OUT_OF_STOCK')}
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
              <th style={{ width: 40, textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                  title="Chọn tất cả"
                />
              </th>
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
          <tbody className={`transition-opacity duration-200 ${isTabFading ? 'opacity-40' : 'opacity-100'}`}>
            {loading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <InventoryTableRowSkeleton key={`skeleton-${idx}`} />
              ))
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
                  Không tìm thấy mặt hàng nào phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
            ) : (
              visibleItems.map((item) => {
                const isSelected = selectedIds.has(item.id);
                return (
                  <tr key={item.id} className={isSelected ? 'bg-sky-50/40' : ''}>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectItem(item.id)}
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                      />
                    </td>
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
                          <strong className="flex items-center gap-1.5">
                            <span>{item.name}</span>
                            {!item.is_active && (
                              <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded font-semibold">
                                Nháp (Ẩn)
                              </span>
                            )}
                          </strong>
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
                      <span style={{ color: item.reserved_stock > 0 ? '#0284C7' : '#64748B', fontWeight: 700 }}>
                        {item.reserved_stock} sp
                      </span>
                    </td>
                    <td>
                      <span style={{ color: '#D97706', fontWeight: 700 }}>{item.threshold} sp</span>
                    </td>
                    <td>
                      <span className={`status-badge-clean ${item.status}`}>{item.status_text}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#475569' }}>
                        {formatVND(item.cost_price)}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#0F172A' }}>
                        {formatVND(item.retail_price)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                          onClick={() => handleToggleStatus(item)}
                          title={item.is_active ? 'Chuyển sang Nháp (Ẩn)' : 'Kích hoạt hiển thị'}
                        >
                          {item.is_active ? (
                            <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                          )}
                        </button>
                        <button
                          type="button"
                          className="btn-action-small"
                          onClick={() => setRestockTarget(item)}
                        >
                          Nhập Hàng
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {displayLimit < filteredItems.length && (
        <div className="flex justify-center mt-6 mb-4">
          <button
            type="button"
            onClick={() => setDisplayLimit((prev) => prev + 25)}
            className="px-6 py-2.5 rounded-full bg-white border border-slate-200 text-slate-800 text-xs font-bold shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Tải thêm 25 mặt hàng</span>
            <span className="text-[11px] text-slate-400 font-semibold">
              {`(Đang xem ${visibleItems.length} / ${filteredItems.length})`}
            </span>
          </button>
        </div>
      )}

      {/* FLOATING BOTTOM BATCH ACTION BAR (HÀNH ĐỘNG HÀNG LOẠT) */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 animate-fade-in max-w-xl w-[92%] sm:w-auto">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center">
              {selectedIds.size}
            </span>
            <span className="text-xs font-semibold whitespace-nowrap">sản phẩm đã chọn</span>
          </div>

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleBulkRestock}
              disabled={isBulkOperating}
              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Package className="w-3.5 h-3.5" />
              <span>+ Nhập Kho (+10)</span>
            </button>
            <button
              type="button"
              onClick={handleBulkToggleStatus}
              disabled={isBulkOperating}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Đổi Bật/Ẩn</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs transition-colors cursor-pointer"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* HỘP THOẠI NHẬP HÀNG ĐƠN CHIẾC */}
      {restockTarget && (
        <div className="inv-modal-backdrop active">
          <div className="inv-modal-card animate-fade-in">
            <div className="inv-modal-header">
              <h3>Nhập Hàng Bổ Sung</h3>
              <button
                className="inv-modal-close"
                onClick={() => setRestockTarget(null)}
                disabled={isSubmitting}
              >
                &times;
              </button>
            </div>
            <div className="inv-modal-body">
              <p style={{ fontSize: '0.88rem', color: '#475569', marginBottom: '1.25rem' }}>
                Ghi nhận số lượng sản phẩm nhập kho thực tế từ nhà máy/xưởng cho mã SKU:
              </p>

              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  background: '#F8FAFC',
                  padding: '12px',
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
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{restockTarget.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Mã SKU: {restockTarget.sku} • Hiện tại trong kho: <strong>{restockTarget.available_stock}</strong> sp
                  </div>
                </div>
              </div>

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
                  Số Lượng Nhập Bổ Sung (Chiếc)
                </label>
                <input
                  type="number"
                  min="1"
                  className="inv-search-input"
                  style={{ width: '100%', fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}
                  value={restockQty}
                  onChange={(e) => setRestockQty(Math.max(1, Number(e.target.value)))}
                />
              </div>

              <div
                style={{
                  background: '#F0F9FF',
                  padding: '12px',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  color: '#0369A1',
                  lineHeight: '1.5',
                  border: '1px solid #BAE6FD',
                }}
              >
                Số lượng tồn sau khi nhập: <strong>{restockTarget.available_stock + restockQty}</strong> chiếc sản phẩm khả dụng trên sàn.
              </div>
            </div>
            <div className="inv-modal-footer">
              <button
                className="btn-clean-secondary"
                onClick={() => setRestockTarget(null)}
                disabled={isSubmitting}
              >
                Hủy Bỏ
              </button>
              <button
                className="btn-clean-primary"
                style={{ background: '#0284C7' }}
                onClick={handleRestockSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang lưu vào CSDL...' : 'Xác Nhận Nhập Kho'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER NHẬT KÝ BIẾN ĐỘNG KHO MƯỢT MÀ (Item 17 & 19) */}
      <Modal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        size="2xl"
        title={
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-200">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Nhật Ký Biến Động Kho Hàng</h3>
              <p className="text-xs text-slate-500">Lịch sử xuất nhập kho và thay đổi tồn kho thực tế</p>
            </div>
          </div>
        }
      >
        <div className="py-2 space-y-3">
              {auditLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Chưa có nhật ký biến động kho nào được ghi nhận gần đây.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 truncate">{log.productName}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono text-[10px]">
                          {log.sku}
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px] flex items-center gap-2">
                        <span>{log.note}</span>
                        <span>•</span>
                        <span>{log.timestamp}</span>
                        <span>•</span>
                        <span className="text-slate-700 font-medium">{log.actor}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {log.change > 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          +{log.change} sp
                        </span>
                      ) : log.change < 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-xs font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                          <ArrowDownRight className="w-3.5 h-3.5" />
                          {log.change} sp
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                          Cập nhật
                        </span>
                      )}
                      <div className="text-[10px] text-slate-400 mt-1">
                        Tồn sau đổi: <strong>{log.newStock}</strong>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
              <span>Hiển thị tối đa 50 sự kiện gần nhất</span>
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold cursor-pointer hover:bg-slate-800"
              >
                Đóng
              </button>
            </div>
      </Modal>

      {/* MODAL THÊM SẢN PHẨM MỚI VỚI AI COPILOT */}
      {isAddModalOpen && (
        <div className="inv-modal-backdrop active">
          <div className="inv-modal-card animate-fade-in" style={{ maxWidth: 680, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="inv-modal-header" style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: '#E0F2FE', color: '#0284C7', padding: 8, borderRadius: 10 }}>
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
                className="inv-modal-close"
                onClick={() => setIsAddModalOpen(false)}
                disabled={isSubmitting}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateProductSubmit} className="inv-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Box hướng dẫn AI */}
              <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0369A1' }}>
                    ✨ Trợ Lý Sáng Tạo Nội Dung Gemini AI
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateAIDescription}
                    disabled={isGeneratingAI}
                    style={{
                      background: isGeneratingAI ? '#93C5FD' : '#0284C7',
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
                      boxShadow: '0 4px 10px rgba(2, 132, 199, 0.25)',
                    }}
                  >
                    <Wand2 className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                    {isGeneratingAI ? 'Gemini Đang Soạn...' : '✨ AI Sinh Mô Tả (Gemini)'}
                  </button>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#0369A1' }}>
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
                  <div style={{ marginTop: 4, fontSize: '0.75rem', color: '#0284C7' }}>
                    🏷️ <em>Gợi ý tiêu đề SEO: {formSeoTitle}</em>
                  </div>
                )}
              </div>

              {/* Ngành hàng & Thương hiệu */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Ngành hàng
                  </label>
                  <select
                    className="inv-search-input"
                    style={{ width: '100%', fontSize: '0.88rem' }}
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                  >
                    <option value="Áo Khoác & Outerwear">Áo Khoác & Outerwear</option>
                    <option value="Giày Sneaker Cao Cấp">Giày Sneaker Cao Cấp</option>
                    <option value="Túi Xách Da Cao Cấp">Túi Xách Da Cao Cấp</option>
                    <option value="Đầm Dạ Hội & Váy Sang Trọng">Đầm Dạ Hội & Váy Sang Trọng</option>
                    <option value="Phụ Kiện & Đồng Hồ">Phụ Kiện & Đồng Hồ</option>
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
                    background: '#0284C7',
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
