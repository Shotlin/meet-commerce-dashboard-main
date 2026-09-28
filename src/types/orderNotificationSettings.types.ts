export type OrderNotificationEventKey =
  | "ORDER_PLACED"
  | "CONFIRMED"
  | "PREPARING"
  | "PACKED"
  | "RIDER_ACCEPTED"
  | "PICKED_UP"
  | "OTP_RESENT"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export interface OrderNotificationSetting {
  eventKey: OrderNotificationEventKey;
  label: string;
  title: string;
  message: string;
  notificationEnabled: boolean;
  bannerEnabled: boolean;
  imageUrl: string | null;
  updatedAt: string | null;
}

export interface UpdateOrderNotificationSettingPayload {
  title?: string;
  message?: string;
  notificationEnabled?: boolean;
  bannerEnabled?: boolean;
  imageUrl?: string | null;
}
