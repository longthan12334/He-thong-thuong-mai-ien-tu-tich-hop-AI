'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Product } from '@/types';
import { aiService } from '@/services/ai.service';
import { formatVND } from '@/lib/utils';
import { FALLBACK_IMAGE } from '@/lib/constants';
import { extractBrand } from '@/lib/customer';

interface AIStylistPanelProps {
  product: Pick<Product, 'id' | 'name' | 'categoryId' | 'basePrice'> & { collectionName?: string };
  catalog: Product[];
}

const QUICK_PROMPTS = [
  'Đi làm văn phòng thanh lịch',
  'Dạo phố cuối tuần năng động',
  'Dự tiệc cưới ngoài trời',
  'Hẹn hò buổi tối',
];

/**
 * Trợ lý phối đồ AI (AI Fashion Stylist) trên trang chi tiết sản phẩm.
 * - Gọi API Backend /api/ai/recommend với ngữ cảnh sản phẩm đang xem + mục đích khách nhập
 * - "Hoàn thiện set đồ": chọn món bổ trợ ở các danh mục KHÁC, ưu tiên cùng thương hiệu & tầm giá
 */
export const AIStylistPanel: React.FC<AIStylistPanelProps> = ({ product, catalog }) => {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [isFallback, setIsFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [askedFor, setAskedFor] = useState('');

  const ask = async (q: string) => {
    const intent = q.trim() || `Phối đồ cùng ${product.name}`;
    setIsLoading(true);
    setAskedFor(q.trim());
    const res = await aiService.getOutfitRecommendation(intent, product.id);
    setAnswer(res.text);
    setIsFallback(res.isFallback);
    setIsLoading(false);
  };

  // Gợi ý mặc định ngay khi mở trang sản phẩm
  useEffect(() => {
    setAnswer('');
    setQuery('');
    ask('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const completeTheLook = useMemo(() => {
    const brand = extractBrand(product);
    const usedCategories = new Set<number>([product.categoryId]);
    const ranked = catalog
      .filter((p) => p.id !== product.id && p.categoryId !== product.categoryId && (p.stockQuantity ?? 1) > 0)
      .map((p) => {
        let score = (p.rating || 0) / 5;
        if (brand && extractBrand(p) === brand) score += 1.5;
        if (product.basePrice > 0) {
          score += Math.max(0, 1 - Math.abs(p.basePrice - product.basePrice) / product.basePrice);
        }
        return { p, score };
      })
      .sort((a, b) => b.score - a.score);

    // Mỗi danh mục bổ trợ lấy 1 món để thành 1 set đồ hoàn chỉnh
    const picks: Product[] = [];
    for (const { p } of ranked) {
      if (usedCategories.has(p.categoryId)) continue;
      usedCategories.add(p.categoryId);
      picks.push(p);
      if (picks.length === 3) break;
    }
    return picks;
  }, [catalog, product]);

  const lookTotal = completeTheLook.reduce((s, p) => s + p.basePrice, product.basePrice);

  return (
    <section className="customer-ai-panel" aria-labelledby="ai-stylist-title">
      <div className="customer-ai-header">
        <span className="customer-ai-badge" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #8b5cf6 100%)', boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)' }}>
          ✦ AI Stylist · Powered by Google Gemini
        </span>
        <h2 id="ai-stylist-title">Trợ Lý Phối Đồ Cá Nhân Hóa (Gemini AI)</h2>
        <p>Hỏi ý kiến trợ lý AI được tích hợp mô hình Google Gemini để nhận gợi ý phối đồ chuẩn phong cách thời thượng.</p>
      </div>

      <form
        className="customer-ai-form"
        onSubmit={(e) => {
          e.preventDefault();
          ask(query);
        }}
      >
        <input
          className="form-control"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="VD: Tôi cao 1m75, đi dự tiệc cưới ngoài trời buổi chiều..."
          aria-label="Mô tả dịp mặc"
        />
        <button type="submit" className="customer-ai-submit" disabled={isLoading}>
          {isLoading ? 'Đang phân tích...' : 'Hỏi AI'}
        </button>
      </form>

      <div className="customer-ai-chips">
        {QUICK_PROMPTS.map((q) => (
          <button
            key={q}
            type="button"
            className="customer-chip"
            onClick={() => {
              setQuery(q);
              ask(q);
            }}
            disabled={isLoading}
          >
            {q}
          </button>
        ))}
      </div>

      <div className="customer-ai-answer" aria-live="polite">
        {isLoading ? (
          <div className="customer-ai-typing">
            <span />
            <span />
            <span />
          </div>
        ) : (
          <>
            {askedFor && <p className="customer-ai-question">“{askedFor}”</p>}
            <p>{answer}</p>
            {!isFallback && Boolean(answer) && (
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#4f46e5', fontWeight: 600 }}>
                <span>✨ Gợi ý thời trang tạo bởi Google Gemini 3.0 Flash</span>
              </div>
            )}
            {isFallback && <p className="customer-ai-note">Đang dùng gợi ý ngoại tuyến do chưa kết nối được máy chủ AI.</p>}
          </>
        )}
      </div>

      {completeTheLook.length > 0 && (
        <div className="customer-look">
          <div className="customer-look-header">
            <h3>Hoàn thiện set đồ</h3>
            <span>
              Trọn bộ ước tính: <strong>{formatVND(lookTotal)}</strong>
            </span>
          </div>
          <div className="customer-look-grid">
            {completeTheLook.map((p) => (
              <Link key={p.id} href={`/product-detail/${p.id}`} className="customer-look-item">
                <img
                  src={p.imageUrl || FALLBACK_IMAGE}
                  alt={p.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                  }}
                />
                <div>
                  <span className="customer-look-cat">{p.categoryName || 'Phụ kiện'}</span>
                  <strong>{p.name}</strong>
                  <span className="customer-look-price">{formatVND(p.basePrice)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
