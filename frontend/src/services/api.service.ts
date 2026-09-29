import type {
  CreateOrderRequest,
  OrderResponse,
  ApplyDiscountRequest,
  DiscountResult,
  ChatMessageResponse,
  ChatSessionResponse,
  WebsiteContentResponse,
  UpdateContentRequest,
} from "@/types/api.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

// ===== BASE FETCH HELPER =====
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(
      errData?.message || `API Error ${res.status}: ${res.statusText}`
    );
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json();
}

// Helper để lấy auth header cho admin
function getAdminHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ===== ORDER API =====
export const orderApi = {
  /** [PUBLIC] Tạo đơn hàng mới */
  create: (data: CreateOrderRequest): Promise<OrderResponse> =>
    apiFetch("/api/orders", { method: "POST", body: JSON.stringify(data) }),

  /** [ADMIN] Lấy toàn bộ đơn hàng */
  getAll: (): Promise<OrderResponse[]> =>
    apiFetch("/api/orders", { headers: getAdminHeaders() }),

  /** [ADMIN] Lấy đơn hàng theo ID */
  getById: (id: string): Promise<OrderResponse> =>
    apiFetch(`/api/orders/${id}`, { headers: getAdminHeaders() }),

  /** [ADMIN] Cập nhật trạng thái đơn hàng */
  updateStatus: (id: string, status: string): Promise<OrderResponse> =>
    apiFetch(`/api/orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
      headers: getAdminHeaders(),
    }),
};

// ===== DISCOUNT API =====
export const discountApi = {
  /**
   * [PUBLIC] Áp dụng mã giảm giá.
   * Nếu là mã Admin backdoor → trả về { isAdminBackdoor: true, adminToken: "..." }
   */
  apply: (data: ApplyDiscountRequest): Promise<DiscountResult> =>
    apiFetch("/api/discount/apply", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ===== CHAT API =====
export const chatApi = {
  /** [PUBLIC] Lấy lịch sử tin nhắn của session */
  getGuestMessages: (sessionId: string): Promise<ChatMessageResponse[]> =>
    apiFetch(`/api/chat/messages/${sessionId}`),

  /** [ADMIN] Lấy tất cả phiên chat */
  getAllSessions: (): Promise<ChatSessionResponse[]> =>
    apiFetch("/api/chat/sessions", { headers: getAdminHeaders() }),

  /** [ADMIN] Lấy tin nhắn theo session ID */
  getSessionMessages: (sessionId: string): Promise<ChatMessageResponse[]> =>
    apiFetch(`/api/chat/sessions/${sessionId}/messages`, {
      headers: getAdminHeaders(),
    }),

  /** [ADMIN] Đánh dấu đã đọc */
  markRead: (sessionId: string): Promise<void> =>
    apiFetch(`/api/chat/sessions/${sessionId}/read`, {
      method: "PUT",
      headers: getAdminHeaders(),
    }),
};

// ===== CONTENT API =====
export const contentApi = {
  /** [PUBLIC] Lấy toàn bộ nội dung website */
  getAll: (): Promise<WebsiteContentResponse[]> => apiFetch("/api/content"),

  /** [PUBLIC] Lấy nội dung theo key */
  getByKey: (key: string): Promise<WebsiteContentResponse> =>
    apiFetch(`/api/content/${key}`),

  /** [ADMIN] Cập nhật nội dung website */
  upsert: (data: UpdateContentRequest): Promise<WebsiteContentResponse> =>
    apiFetch("/api/content", {
      method: "PUT",
      body: JSON.stringify(data),
      headers: getAdminHeaders(),
    }),
};

// ===== ADMIN AUTH HELPERS =====
export const adminAuth = {
  /** Lưu token admin vào localStorage sau khi backdoor login thành công */
  login: (token: string) => {
    localStorage.setItem("adminToken", token);
  },

  /** Xóa token admin */
  logout: () => {
    localStorage.removeItem("adminToken");
  },

  /** Kiểm tra admin đang đăng nhập */
  isLoggedIn: (): boolean => {
    if (typeof window === "undefined") return false;
    const token = localStorage.getItem("adminToken");
    if (!token) return false;
    // Decode JWT expiry (basic check)
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  },

  /** Lấy token */
  getToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("adminToken");
  },
};
