import * as signalR from '@microsoft/signalr';
import { SIGNALR_EVENTS, API_BASE_URL } from '@/lib/constants';

export interface SignalRNotification {
  id: string;
  title: string;
  message: string;
  orderCode?: string;
  orderId?: number;
  totalAmount?: number;
  status?: string;
  type: 'ORDER_CREATED' | 'ORDER_STATUS' | 'PAYMENT_CONFIRMED' | 'INFO';
  createdAt: string;
  read: boolean;
}

export interface SignalROrderCreatedPayload {
  orderCode?: string;
  orderId?: number;
  title?: string;
  message?: string;
  customerName?: string;
  totalAmount?: number;
}

export interface SignalROrderStatusPayload {
  orderCode?: string;
  orderId?: number;
  title?: string;
  message?: string;
  status?: string;
  statusLabel?: string;
}

type NotificationListener = (notification: SignalRNotification) => void;

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private listeners: NotificationListener[] = [];
  private isConnecting = false;

  public async startConnection(): Promise<void> {
    if (typeof window === 'undefined') return;
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      return;
    }
    if (this.isConnecting) return;

    this.isConnecting = true;
    try {
      const hubUrl = `${API_BASE_URL.replace('/api', '')}/hubs/notifications`;

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          skipNegotiation: false,
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      // Cấu hình tối ưu nhịp tim kết nối (Item 51)
      this.connection.serverTimeoutInMilliseconds = 30000;
      this.connection.keepAliveIntervalInMilliseconds = 15000;

      // Đăng ký các sự kiện sử dụng hằng số tập trung (Item 30 & 32)
      this.connection.on(SIGNALR_EVENTS.RECEIVE_ORDER_CREATED, (data: SignalROrderCreatedPayload) => {
        const notif: SignalRNotification = {
          id: `order-created-${data.orderCode || Date.now()}`,
          title: data.title || 'Đơn Hàng Mới!',
          message: data.message || `Khách hàng ${data.customerName || 'VIP'} vừa đặt đơn ${data.orderCode}.`,
          orderCode: data.orderCode,
          orderId: data.orderId,
          totalAmount: data.totalAmount,
          type: 'ORDER_CREATED',
          createdAt: new Date().toISOString(),
          read: false,
        };
        this.notifyListeners(notif);
      });

      this.connection.on(SIGNALR_EVENTS.RECEIVE_ORDER_STATUS_UPDATED, (data: SignalROrderStatusPayload) => {
        const notif: SignalRNotification = {
          id: `order-status-${data.orderCode || Date.now()}-${Date.now()}`,
          title: data.title || 'Cập Nhật Trạng Thái Đơn Hàng',
          message: data.message || `Đơn hàng ${data.orderCode} vừa cập nhật: ${data.statusLabel}.`,
          orderCode: data.orderCode,
          orderId: data.orderId,
          status: data.status,
          type: 'ORDER_STATUS',
          createdAt: new Date().toISOString(),
          read: false,
        };
        this.notifyListeners(notif);
      });

      this.connection.on(SIGNALR_EVENTS.RECEIVE_PAYMENT_CONFIRMED, (data: SignalROrderCreatedPayload) => {
        const notif: SignalRNotification = {
          id: `payment-${data.orderCode || Date.now()}`,
          title: data.title || 'Thanh Toán Thành Công!',
          message: data.message || `Đơn hàng ${data.orderCode} vừa thanh toán thành công qua VNPay.`,
          orderCode: data.orderCode,
          orderId: data.orderId,
          type: 'PAYMENT_CONFIRMED',
          createdAt: new Date().toISOString(),
          read: false,
        };
        this.notifyListeners(notif);
      });

      await this.connection.start();

      // Tự động tham gia group của Seller
      const storedUser = localStorage.getItem('aethelgard_user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          if (user && user.userId && (user.role === 'Seller' || user.role === 'Admin')) {
            await this.joinSellerGroup(user.userId);
          }
        } catch {}
      }
    } catch {
      // Bỏ qua lỗi kết nối ban đầu
    } finally {
      this.isConnecting = false;
    }
  }

  public async joinSellerGroup(sellerId: number): Promise<void> {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      try {
        await this.connection.invoke('JoinSellerGroup', sellerId);
      } catch {}
    }
  }

  public async joinCustomerGroup(customerEmail: string): Promise<void> {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      try {
        await this.connection.invoke('JoinCustomerGroup', customerEmail);
      } catch {}
    }
  }

  public subscribe(listener: NotificationListener): () => void {
    this.listeners.push(listener);
    if (!this.connection || this.connection.state === signalR.HubConnectionState.Disconnected) {
      this.startConnection();
    }
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(notification: SignalRNotification): void {
    this.listeners.forEach((listener) => {
      try {
        listener(notification);
      } catch (err) {
        console.error('Lỗi listener SignalR:', err);
      }
    });
  }

  public async stopConnection(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
    }
  }
}

export const signalRService = new SignalRService();
