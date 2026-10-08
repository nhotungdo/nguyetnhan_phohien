// ===== ORDER TYPES =====
export interface OrderItemRequest {
  productId: string;
  quantity: number;
}

export interface OrderItemResponse {
  id: string;
  productId: string;
  productName: string;
  productSize?: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

// Backend tự tính tổng tiền từ giá sản phẩm trong DB — client KHÔNG gửi totalAmount.
export interface CreateOrderRequest {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerEmail?: string;
  note?: string;
  items: OrderItemRequest[];
  discountCode?: string;
  // Legacy fallback
  productId?: string;
  quantity?: number;
}

export interface OrderResponse {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerEmail?: string;
  note?: string;
  baseAmount: number;
  totalAmount: number;
  discountAmount: number;
  status: string;
  discountCodeApplied?: string;
  items: OrderItemResponse[];
  // Legacy fallback
  productName?: string;
  productSize?: string;
  quantity?: number;
  createdAt: string;
}

// ===== DISCOUNT TYPES =====
export interface ApplyDiscountRequest {
  code: string;
}

// Mã giảm giá KHÔNG bao giờ cấp quyền admin — không có token/backdoor ở đây.
export interface DiscountResult {
  isValid: boolean;
  message?: string;
  percentOff?: number;
  amountOff?: number;
}

// ===== CHAT TYPES =====
/** Phiên chat do server cấp: SessionId ngẫu nhiên + token chứng minh quyền truy cập phiên. */
export interface ChatSessionCredentials {
  sessionId: string;
  sessionToken: string;
}

export interface SendMessageRequest {
  sessionId: string;
  sessionToken: string;
  content: string;
  guestName?: string;
  guestPhone?: string;
}

export interface ChatMessageResponse {
  id: string;
  content: string;
  senderType: string; // "Guest" | "Admin"
  isRead: boolean;
  sentAt: string;
}

export interface ChatSessionResponse {
  id: string;
  sessionId: string;
  guestName?: string;
  guestPhone?: string;
  hasUnreadMessages: boolean;
  isResolved: boolean;
  lastMessageAt: string;
  lastMessagePreview: string;
}

// ===== CONTENT TYPES =====
export interface WebsiteContentResponse {
  id: string;
  key: string;
  value: string;
  description?: string;
  updatedAt: string;
}

export interface UpdateContentRequest {
  key: string;
  value: string;
  description?: string;
}

// ===== WEBSITE CONTENT KEYS =====
export type ContentKey =
  | "hero_title"
  | "hero_subtitle"
  | "hero_banner_url"
  | "about_text"
  | "contact_phone"
  | "contact_address";

// ===== PRODUCT TYPES =====
export interface ProductImageResponse {
  id: string;
  imagePath: string;
  displayOrder: number;
}

export interface ProductResponse {
  id: string;
  name: string;
  price: number;
  size: string;
  description: string;
  isActive: boolean;
  displayOrder: number;
  images: ProductImageResponse[];
}

export interface ProductRequest {
  name: string;
  price: number;
  size: string;
  description: string;
  isActive: boolean;
  displayOrder: number;
}
