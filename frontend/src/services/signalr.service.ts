import * as signalR from '@microsoft/signalr';

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
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl('http://localhost:5000/hubs/notifications', {
          skipNegotiation: false,
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      this.connection.on('ReceiveOrderCreated', (data: any) => {
        const notif: SignalRNotification = {
          id: `order-created-${data.orderCode || Date.now()}`,
          title: data.title || 'Đơn Hàng Mới!',
          message: data.message || `Khách hàng ${data.customerName} vừa đặt đơn ${data.orderCode}.`,
          orderCode: data.orderCode,
          orderId: data.orderId,
          totalAmount: data.totalAmount,
          type: 'ORDER_CREATED',
          createdAt: new Date().toISOString(),
          read: false,
        };
        this.notifyListeners(notif);
      });

      this.connection.on('ReceiveOrderStatusUpdated', (data: any) => {
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

      this.connection.on('ReceivePaymentConfirmed', (data: any) => {
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
    } catch (err) {
      // Tự động kết nối lại ngầm
    } finally {
      this.isConnecting = false;
    }
  }

  public subscribe(listener: NotificationListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(notification: SignalRNotification) {
    this.listeners.forEach((listener) => {
      try {
        listener(notification);
      } catch {}
    });
  }

  public async joinSellerGroup(): Promise<void> {
    try {
      if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
        await this.connection.invoke('JoinSellerGroup');
      }
    } catch {}
  }

  public async joinCustomerGroup(email: string): Promise<void> {
    try {
      if (this.connection && this.connection.state === signalR.HubConnectionState.Connected && email) {
        await this.connection.invoke('JoinCustomerGroup', email.trim().toLowerCase());
      }
    } catch {}
  }

  public async stopConnection(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
    }
  }
}

export const signalRService = new SignalRService();
