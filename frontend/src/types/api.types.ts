// ===== ORDER TYPES =====
export interface CreateOrderRequest {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerEmail?: string;
  note?: string;
  totalAmount: number;
  discountCode?: string;
}

export interface OrderResponse {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerEmail?: string;
  note?: string;
  totalAmount: number;
  discountAmount: number;
  status: string;
  discountCodeApplied?: string;
  createdAt: string;
}

// ===== DISCOUNT TYPES =====
export interface ApplyDiscountRequest {
  code: string;
}

export interface DiscountResult {
  isValid: boolean;
  message: string;
  isAdminBackdoor: boolean;
  adminToken?: string;
  percentOff?: number;
  amountOff?: number;
  code?: string;
}

// ===== CHAT TYPES =====
export interface SendMessageRequest {
  sessionId: string;
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
