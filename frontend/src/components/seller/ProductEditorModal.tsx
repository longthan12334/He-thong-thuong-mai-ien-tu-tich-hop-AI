'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Upload, Tag, DollarSign, Image as ImageIcon, AlertCircle, Sparkles, Plus, Trash2, Loader2 } from 'lucide-react';
import { productService } from '@/services/product.service';
import { aiService } from '@/services/ai.service';
import type { Product, Category } from '@/types';
import { SAMPLE_PRODUCT_IMAGES } from '@/lib/constants';
import { formatVND } from '@/lib/utils';

interface ProductEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (product: Product, isEdit: boolean) => void;
  initialProduct?: Product | null;
  categories: Category[];
}

const STEPS = [
  { id: 1, label: 'Thông tin', icon: Tag },
  { id: 2, label: 'Giá & Kho', icon: DollarSign },
  { id: 3, label: 'Hình ảnh & Chi tiết', icon: ImageIcon },
  { id: 4, label: 'Xác nhận', icon: Check },
];

export function ProductEditorModal({
  isOpen,
  onClose,
  onSuccess,
  initialProduct,
  categories,
}: ProductEditorModalProps) {
  const isEdit = !!initialProduct;
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [error, setError] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Delayed unmount cho chuyển cảnh đóng/mở mượt mà (Item 1)
  const [isRendered, setIsRendered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      const timer = requestAnimationFrame(() => setIsAnimating(true));
      return () => cancelAnimationFrame(timer);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsRendered(false), 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  // Form State gom nhóm chuẩn (Item 40)
  const [formData, setFormData] = useState({
    name: '',
    categoryId: categories[0]?.id || 1,
    sku: '',
    collectionName: 'Thu/Đông 2026',
    countryOfOrigin: 'Ý',
    material: '100% da thật',
    careInstructions: 'Lau bằng khăn ẩm mềm, tránh ánh nắng trực tiếp.',
    basePrice: 2500000,
    originalPrice: 3000000,
    costPrice: 1500000,
    discountPercent: 15,
    stockQuantity: 50,
    imageUrl: '/img/products/gucci-sneaker.jpg',
    galleryUrls: [] as string[],
    description: '',
  });

  const updateField = <K extends keyof typeof formData>(field: K, value: typeof formData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (initialProduct) {
      setFormData({
        name: initialProduct.name || '',
        categoryId: initialProduct.categoryId || categories[0]?.id || 1,
        sku: initialProduct.sku || '',
        collectionName: initialProduct.collectionName || '',
        countryOfOrigin: initialProduct.countryOfOrigin || 'Italy',
        material: initialProduct.material || '',
        careInstructions: initialProduct.careInstructions || '',
        basePrice: initialProduct.basePrice || 0,
        originalPrice: initialProduct.originalPrice || initialProduct.basePrice || 0,
        costPrice: initialProduct.costPrice || Math.round((initialProduct.basePrice || 0) * 0.6),
        discountPercent: initialProduct.discountPercent || 0,
        stockQuantity: initialProduct.stockQuantity || 10,
        imageUrl: initialProduct.imageUrl || '/img/products/gucci-sneaker.jpg',
        galleryUrls: initialProduct.galleryUrls || [],
        description: initialProduct.description || '',
      });
    } else {
      setFormData({
        name: '',
        categoryId: categories[0]?.id || 1,
        sku: `AG-${Date.now().toString().slice(-5)}`,
        collectionName: '',
        countryOfOrigin: '',
        material: '',
        careInstructions: '',
        basePrice: 0,
        originalPrice: 0,
        costPrice: 0,
        discountPercent: 0,
        stockQuantity: 1,
        imageUrl: '/img/products/sample-velora.jpg',
        galleryUrls: [],
        description: '',
      });
    }
    setCurrentStep(1);
    setError('');
  }, [initialProduct, categories, isOpen]);

  // AI Copilot tích hợp API Gemini (Item 14: Hiệu ứng Shimmer Gradient Pulse)
  const handleGenerateAIDescription = async () => {
    setIsGeneratingAI(true);
    setError('');
    try {
      const selectedCategory = categories.find((c) => c.id === Number(formData.categoryId))?.name || 'Thời Trang Cao Cấp';
      const promptName = formData.name.trim() || 'Sản phẩm Haute Couture';
      const res = await aiService.generateProductDescription({
        productName: promptName,
        categoryName: selectedCategory,
        brand: formData.collectionName || 'Aethelgard Signature',
        keywords: `${formData.material} ${formData.careInstructions}`.trim(),
      });

      if (res?.description) {
        updateField('description', res.description);
      }
      if (res?.material && (!formData.material || formData.material.length < 5)) {
        updateField('material', res.material);
      }
      if (res?.careInstructions && (!formData.careInstructions || formData.careInstructions.length < 5)) {
        updateField('careInstructions', res.careInstructions);
      }
    } catch {
      const selectedCategory = categories.find((c) => c.id === Number(formData.categoryId))?.name || 'Thời Trang';
      updateField('description', `[Aethelgard AI Stylist]: Tuyệt tác ${formData.name || 'sản phẩm'} thuộc phân khúc ${selectedCategory} trong BST ${formData.collectionName}. Được chế tác tỉ mỉ từ chất liệu ${formData.material || 'thượng hạng'}, tôn vinh gu thẩm mỹ sang trọng và đẳng cấp của chủ nhân.`);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const uploadSingleImage = async (file: File) => {
    setUploadingMain(true);
    setError('');
    try {
      const res = await productService.uploadImage(file);
      if (res?.url) {
        updateField('imageUrl', res.url);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải ảnh lên. Vui lòng chọn ảnh định dạng JPG/PNG/WebP dưới 15MB.');
    } finally {
      setUploadingMain(false);
      if (mainFileInputRef.current) mainFileInputRef.current.value = '';
    }
  };

  const handleMainFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadSingleImage(file);
  };

  // Drag & drop handlers (Item 20)
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      uploadSingleImage(file);
    }
  };

  const handleGalleryFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (formData.galleryUrls.length >= 6) {
      setError('Tối đa 6 ảnh chi tiết cho mỗi sản phẩm.');
      return;
    }

    setUploadingGallery(true);
    setError('');
    try {
      const res = await productService.uploadImage(file);
      if (res?.url) {
        updateField('galleryUrls', [...formData.galleryUrls, res.url]);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải ảnh góc chụp. Vui lòng thử lại.');
    } finally {
      setUploadingGallery(false);
      if (galleryFileInputRef.current) galleryFileInputRef.current.value = '';
    }
  };

  const handleRemoveGalleryImage = (indexToRemove: number) => {
    updateField('galleryUrls', formData.galleryUrls.filter((_, idx) => idx !== indexToRemove));
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        setError('Vui lòng nhập tên sản phẩm.');
        return;
      }
      if (!formData.sku.trim()) {
        setError('Vui lòng nhập mã SKU.');
        return;
      }
    } else if (currentStep === 2) {
      if (formData.basePrice <= 0) {
        setError('Giá bán phải lớn hơn 0.');
        return;
      }
      if (formData.stockQuantity < 0) {
        setError('Số lượng tồn kho không được âm.');
        return;
      }
    } else if (currentStep === 3) {
      if (!formData.imageUrl.trim()) {
        setError('Vui lòng tải lên hoặc chọn ảnh đại diện sản phẩm.');
        return;
      }
    }
    setError('');
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrev = () => {
    setError('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      name: formData.name.trim(),
      sku: formData.sku.trim(),
      categoryId: Number(formData.categoryId),
      basePrice: Number(formData.basePrice),
      originalPrice: Number(formData.originalPrice) || Number(formData.basePrice),
      costPrice: Number(formData.costPrice) || 0,
      stockQuantity: Number(formData.stockQuantity),
      discountPercent: Number(formData.discountPercent) || 0,
      imageUrl: formData.imageUrl.trim(),
      galleryUrls: formData.galleryUrls,
      description: formData.description.trim(),
      collectionName: formData.collectionName.trim(),
      countryOfOrigin: formData.countryOfOrigin.trim(),
      material: formData.material.trim(),
      careInstructions: formData.careInstructions.trim(),
      stockStatus: Number(formData.stockQuantity) > 10 ? 'IN_STOCK' : Number(formData.stockQuantity) > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK',
      isActive: true,
    };

    try {
      if (isEdit && initialProduct) {
        const updated = await productService.updateProduct(initialProduct.id, payload);
        onSuccess(updated, true);
      } else {
        const created = await productService.createProduct(payload as any);
        onSuccess(created, false);
      }
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Có lỗi xảy ra khi lưu sản phẩm. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  const grossProfit = formData.basePrice - (formData.costPrice || 0);
  const profitMargin = formData.basePrice > 0 ? ((grossProfit / formData.basePrice) * 100).toFixed(1) : '0';

  if (!isRendered) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-250 ${
        isAnimating ? 'bg-slate-950/60 opacity-100' : 'bg-slate-950/0 opacity-0 pointer-events-none'
      }`}
    >
      <div
        className={`w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] transition-all duration-250 transform ${
          isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-3'
        }`}
      >
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-serif">
              {isEdit ? 'Chỉnh Sửa Sản Phẩm' : 'Tạo Sản Phẩm Mới'}
            </h3>
            <p className="text-xs text-slate-500">
              {isEdit ? `Cập nhật thông số kỹ thuật cho mã #${formData.sku}` : 'Thêm sản phẩm mới vào danh mục bán buôn / bán lẻ'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thanh tiến trình 4 bước */}
        <div className="px-6 py-3 border-b border-slate-100 bg-white grid grid-cols-4 gap-2">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isDone = currentStep > step.id;
            return (
              <div
                key={step.id}
                className={`flex items-center gap-2 p-2 rounded-xl transition-all ${
                  isActive
                    ? 'bg-sky-50 text-sky-700 font-bold'
                    : isDone
                    ? 'text-emerald-600 font-semibold'
                    : 'text-slate-400'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${
                    isActive
                      ? 'bg-sky-500 text-white'
                      : isDone
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" /> : step.id}
                </div>
                <span className="text-xs hidden sm:inline">{step.label}</span>
              </div>
            );
          })}
        </div>

        {/* Thân Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* BƯỚC 1: THÔNG TIN CƠ BẢN */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên Sản Phẩm *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="VD: Sneaker da thủ công Velora White"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Danh Mục Ngành Hàng *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => updateField('categoryId', Number(e.target.value))}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-sky-500 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mã Định Danh (SKU) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => updateField('sku', e.target.value)}
                    placeholder="VD: AG-0021"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bộ Sưu Tập (Collection)
                  </label>
                  <input
                    type="text"
                    value={formData.collectionName}
                    onChange={(e) => updateField('collectionName', e.target.value)}
                    placeholder="VD: Thu/Đông 2026"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Xuất Xứ (Country of Origin)
                  </label>
                  <input
                    type="text"
                    value={formData.countryOfOrigin}
                    onChange={(e) => updateField('countryOfOrigin', e.target.value)}
                    placeholder="VD: Ý / Pháp / Việt Nam"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* BƯỚC 2: GIÁ & KHO HÀNG */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Giá Bán Niêm Yết (VND) *
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    required
                    value={formData.basePrice}
                    onChange={(e) => updateField('basePrice', Number(e.target.value))}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-semibold text-sky-700 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Giá Vốn Nhập Kho (COGS)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.costPrice}
                    onChange={(e) => updateField('costPrice', Number(e.target.value))}
                    placeholder="VD: 1.500.000"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Giá Gốc Niêm Yết (Trước Giảm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.originalPrice}
                    onChange={(e) => updateField('originalPrice', Number(e.target.value))}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số Lượng Tồn Kho Ban Đầu *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stockQuantity}
                    onChange={(e) => updateField('stockQuantity', Number(e.target.value))}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    % Giảm Giá Khuyến Mãi
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={formData.discountPercent}
                    onChange={(e) => updateField('discountPercent', Number(e.target.value))}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </div>
              </div>

              {/* Bảng phân tích tài chính lợi nhuận tức thời */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
                <div className="flex justify-between items-center">
                  <span>Trạng thái kho hàng:</span>
                  <span className={`font-bold ${formData.stockQuantity > 10 ? 'text-emerald-600' : formData.stockQuantity > 0 ? 'text-amber-600' : 'text-rose-600'}`}>
                    {formData.stockQuantity > 10 ? 'Còn hàng ổn định' : formData.stockQuantity > 0 ? 'Sắp hết hàng (Low Stock)' : 'Hết hàng'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Lợi nhuận gộp mỗi sản phẩm:</span>
                  <span className={`font-bold ${grossProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatVND(grossProfit)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                  <span className="font-semibold text-slate-800">Biên lợi nhuận gộp (Profit Margin):</span>
                  <span className={`font-extrabold text-sm ${Number(profitMargin) >= 20 ? 'text-emerald-600' : Number(profitMargin) > 0 ? 'text-amber-600' : 'text-rose-600'}`}>
                    {profitMargin}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* BƯỚC 3: HÌNH ẢNH & CHI TIẾT ĐA GÓC NHÌN */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              {/* Ảnh đại diện chính & Drag-Over Pulse (Item 20) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ảnh Đại Diện Chính (Cover Image) *
                </label>
                
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`flex flex-col sm:flex-row gap-3 items-center p-3.5 rounded-2xl border-2 transition-all duration-200 ${
                    isDraggingOver
                      ? 'border-dashed border-sky-500 bg-sky-100/70 scale-[1.01]'
                      : 'border-dashed border-sky-300/80 bg-sky-50/40'
                  }`}
                >
                  <input
                    ref={mainFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleMainFileUpload}
                    className="hidden"
                    id="main-image-upload"
                  />
                  <label
                    htmlFor="main-image-upload"
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-sky-700 hover:bg-sky-50 hover:border-sky-300 transition-all cursor-pointer shadow-sm shrink-0"
                  >
                    {uploadingMain ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                        <span>Đang tải lên...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-sky-600" />
                        <span>Tải ảnh hoặc Kéo thả vào đây</span>
                      </>
                    )}
                  </label>
                  <div className="flex-1 w-full">
                    <input
                      type="text"
                      required
                      value={formData.imageUrl}
                      onChange={(e) => updateField('imageUrl', e.target.value)}
                      placeholder="/img/products/... hoặc link ảnh"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-sky-500 bg-white"
                    />
                  </div>
                </div>

                {/* Chọn nhanh ảnh mẫu từ hằng số dùng chung SAMPLE_PRODUCT_IMAGES (Item 26) */}
                <div className="mt-2 text-[11px] text-slate-500 font-medium">Hoặc chọn nhanh từ kho ảnh mẫu chính hãng:</div>
                <div className="grid grid-cols-6 gap-2 mt-1.5">
                  {SAMPLE_PRODUCT_IMAGES.map((img) => (
                    <button
                      key={img}
                      type="button"
                      onClick={() => updateField('imageUrl', img)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        formData.imageUrl === img ? 'border-sky-600 scale-105 shadow-md' : 'border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <img src={img} alt="sample" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Bộ sưu tập ảnh đa góc nhìn (Gallery) */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">Bộ Sưu Tập Ảnh Đa Góc Nhìn (Gallery)</div>
                    <div className="text-[11px] text-slate-500">Thêm 3-5 góc chụp: góc nghiêng, mặt sau, cận cảnh chất liệu vải</div>
                  </div>
                  <input
                    ref={galleryFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleGalleryFileUpload}
                    className="hidden"
                    id="gallery-image-upload"
                  />
                  <label
                    htmlFor="gallery-image-upload"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-sky-400 text-sky-700 rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-all"
                  >
                    {uploadingGallery ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                    ) : (
                      <Plus className="w-3.5 h-3.5 text-sky-600" />
                    )}
                    <span>Thêm góc chụp</span>
                  </label>
                </div>

                {formData.galleryUrls.length > 0 ? (
                  <div className="grid grid-cols-5 gap-2 pt-1">
                    {formData.galleryUrls.map((url, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 bg-white shadow-xs">
                        <img src={url} alt={`gallery-${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveGalleryImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm"
                          title="Xóa ảnh góc này"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-3 text-xs text-slate-400 italic">
                    Chưa có ảnh góc phụ. Tải lên để khách hàng chiêm ngưỡng sản phẩm toàn diện nhất.
                  </div>
                )}
              </div>

              {/* AI Copilot Viết Mô Tả với Gradient Pulse Effect (Item 14) */}
              <div className={`p-3 rounded-2xl border transition-all duration-300 ${isGeneratingAI ? 'ai-pulse-glow bg-sky-50/50 border-sky-400' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Mô Tả Sản Phẩm Chuẩn SEO
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateAIDescription}
                    disabled={isGeneratingAI}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-60 ${
                      isGeneratingAI
                        ? 'bg-sky-500 text-white animate-pulse'
                        : 'bg-sky-50 border border-sky-300 text-sky-700 hover:bg-sky-100'
                    }`}
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : 'text-sky-600 animate-pulse'}`} />
                    <span>{isGeneratingAI ? 'Gemini AI đang sáng tạo...' : '✨ AI Copilot Viết Mô Tả'}</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Mô tả phong cách, công nghệ may, tính năng vượt trội..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chất Liệu Chế Tác
                  </label>
                  <input
                    type="text"
                    value={formData.material}
                    onChange={(e) => updateField('material', e.target.value)}
                    placeholder="VD: Da bê Ý 100%, Lụa tơ tằm"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hướng Dẫn Bảo Quản
                  </label>
                  <input
                    type="text"
                    value={formData.careInstructions}
                    onChange={(e) => updateField('careInstructions', e.target.value)}
                    placeholder="VD: Tránh ánh nắng, lau khăn ẩm"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* BƯỚC 4: XÁC NHẬN TRƯỚC KHI ĐĂNG TẢI */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-200 flex gap-4">
                <img
                  src={formData.imageUrl}
                  alt={formData.name}
                  className="w-24 h-24 rounded-xl object-cover border border-sky-300 shadow-sm shrink-0"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/img/products/sample-velora.jpg';
                  }}
                />
                <div className="space-y-1 min-w-0 flex-1">
                  <span className="inline-block px-2.5 py-0.5 rounded-md bg-sky-600 text-white text-[10px] font-bold uppercase tracking-wider">
                    {formData.sku}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 truncate">{formData.name}</h4>
                  <div className="text-sm font-extrabold text-sky-700">
                    {formatVND(formData.basePrice)}
                    {formData.originalPrice > formData.basePrice && (
                      <span className="text-xs text-slate-400 font-normal line-through ml-2">
                        {formatVND(formData.originalPrice)}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    Kho: <span className="font-semibold text-slate-700">{formData.stockQuantity} sp</span> • Giá vốn: <span className="font-semibold text-slate-700">{formatVND(formData.costPrice)}</span> • Biên LN: <span className="font-bold text-emerald-600">{profitMargin}%</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 divide-y divide-slate-100 text-xs">
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">Bộ sưu tập</span>
                  <span className="font-semibold text-slate-900">{formData.collectionName || 'Tiêu chuẩn'}</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">Xuất xứ</span>
                  <span className="font-semibold text-slate-900">{formData.countryOfOrigin || 'Chính hãng'}</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">Chất liệu</span>
                  <span className="font-semibold text-slate-900">{formData.material}</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">Số lượng ảnh góc phụ</span>
                  <span className="font-semibold text-slate-900">{formData.galleryUrls.length} ảnh gallery</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">Trạng thái phát hành</span>
                  <span className="font-bold text-emerald-600">Sẵn Sàng Niêm Yết Lên Sàn</span>
                </div>
              </div>
            </div>
          )}

          {/* Nút điều hướng */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
              >
                Quay Lại
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
              >
                Đóng
              </button>
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-md transition-all ml-auto cursor-pointer"
              >
                Tiếp Theo
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs shadow-md shadow-sky-100 transition-all ml-auto flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? 'Đang lưu...' : isEdit ? 'Lưu Thay Đổi Sản Phẩm' : 'Xác Nhận Đăng Bán Ngay'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductEditorModal;
