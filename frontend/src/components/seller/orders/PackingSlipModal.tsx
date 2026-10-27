'use client';

import React from 'react';
import type { Order } from '@/types';
import { formatVND, formatDate } from '@/lib/utils';
import { Printer, CheckCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface PackingSlipModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
}

export const PackingSlipModal: React.FC<PackingSlipModalProps> = ({
  isOpen,
  order,
  onClose,
}) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      title={
        <div className="flex items-center justify-between w-full pr-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Phiếu Giao Hàng & Đóng Gói (A5/A4)</h3>
            <p className="text-xs text-slate-500">Mã đơn hàng #{order.orderCode || order.id}</p>
          </div>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer print:hidden"
          >
            <Printer className="w-4 h-4" />
            <span>In Phiếu Ngay</span>
          </button>
        </div>
      }
    >
      {/* NỘI DUNG PHIẾU ĐÓNG GÓI CHUẨN IN ẤN (IN ẤN A5) */}
      <div className="text-slate-800 space-y-5 print:overflow-visible" id="printable-packing-slip">
        {/* Header phiếu */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
          <div>
            <div className="text-xl font-black tracking-widest text-slate-900">AETHELGARD</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">
              Haute Couture Logistics & Fulfillment
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-slate-900 font-mono">
              *{order.orderCode || order.id}*
            </div>
            <div className="text-[10px] text-slate-500">
              Ngày in: {formatDate(new Date(), 'datetime')}
            </div>
          </div>
        </div>

        {/* Thông tin 2 bên: Gửi & Nhận */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-900 mb-1 flex items-center gap-1">
              <span>ĐƠN VỊ GỬI:</span>
              <span className="text-[10px] text-sky-600 font-medium">Kho Tổng Aethelgard</span>
            </div>
            <div className="text-slate-600 space-y-0.5">
              <div>Trung tâm Vận hành Flagship Aethelgard</div>
              <div>Tòa nhà Landmark 81, P. 22, Q. Bình Thạnh, TP. HCM</div>
              <div>Hotline CSKH: 1900 8899 (VIP Support)</div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-900 mb-1 flex items-center gap-1">
              <span>NGƯỜI NHẬN:</span>
              <span className="text-[10px] text-emerald-600 font-medium">Khách Hàng VIP</span>
            </div>
            <div className="text-slate-600 space-y-0.5">
              <div className="font-bold text-slate-900">{order.customerName || 'Quý Khách Hàng'}</div>
              <div>{order.shippingAddress || 'Địa chỉ đăng ký theo hồ sơ tài khoản'}</div>
              <div>Điện thoại: {order.customerPhone || '090 ••• ••••'}</div>
            </div>
          </div>
        </div>

        {/* Bảng danh sách sản phẩm đóng gói */}
        <div>
          <div className="text-xs font-bold text-slate-900 mb-2 uppercase tracking-wider">
            Chi Tiết Sản Phẩm Đóng Hộp
          </div>
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100 text-slate-700 font-bold">
                <th className="py-2 px-2 w-10 text-center">STT</th>
                <th className="py-2 px-3">Tên Tác Phẩm / Sản Phẩm</th>
                <th className="py-2 px-2 text-center w-16">Phân Loại</th>
                <th className="py-2 px-2 text-center w-12">SL</th>
                <th className="py-2 px-3 text-right w-28">Đơn Giá</th>
                <th className="py-2 px-3 text-right w-28">Thành Tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {order.items && order.items.length > 0 ? (
                order.items.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="py-2 px-2 text-center font-medium text-slate-500">{idx + 1}</td>
                    <td className="py-2 px-3">
                      <div className="font-bold text-slate-900">{item.productName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        SKU #{item.productId ? `AE-${String(item.productId).padStart(5, '0')}` : 'AE-CUSTOM'}
                      </div>
                    </td>
                    <td className="py-2 px-2 text-center text-slate-600">Standard</td>
                    <td className="py-2 px-2 text-center font-bold text-slate-900">{item.quantity}</td>
                    <td className="py-2 px-3 text-right text-slate-600 font-mono">
                      {formatVND(item.price)}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900 font-mono">
                      {formatVND(item.subtotal)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-3 text-center text-slate-400">
                    Sản phẩm thời trang cao cấp Aethelgard
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-900 font-bold text-xs">
                <td colSpan={4} className="py-2 px-3 text-right">
                  Tổng Tiền Thu Khách (COD / Đã Thanh Toán):
                </td>
                <td colSpan={2} className="py-2 px-3 text-right text-sm text-sky-700 font-black font-mono">
                  {formatVND(order.totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Ghi chú & Chữ ký nghiệm thu */}
        <div className="pt-2 border-t border-slate-200 text-xs">
          <div className="text-[11px] text-slate-500 italic mb-4">
            * Lưu ý kiểm tra nguyên vẹn tem niêm phong hologram Aethelgard trước khi nhận hàng. Trường hợp bao bì có dấu hiệu cạy mở, quý khách vui lòng từ chối nhận và gọi 1900 8899.
          </div>

          <div className="grid grid-cols-3 gap-4 text-center text-[11px] text-slate-700 pt-2">
            <div>
              <div className="font-bold mb-10">Người Đóng Gói</div>
              <div className="border-t border-slate-300 w-24 mx-auto pt-1 text-[10px] text-slate-400">
                (Ký, ghi rõ họ tên)
              </div>
            </div>
            <div>
              <div className="font-bold mb-10">Đơn Vị Vận Chuyển</div>
              <div className="border-t border-slate-300 w-24 mx-auto pt-1 text-[10px] text-slate-400">
                (Ký xác nhận)
              </div>
            </div>
            <div>
              <div className="font-bold mb-10">Khách Hàng Nhận</div>
              <div className="border-t border-slate-300 w-24 mx-auto pt-1 text-[10px] text-slate-400">
                (Ký xác nhận đã kiểm tra)
              </div>
            </div>
          </div>
        </div>

        {/* Footer bảo đảm */}
        <div className="pt-3 border-t border-dashed border-slate-300 flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-1 text-emerald-600 font-semibold">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Bảo hành chính hãng 12 tháng tại các Boutique chính thức toàn quốc.</span>
          </div>
          <div>Bản in điện tử hợp lệ</div>
        </div>
      </div>
    </Modal>
  );
};
