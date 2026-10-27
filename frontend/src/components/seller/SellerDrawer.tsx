'use client';

import React, { useMemo, useState } from 'react';
import type { Product } from '@/types';
import { formatVND, detectBrand, generateSkuCode } from '@/lib/utils';
import { inventoryService } from '@/services/inventory.service';
import { productService } from '@/services/product.service';
import { Package, Tag, Info, CheckCircle2, AlertCircle, Copy, ExternalLink, Edit3, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';

interface SellerDrawerProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onShowToast: (message: string) => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (product: Product) => void;
  onProductUpdated?: (product: Product) => void;
}

export const SellerDrawer: React.FC<SellerDrawerProps> = ({
  isOpen,
  product,
  onClose,
  onShowToast,
  onEditProduct,
  onDeleteProduct,
  onProductUpdated,
}) => {
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [isRestocking, setIsRestocking] = useState(false);
  const [isStockBumped, setIsStockBumped] = useState(false);

  const brandName = useMemo(() => {
    if (!product) return 'AETHELGARD';
    return detectBrand(product.name);
  }, [product]);

  const skuCode = useMemo(() => {
    if (!product) return 'AE-00101';
    return product.sku || generateSkuCode(product.name, product.id);
  }, [product]);

  if (!product) return null;

  const copySku = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(skuCode);
      onShowToast(`Đã sao chép mã SKU ${skuCode} vào clipboard!`);
    } else {
      onShowToast(`Mã SKU: ${skuCode}`);
    }
  };

  const quickRestock = async () => {
    setIsRestocking(true);
    try {
      await inventoryService.restock({
        productId: product.id,
        additionalQuantity: 10,
      });
      const newStock = (product.stockQuantity || 0) + 10;
      const updatedProduct: Product = {
        ...product,
        stockQuantity: newStock,
        stockStatus: newStock > 10 ? 'IN_STOCK' : 'LOW_STOCK',
      };
      onProductUpdated?.(updatedProduct);
      setIsStockBumped(true);
      setTimeout(() => setIsStockBumped(false), 500);
      onShowToast(`Đã nhập thêm thành công +10 tồn kho cho "${product.name}"!`);
    } catch {
      onShowToast(`Không thể nhập kho lúc này.`);
    } finally {
      setIsRestocking(false);
    }
  };

  const toggleActiveStatus = async () => {
    setIsTogglingStatus(true);
    try {
      const res = await productService.toggleProductStatus(product.id);
      const updatedProduct: Product = {
        ...product,
        isActive: res.isActive,
      };
      onProductUpdated?.(updatedProduct);
      onShowToast(res.message || (res.isActive ? 'Sản phẩm đã hiển thị lên sàn!' : 'Sản phẩm đã chuyển sang nháp (ẩn).'));
    } catch {
      onShowToast('Không thể thay đổi trạng thái sản phẩm lúc này.');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const hasDiscount = Boolean(
    product.originalPrice && product.originalPrice > product.basePrice
  );

  const discountRate = hasDiscount
    ? product.discountPercent ||
      Math.round((1 - product.basePrice / (product.originalPrice || 1)) * 100)
    : 0;

  const isStockAvailable = (product.stockQuantity || 0) > 0;
  const isCurrentlyActive = product.isActive !== false;

  return (
    <div
      id="seller-dual-drawer-backdrop"
      className={`seller-dual-drawer-backdrop ${isOpen ? 'active' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="seller-drawer-wrapper">
        {/* PANEL 1 (BÊN TRÁI): THÔNG TIN KHO HÀNG & THAO TÁC QUẢN LÝ THẬT */}
        <div className="seller-panel seller-panel-secondary">
          <div className="seller-panel-header">
            <h4 className="text-slate-900 font-bold text-sm">Kho Hàng & Vận Hành</h4>
            <span className="sku-tag">SKU #{skuCode}</span>
          </div>

          <div className="seller-panel-body">
            {/* Tồn kho thực tế từ Database */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Tồn Kho Sẵn Có
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isStockAvailable
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {isStockAvailable ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Còn hàng</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3" />
                      <span>Hết hàng</span>
                    </>
                  )}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-black inline-block transition-all duration-300 ${
                  isStockBumped ? 'scale-125 text-sky-600' : 'scale-100 text-slate-900'
                }`}>
                  {product.stockQuantity ?? 0}
                </span>
                <span className="text-xs font-medium text-slate-500">sản phẩm khả dụng</span>
              </div>
            </div>

            {/* Trạng thái Bật/Tắt Niêm Yết Sàn (Active / Draft Toggle - Item 13) */}
            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">Trạng Thái Hiển Thị Sàn</span>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md transition-colors duration-300 ${
                    isCurrentlyActive
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isCurrentlyActive ? 'Đang Hiển Thị' : 'Tạm Ẩn / Nháp'}
                </span>
              </div>
              <button
                type="button"
                onClick={toggleActiveStatus}
                disabled={isTogglingStatus}
                className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer ${
                  isCurrentlyActive
                    ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                {isTogglingStatus ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isCurrentlyActive ? (
                  <EyeOff className="w-3.5 h-3.5 text-amber-700 transition-transform duration-300 hover:rotate-12" />
                ) : (
                  <Eye className="w-3.5 h-3.5 text-emerald-700 transition-transform duration-300 hover:rotate-12" />
                )}
                <span>{isCurrentlyActive ? 'Chuyển Sang Bản Nháp (Tạm Ẩn)' : 'Kích Hoạt Hiển Thị Lên Sàn'}</span>
              </button>
            </div>

            {/* Phiên bản hoặc Biến thể thực tế */}
            <div className="seller-section-box">
              <div className="seller-section-title">
                Phân Loại Sản Phẩm
                <span className="extra-info">Dữ liệu thực</span>
              </div>

              {product.variants && product.variants.length > 0 ? (
                <div className="variants-table-wrap">
                  <table className="variants-table">
                    <thead>
                      <tr>
                        <th>Phân loại</th>
                        <th>SKU</th>
                        <th>Tồn</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.variants.map((v) => (
                        <tr key={v.id || v.sku}>
                          <td>{v.size || v.color ? `${v.size || ''} ${v.color || ''}`.trim() : 'Tiêu chuẩn'}</td>
                          <td>{v.sku || skuCode}</td>
                          <td>{v.stockQuantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-white border border-slate-100 text-xs text-slate-600 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Phiên bản:</span>
                    <strong className="text-slate-800">Bản tiêu chuẩn (Single SKU)</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Mã quản lý kho:</span>
                    <strong className="text-slate-800">{skuCode}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Ngành hàng:</span>
                    <strong className="text-slate-800">{product.categoryName || 'Thời Trang Cao Cấp'}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Thông số kỹ thuật thật nếu có trong database */}
            {(product.material || product.countryOfOrigin || product.collectionName) && (
              <div className="seller-section-box">
                <div className="seller-section-title">Thông Số Chi Tiết</div>
                <div className="shipping-spec-list">
                  {product.collectionName && (
                    <div className="shipping-spec-item">
                      <span>Bộ sưu tập:</span>
                      <strong>{product.collectionName}</strong>
                    </div>
                  )}
                  {product.material && (
                    <div className="shipping-spec-item">
                      <span>Chất liệu:</span>
                      <strong>{product.material}</strong>
                    </div>
                  )}
                  {product.countryOfOrigin && (
                    <div className="shipping-spec-item">
                      <span>Xuất xứ chế tác:</span>
                      <strong>{product.countryOfOrigin}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="seller-drawer-actions">
            <button
              className="btn-seller-secondary cursor-pointer"
              onClick={quickRestock}
              disabled={isRestocking}
              type="button"
            >
              {isRestocking ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin text-sky-600" />
              ) : (
                <Package className="w-4 h-4 mr-1.5 text-sky-600" />
              )}
              <span>{isRestocking ? 'Đang nhập kho...' : 'Nhập Thêm +10 Vào Kho'}</span>
            </button>
            <button className="btn-seller-secondary cursor-pointer" onClick={copySku} type="button">
              <Copy className="w-4 h-4 mr-1.5" />
              <span>Sao Chép Mã SKU</span>
            </button>
          </div>
        </div>

        {/* PANEL 2 (BÊN PHẢI): DỮ LIỆU SẢN PHẨM & GIÁ BÁN THẬT */}
        <div className="seller-panel seller-panel-primary">
          <div className="seller-panel-header">
            <div className="seller-header-badge-group">
              <span className="badge-portal">DỮ LIỆU NGƯỜI BÁN</span>
              <span className={`badge-active-status ${isCurrentlyActive ? '' : '!bg-amber-100 !text-amber-800 !border-amber-300'}`}>
                {isCurrentlyActive ? (isStockAvailable ? 'Đang Bán (Active)' : 'Tạm Hết Hàng') : 'Bản Nháp (Ẩn)'}
              </span>
            </div>
            <button
              className="btn-drawer-close cursor-pointer"
              title="Đóng bảng chi tiết"
              onClick={onClose}
              type="button"
            >
              &times;
            </button>
          </div>

          <div className="seller-panel-body">
            {/* Ảnh & Tên sản phẩm */}
            <div className="seller-product-hero">
              <div className="seller-hero-img-box">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/img/products/sample-velora.jpg';
                  }}
                />
              </div>
              <div className="seller-hero-meta">
                <div className="seller-hero-identifiers">
                  <span className="brand-badge-pill">{brandName}</span>
                  <span className="sku-tag">SKU: {skuCode}</span>
                </div>
                <h3>{product.name}</h3>
                <p className="seller-category-crumb">
                  Aethelgard Mall / {product.categoryName || 'Thời Trang'}
                </p>
              </div>
            </div>

            {/* Giá Bán Thực Tế */}
            <div className="seller-section-box">
              <div className="seller-section-title">
                Giá Bán Niêm Yết
                <span className="extra-info">Giá hiển thị khách hàng</span>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Giá Bán Hiện Tại
                  </span>
                  <span className="text-xl font-black text-slate-900">
                    {formatVND(product.basePrice)}
                  </span>
                </div>

                {hasDiscount && (
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Giá Gốc & Ưu Đãi
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium text-slate-400 line-through">
                        {formatVND(product.originalPrice || 0)}
                      </span>
                      <span className="text-xs font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                        -{discountRate}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Đánh Giá & Phản Hồi Khách Hàng Thật từ Database */}
            <div className="seller-section-box">
              <div className="seller-section-title">Đánh Giá & Phản Hồi</div>
              <div className="flex items-center gap-4 p-3.5 rounded-xl bg-white border border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-500 text-lg">★</span>
                  <span className="font-bold text-slate-900 text-base">
                    {(product.rating || 5.0).toFixed(1)}
                  </span>
                </div>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-600">
                  {product.reviewCount && product.reviewCount > 0
                    ? `${product.reviewCount} lượt đánh giá từ khách mua hàng`
                    : 'Chưa có đánh giá nào từ khách hàng'}
                </span>
              </div>
            </div>

            {/* Mô Tả Sản Phẩm Thật */}
            <div className="seller-section-box">
              <div className="seller-section-title">Mô Tả Sản Phẩm</div>
              <p className="text-[0.85rem] leading-relaxed text-slate-600 whitespace-pre-line">
                {product.description || 'Chưa cập nhật nội dung mô tả cho sản phẩm này.'}
              </p>
            </div>
          </div>

          {/* Hàng nút hành động */}
          <div className="seller-drawer-actions flex flex-col gap-2">
            <a
              href={`/product-detail/${product.id}`}
              className="btn-seller-primary no-underline flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Xem Trang Sản Phẩm Khách Hàng</span>
              <ExternalLink className="w-4 h-4" />
            </a>
            <div className="flex gap-2">
              <button
                className="btn-seller-secondary flex-1 cursor-pointer"
                onClick={() => {
                  onClose();
                  onEditProduct?.(product);
                }}
                type="button"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1.5 text-sky-600" />
                <span>Chỉnh Sửa Niêm Yết</span>
              </button>
              {onDeleteProduct && (
                <button
                  className="px-4 py-2.5 rounded-lg border border-red-200 bg-red-50 text-red-600 font-bold text-xs hover:bg-red-100 transition-colors flex items-center gap-1 cursor-pointer"
                  onClick={() => {
                    onClose();
                    onDeleteProduct(product);
                  }}
                  type="button"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
