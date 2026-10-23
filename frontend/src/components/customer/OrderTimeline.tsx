'use client';

import React from 'react';
import { CUSTOMER_ORDER_STEPS, statusToStepIndex } from '@/lib/customer';

interface OrderTimelineProps {
  status?: string;
  lastLocation?: string;
}

/** Thanh tiến trình 5 bước của đơn hàng nhìn từ phía khách */
export const OrderTimeline: React.FC<OrderTimelineProps> = ({ status, lastLocation }) => {
  const current = statusToStepIndex(status);

  if (current < 0) {
    return (
      <div className="customer-timeline-cancelled">
        <strong>Đơn hàng đã bị hủy</strong>
        {lastLocation && <span>{lastLocation}</span>}
      </div>
    );
  }

  return (
    <ol className="customer-timeline">
      {CUSTOMER_ORDER_STEPS.map((step, idx) => {
        const state = idx < current ? 'done' : idx === current ? 'current' : 'pending';
        return (
          <li key={step.key} className={`customer-timeline-step ${state}`}>
            <span className="customer-timeline-dot">{state === 'done' ? '✓' : idx + 1}</span>
            <div className="customer-timeline-text">
              <strong>{step.title}</strong>
              <span>{idx === current && lastLocation ? lastLocation : step.desc}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
};
