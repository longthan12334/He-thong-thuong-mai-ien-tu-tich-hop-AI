'use client';
import '@/styles/income-statistics.css';

import React, { useState, useEffect, useMemo } from 'react';
import { statisticsService } from '@/services/statistics.service';
import type { IncomeSummary, Transaction, MonthlyData, CategoryRevenue } from '@/types';
import { useToast } from '@/hooks/useToast';
import { useSellerGuard } from '@/hooks/useSellerGuard';

/** Nhãn tháng hiển thị tiếng Việt (giữ nguyên khóa dữ liệu JAN..DEC) */
const MONTH_LABELS: Record<string, string> = {
  JAN: 'TH1', FEB: 'TH2', MAR: 'TH3', APR: 'TH4', MAY: 'TH5', JUN: 'TH6',
  JUL: 'TH7', AUG: 'TH8', SEP: 'TH9', OCT: 'TH10', NOV: 'TH11', DEC: 'TH12',
};

/** Nhãn trạng thái giao dịch */
const TX_STATUS_LABELS: Record<string, string> = {
  Success: 'Thành công',
  Pending: 'Đang xử lý',
  Refunded: 'Đã hoàn tiền',
};

export default function IncomeStatisticsPage() {
  const { isAuthorized, isLoading: isGuardLoading } = useSellerGuard('/shop');
  const { showToast } = useToast();
  const [activeMonth, setActiveMonth] = useState<string>('OCT');
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAiModal, setShowAiModal] = useState(false);
  const [apiData, setApiData] = useState<IncomeSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Lấy dữ liệu thống kê doanh thu thực tế từ backend API
  useEffect(() => {
    if (!isAuthorized) return;
    const fetchApiStats = async () => {
      try {
        setLoading(true);
        const res = await statisticsService.getIncomeStats();
        if (res) {
          setApiData(res);
          if (res.recentTransactions && res.recentTransactions.length > 0) {
            setTransactions(res.recentTransactions);
          }
          if (res.monthlyMatrix && res.monthlyMatrix.length > 0) {
            const active = res.monthlyMatrix.find((m) => m.isActive);
            if (active) {
              setActiveMonth(active.month);
            }
          }
        }
      } catch (err) {
        showToast('Không thể tải dữ liệu thống kê doanh thu.');
      } finally {
        setLoading(false);
      }
    };
    fetchApiStats();
  }, [isAuthorized, showToast]);

  // Tính toán số liệu doanh thu thực tế hiển thị
  const totalRevenueDisplay = useMemo(() => {
    if (apiData && apiData.totalRevenue > 0) {
      return `${apiData.totalRevenue.toLocaleString('vi-VN')} đ`;
    }
    return loading ? '...' : '0 đ';
  }, [apiData, loading]);

  const totalOrdersDisplay = useMemo(() => {
    if (apiData && apiData.totalOrders > 0) {
      return `${apiData.totalOrders.toLocaleString('vi-VN')} Đơn hàng`;
    }
    return loading ? '...' : '0 Đơn hàng';
  }, [apiData, loading]);

  const growthDisplay = useMemo(() => {
    if (apiData && apiData.growthPercent !== undefined) {
      const sign = apiData.growthPercent >= 0 ? '+' : '';
      return `${sign}${apiData.growthPercent.toFixed(1)}%`;
    }
    return '+0.0%';
  }, [apiData]);

  // Tính tổng doanh thu theo chu kỳ thời gian thực tế
  const trendTotal = useMemo(() => {
    if (!apiData) return loading ? '...' : '0 đ';
    if (period === 'weekly') {
      return `${(apiData.weeklyRevenue ?? apiData.monthlyRevenue ?? apiData.totalRevenue).toLocaleString('vi-VN')} đ`;
    }
    if (period === 'yearly') {
      return `${(apiData.yearlyRevenue ?? apiData.totalRevenue).toLocaleString('vi-VN')} đ`;
    }
    return `${(apiData.monthlyRevenue ?? apiData.totalRevenue).toLocaleString('vi-VN')} đ`;
  }, [apiData, period, loading]);

  // Dữ liệu ma trận 12 tháng từ backend
  const matrixChartData: MonthlyData[] = useMemo(() => {
    if (apiData?.monthlyMatrix && apiData.monthlyMatrix.length > 0) {
      return apiData.monthlyMatrix;
    }
    const defaultMonths = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return defaultMonths.map((m) => ({
      month: m,
      existingUsers: 0,
      newUsers: 0,
      valTotal: '0đ',
      isActive: m === 'OCT',
    }));
  }, [apiData]);

  // Cơ cấu doanh thu theo danh mục từ backend
  const categoryBreakdown: CategoryRevenue[] = useMemo(() => {
    return apiData?.categoryBreakdown || [];
  }, [apiData]);

  // Danh sách giao dịch sau khi lọc tìm kiếm
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        tx.id.toLowerCase().includes(q) ||
        tx.customer.toLowerCase().includes(q) ||
        tx.product.toLowerCase().includes(q) ||
        (TX_STATUS_LABELS[tx.status] || tx.status).toLowerCase().includes(q)
      );
    });
  }, [transactions, searchQuery]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredTransactions.map((tx) => tx.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAddNewTx = () => {
    showToast('Tính năng thêm đơn hàng thủ công dành cho Quản trị viên POS tại cửa hàng.');
  };

  if (isGuardLoading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Đang xác thực quyền truy cập báo cáo tài chính...</p>
        </div>
      </div>
    );
  }

  const topCategory = categoryBreakdown[0];

  return (
    <main className="income-dashboard-wrap">
      {/* ============================================================
           ROW 1: 4 TOP METRIC CARDS (SPARKLINES MONO)
           ============================================================ */}
      <div className="metric-cards-grid">
        {/* 1. Tổng doanh thu */}
        <div className="kpi-stat-box">
          <div className="kpi-top-row">
            <span className="kpi-title-mono">TỔNG DOANH THU THỰC TẾ</span>
            <div className="sparkline-bars">
              <div className="spark-bar" style={{ height: '14px' }}></div>
              <div className="spark-bar" style={{ height: '18px' }}></div>
              <div className="spark-bar" style={{ height: '14px' }}></div>
              <div className="spark-bar" style={{ height: '22px' }}></div>
              <div className="spark-bar active" style={{ height: '28px' }}></div>
              <div className="spark-bar" style={{ height: '20px' }}></div>
              <div className="spark-bar" style={{ height: '26px' }}></div>
            </div>
          </div>
          <div className="kpi-big-num">{totalRevenueDisplay}</div>
          <div className="kpi-bottom-row">
            <span className="kpi-info-icon" title="Tổng doanh thu từ tất cả các đơn hàng hợp lệ đã thanh toán">ⓘ</span>
            <span className="kpi-growth-tag">
              {growthDisplay} <span style={{ fontWeight: 500, color: '#6B7280', marginLeft: '2px' }}>so với tháng trước</span>
            </span>
          </div>
        </div>

        {/* 2. Tổng đơn hàng */}
        <div className="kpi-stat-box">
          <div className="kpi-top-row">
            <span className="kpi-title-mono">TỔNG ĐƠN HÀNG</span>
            <div className="sparkline-bars">
              <div className="spark-bar" style={{ height: '14px' }}></div>
              <div className="spark-bar" style={{ height: '10px' }}></div>
              <div className="spark-bar" style={{ height: '16px' }}></div>
              <div className="spark-bar active" style={{ height: '24px' }}></div>
              <div className="spark-bar" style={{ height: '18px' }}></div>
              <div className="spark-bar" style={{ height: '22px' }}></div>
              <div className="spark-bar" style={{ height: '24px' }}></div>
            </div>
          </div>
          <div className="kpi-big-num">
            {totalOrdersDisplay}
          </div>
          <div className="kpi-bottom-row">
            <span className="kpi-info-icon" title="Tổng số lượng đơn đặt hàng ghi nhận trên hệ thống CSDL">ⓘ</span>
            <span className="kpi-growth-tag">
              {apiData?.totalOrders ?? 0} <span style={{ fontWeight: 500, color: '#6B7280', marginLeft: '2px' }}>đơn đã xử lý</span>
            </span>
          </div>
        </div>

        {/* 3. Khách hàng */}
        <div className="kpi-stat-box">
          <div className="kpi-top-row">
            <span className="kpi-title-mono">KHÁCH HÀNG MUA SẮM</span>
            <div className="sparkline-bars">
              <div className="spark-bar" style={{ height: '16px' }}></div>
              <div className="spark-bar" style={{ height: '20px' }}></div>
              <div className="spark-bar" style={{ height: '12px' }}></div>
              <div className="spark-bar" style={{ height: '18px' }}></div>
              <div className="spark-bar active" style={{ height: '26px' }}></div>
              <div className="spark-bar" style={{ height: '14px' }}></div>
              <div className="spark-bar" style={{ height: '19px' }}></div>
            </div>
          </div>
          <div className="kpi-big-num">
            {apiData?.totalCustomers ?? (loading ? '...' : 0)} <span className="kpi-subtext">Khách hàng</span>
          </div>
          <div className="kpi-bottom-row">
            <span className="kpi-info-icon" title="Số lượng khách hàng thực tế đã phát sinh đơn hàng">ⓘ</span>
            <span className="kpi-growth-tag">
              +{apiData?.newCustomers ?? 0} <span style={{ fontWeight: 500, color: '#6B7280', marginLeft: '2px' }}>mới trong tháng</span>
            </span>
          </div>
        </div>

        {/* 4. Tỷ lệ chuyển đổi */}
        <div className="kpi-stat-box">
          <div className="kpi-top-row">
            <span className="kpi-title-mono">TỶ LỆ CHUYỂN ĐỔI</span>
            <div className="sparkline-bars">
              <div className="spark-bar" style={{ height: '10px' }}></div>
              <div className="spark-bar" style={{ height: '14px' }}></div>
              <div className="spark-bar" style={{ height: '20px' }}></div>
              <div className="spark-bar" style={{ height: '15px' }}></div>
              <div className="spark-bar active" style={{ height: '25px' }}></div>
              <div className="spark-bar" style={{ height: '18px' }}></div>
              <div className="spark-bar" style={{ height: '20px' }}></div>
            </div>
          </div>
          <div className="kpi-big-num">
            {apiData?.conversionRate ? `${apiData.conversionRate}%` : '3.9%'}
          </div>
          <div className="kpi-bottom-row">
            <span className="kpi-info-icon" title="Tỷ lệ hoàn tất thanh toán giỏ hàng thực tế">ⓘ</span>
            <span className="kpi-growth-tag">
              +0.8% <span style={{ fontWeight: 500, color: '#6B7280', marginLeft: '2px' }}>hiệu suất giỏ hàng</span>
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================
           HÀNG 2: XU HƯỚNG DOANH SỐ & CƠ CẤU DOANH THU
           ============================================================ */}
      <div className="analytics-two-col-grid">
        {/* Cột Trái: SALES TREND (PIXEL / MATRIX BLOCK BAR CHART) */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div className="dash-card-title-group">
              <span>XU HƯỚNG DOANH SỐ THEO THÁNG</span>
              <span>ⓘ</span>
            </div>
            <span
              className="dash-card-action-icon"
              onClick={() => showToast('Cập nhật dữ liệu xu hướng doanh số thực tế từ CSDL')}
              title="Làm mới xu hướng"
            >
              ⋯
            </span>
          </div>

          <div className="sales-trend-toolbar">
            <div className="trend-stat-left">
              <div className="trend-total-label">
                Doanh thu kỳ này : <strong id="trend-total-amount">{trendTotal}</strong>
              </div>
              <div className="trend-legend">
                <div className="trend-legend-item">
                  <span className="legend-square-new"></span>
                  <span>KHÁCH MỚI</span>
                </div>
                <div className="trend-legend-item">
                  <span className="legend-square-existing"></span>
                  <span>KHÁCH QUEN</span>
                </div>
              </div>
            </div>

            <div className="time-pill-selector">
              <button
                className={`time-pill-btn ${period === 'weekly' ? 'active' : ''}`}
                onClick={() => setPeriod('weekly')}
                type="button"
              >
                7 Ngày qua
              </button>
              <button
                className={`time-pill-btn ${period === 'monthly' ? 'active' : ''}`}
                onClick={() => setPeriod('monthly')}
                type="button"
              >
                Theo tháng
              </button>
              <button
                className={`time-pill-btn ${period === 'yearly' ? 'active' : ''}`}
                onClick={() => setPeriod('yearly')}
                type="button"
              >
                Cả năm 2026
              </button>
            </div>
          </div>

          {/* Biểu đồ Ma Trận Khối (Block Matrix Bar Chart) */}
          <div className="matrix-chart-wrapper">
            {/* Trục Tung (Y-Axis) */}
            <div className="matrix-y-axis">
              <span>500M</span>
              <span>400M</span>
              <span>300M</span>
              <span>200M</span>
              <span>100M</span>
              <span>50M</span>
              <span>0đ</span>
            </div>

            {/* Vùng Lưới Khối & Cột Tháng */}
            <div className="matrix-grid-area">
              <div className="matrix-guidelines">
                <div className="matrix-guide-line"></div>
                <div className="matrix-guide-line"></div>
                <div className="matrix-guide-line"></div>
                <div className="matrix-guide-line"></div>
                <div className="matrix-guide-line"></div>
                <div className="matrix-guide-line"></div>
                <div className="matrix-guide-line" style={{ borderTop: '1px solid #E5E7EB' }}></div>
              </div>

              {/* Các Cột Tháng Ma Trận */}
              <div className="matrix-columns-container" id="matrix-cols-container">
                {matrixChartData.map((item) => {
                  const isActive = item.month === activeMonth;
                  return (
                    <div
                      key={item.month}
                      className="matrix-month-col"
                      onClick={() => setActiveMonth(item.month)}
                      style={{ cursor: 'pointer' }}
                    >
                      {isActive && (
                        <>
                          <div className="matrix-tooltip-pin">
                            <div className="tt-title">{MONTH_LABELS[item.month] || item.month} / 2026</div>
                            <div className="tt-row">
                              <span className="legend-square-new"></span>
                              <span>
                                Tổng doanh thu: <strong>{item.valTotal}</strong>
                              </span>
                            </div>
                            {item.newText && (
                              <div className="tt-row">
                                <span className="legend-square-existing"></span>
                                <span>
                                  Khách quen: <strong>{item.existText}</strong>
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="matrix-vertical-dash"></div>
                        </>
                      )}

                      <div className="blocks-stack">
                        {/* Khối Existing Users (Đen) */}
                        {Array.from({ length: item.existingUsers }).map((_, idx) => (
                          <div
                            key={`exist-${idx}`}
                            className={`matrix-block existing ${isActive ? 'highlight' : ''}`}
                          ></div>
                        ))}
                        {/* Khối Người dùng mới (Xám nhạt) */}
                        {Array.from({ length: item.newUsers }).map((_, idx) => (
                          <div key={`new-${idx}`} className="matrix-block new"></div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Nhãn Trục Hoành (X-Axis) */}
              <div className="matrix-x-axis" id="matrix-x-axis">
                {matrixChartData.map((item) => (
                  <span
                    key={item.month}
                    className={`matrix-x-label ${item.month === activeMonth ? 'active' : ''}`}
                    onClick={() => setActiveMonth(item.month)}
                    style={{ cursor: 'pointer' }}
                  >
                    {MONTH_LABELS[item.month] || item.month}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Cột Phải: REVENUE BREAKDOWN & CATEGORY PROGRESS */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div className="dash-card-title-group">
              <span>CƠ CẤU DOANH THU THEO NGÀNH HÀNG</span>
              <span>ⓘ</span>
            </div>
            <span
              className="dash-card-action-icon"
              onClick={() => showToast('Phân rã doanh thu thực tế theo từng danh mục hàng')}
              title="Phân rã doanh mục"
            >
              ⋯
            </span>
          </div>

          <div className="breakdown-top-meta">
            <span className="breakdown-cat-title">Tổng doanh số ghi nhận</span>
            <div className="breakdown-date-pill">
              <span>📅 Năm 2026</span>
              <span style={{ fontSize: '0.65rem' }}>▼</span>
            </div>
          </div>

          <div className="breakdown-big-val">{totalRevenueDisplay}</div>

          {/* Nút Phân Tích Thông Minh Bằng AI */}
          <button
            className="btn-ai-insight"
            onClick={() => setShowAiModal(true)}
            type="button"
          >
            <span className="ai-icon-spark">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
              </svg>
              Xem phân tích tài chính & đề xuất AI
            </span>
            <span>›</span>
          </button>

          {/* Danh sách ngành hàng phân rã thực tế */}
          {categoryBreakdown.length > 0 ? (
            <div className="cat-breakdown-list">
              {categoryBreakdown.map((cat) => (
                <div key={cat.categoryName} className="cat-breakdown-row">
                  <div className="cat-row-header">
                    <span>{cat.categoryName} ({cat.itemsSold} sản phẩm)</span>
                    <div>
                      <span className="cat-row-amount">{cat.revenue.toLocaleString('vi-VN')} đ</span>
                      <span className="cat-row-pct">({cat.percentage}%)</span>
                    </div>
                  </div>
                  <div className="cat-progress-track">
                    <div
                      className="cat-progress-fill"
                      style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px', color: '#9CA3AF', fontSize: '0.84rem' }}>
              {loading ? 'Đang phân tích cơ cấu doanh thu...' : 'Chưa có dữ liệu danh mục'}
            </div>
          )}

          <div className="needle-axis-labels">
            <span>Dữ liệu CSDL thời gian thực</span>
            <span>Năm tài chính 2026</span>
          </div>
        </div>
      </div>

      {/* ============================================================
           HÀNG 3: BẢNG GIAO DỊCH ĐƠN HÀNG THỰC TẾ
           ============================================================ */}
      <div className="dash-card" style={{ padding: '18px 20px' }}>
        <div className="recent-tx-header">
          <div className="dash-card-title-group">
            <span>GIAO DỊCH ĐƠN HÀNG THỰC TẾ TỪ HỆ THỐNG ({filteredTransactions.length})</span>
            <span>ⓘ</span>
          </div>

          <div className="tx-header-actions">
            <div className="tx-search-box">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                id="tx-search-input"
                placeholder="Tìm mã đơn, tên khách, sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="btn-add-tx" onClick={handleAddNewTx} type="button">
              + Xuất báo cáo
            </button>
            <button
              className="btn-more-options"
              onClick={() => showToast('Tùy chọn lọc nâng cao')}
              type="button"
            >
              ⋯
            </button>
          </div>
        </div>

        <div className="tx-table-wrapper">
          <table className="tx-table">
            <thead>
              <tr>
                <th style={{ width: '28px' }}>
                  <input
                    type="checkbox"
                    className="tx-checkbox"
                    id="tx-check-all"
                    checked={selectedIds.length === filteredTransactions.length && filteredTransactions.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>MÃ ĐƠN ↕</th>
                <th>KHÁCH HÀNG ↕</th>
                <th>SẢN PHẨM ↕</th>
                <th>TRẠNG THÁI ↕</th>
                <th>SL ↕</th>
                <th>ĐƠN GIÁ ↕</th>
                <th>TỔNG TIỀN ↕</th>
                <th style={{ textAlign: 'right' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody id="tx-table-body">
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: '#6B7280' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <div className="w-5 h-5 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
                      <span>Đang nạp toàn bộ giao dịch thực tế từ CSDL...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: '#9CA3AF' }}>
                    Không tìm thấy giao dịch nào phù hợp với "{searchQuery}"
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td style={{ width: '28px' }}>
                      <input
                        type="checkbox"
                        className="tx-checkbox tx-row-check"
                        checked={selectedIds.includes(tx.id)}
                        onChange={() => handleToggleRow(tx.id)}
                      />
                    </td>
                    <td>
                      <span className="tx-id-badge">{tx.id}</span>
                      {tx.date && (
                        <span style={{ display: 'block', fontSize: '0.68rem', color: '#9CA3AF', marginTop: '2px' }}>
                          {tx.date}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="tx-customer-name">{tx.customer}</span>
                    </td>
                    <td>
                      <span className="tx-product-name" title={tx.product}>{tx.product}</span>
                    </td>
                    <td>
                      <span className={`tx-status-badge ${tx.status}`}>{TX_STATUS_LABELS[tx.status] || tx.status}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 650, color: '#111827' }}>{tx.qty}</span>
                    </td>
                    <td>
                      <span className="tx-unit-price">{tx.unitPrice}</span>
                    </td>
                    <td>
                      <span className="tx-total-rev">{tx.total}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-tx-actions"
                        onClick={() => showToast(`Chi tiết đơn ${tx.id}: ${tx.customer} - ${tx.total}`)}
                        type="button"
                        title="Xem chi tiết giao dịch"
                      >
                        •••
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hộp thoại phân tích AI với Dữ Liệu Thật */}
      {showAiModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setShowAiModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '28px',
              maxWidth: '540px',
              width: '90%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ fontSize: '24px' }}>✨</span>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#111827' }}>
                AI Phân Tích & Báo Cáo Tài Chính Thực Tế
              </h3>
            </div>
            <div style={{ fontSize: '14px', lineHeight: '1.7', color: '#4B5563' }}>
              <p style={{ margin: '0 0 10px' }}>
                • <strong>Tổng doanh thu thực tế ghi nhận:</strong> <strong style={{ color: '#111827' }}>{totalRevenueDisplay}</strong> qua <strong>{totalOrdersDisplay}</strong> đã xử lý thành công.
              </p>
              <p style={{ margin: '0 0 10px' }}>
                • <strong>Tăng trưởng doanh thu:</strong> Ghi nhận mức <strong>{growthDisplay}</strong> so với kỳ trước, chứng tỏ nhu cầu mua sắm thời trang xa xỉ tăng mạnh.
              </p>
              {topCategory && (
                <p style={{ margin: '0 0 10px' }}>
                  • <strong>Ngành hàng chủ lực:</strong> <strong>{topCategory.categoryName}</strong> dẫn đầu với <strong>{topCategory.revenue.toLocaleString('vi-VN')} đ</strong> (chiếm {topCategory.percentage}% tổng doanh thu toàn sàn).
                </p>
              )}
              <p style={{ margin: '0 0 10px' }}>
                • <strong>Đề xuất kinh doanh AI:</strong> Tăng cường nhập thêm mẫu mã cho nhóm {topCategory ? topCategory.categoryName : 'thời trang cao cấp'} và triển khai thêm chính sách ưu đãi cho {apiData?.totalCustomers ?? 0} khách hàng trung thành.
              </p>
            </div>
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                style={{
                  background: '#111827',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
                onClick={() => setShowAiModal(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
