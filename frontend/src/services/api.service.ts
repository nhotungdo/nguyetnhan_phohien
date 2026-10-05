import type {
  CreateOrderRequest,
  OrderResponse,
  ApplyDiscountRequest,
  DiscountResult,
  ChatMessageResponse,
  ChatSessionResponse,
  SendMessageRequest,
  WebsiteContentResponse,
  UpdateContentRequest,
} from "@/types/api.types";

// Kết quả đăng nhập admin từ POST /api/auth/admin-login
export interface AdminLoginResponse {
  token: string;
  expiresAtUtc: string;
  username: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

// ===== SHARED ERROR HELPERS =====
//
// True khi trang chạy ở nơi KHÔNG phải localhost (vd Vercel) nhưng
// NEXT_PUBLIC_API_URL chưa được cấu hình → mọi call trỏ về http://localhost:5050
// và chắc chắn fail với "Failed to fetch".
function isMissingApiUrlConfig(): boolean {
  if (typeof window === "undefined" || !API_URL.startsWith("http://localhost")) return false;
  return !["localhost", "127.0.0.1"].includes(window.location.hostname);
}

function connectionErrorMessage(): string {
  return `Không kết nối được API tại ${API_URL}. Kiểm tra backend đã chạy chưa và origin của trang có nằm trong AllowedOrigins không.${configHint()}`;
}

// Chỉ ra nguyên nhân phổ biến nhất gây ra "Failed to fetch" trên môi trường deploy.
function configHint(): string {
  if (typeof window === "undefined") return "";
  if (isMissingApiUrlConfig()) {
    return " NEXT_PUBLIC_API_URL chưa được cấu hình ở môi trường này nên đang mặc định là http://localhost:5050 — hãy set nó trên Vercel trỏ tới backend đã deploy.";
  }
  if (window.location.protocol === "https:" && API_URL.startsWith("http://") && !isMissingApiUrlConfig()) {
    return " Trang đang chạy HTTPS còn API là HTTP → trình duyệt chặn (mixed content). Hãy đặt backend ở https://.";
  }
  return "";
}

// Backend có thể trả { message: "..." } hoặc một string trần (vd ProductsController
// trả BadRequest("...")). Đọc cả hai dạng để không lộ "API Error 400" thô.
async function readApiError(res: Response): Promise<Error> {
  const body = await res.json().catch(() => null);
  const message = typeof body === "string" ? body : body?.message;
  return new Error(message || `API Error ${res.status}: ${res.statusText}`);
}

// ===== BASE FETCH HELPER =====
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // Chỉ gửi Content-Type khi thực sự có body: request GET/DELETE không body
  // sẽ không bị trình duyệt bắt buộc CORS preflight (OPTIONS) nữa.
  const headers: HeadersInit = {
    Accept: "application/json",
    ...(options.body != null ? { "Content-Type": "application/json" } : {}),
    ...options.headers,
  };

  let res: Response;
  try {
    // cache: "no-store" — khi Next prerender tĩnh (SSR), fetch mặc định bị đưa vào
    // Data Cache của Next và trả lại JSON ĐÓNG BĂNG từ lần build trước (dữ liệu cũ
    // trong HTML mãi không cập nhật). no-store = luôn đọc bản mới nhất từ API;
    // phần "giữ cho nhanh" do React Query (client) + output-cache của backend đảm nhiệm.
    res = await fetch(`${API_URL}${path}`, { cache: "no-store", ...options, headers });
  } catch {
    // Lỗi mạng / CORS / backend chưa chạy → fetch ném TypeError "Failed to fetch".
    // Chuyển thành thông báo rõ nguyên nhân thay vì để lỗi trần lọt ra console.
    throw new Error(connectionErrorMessage());
  }

  if (!res.ok) throw await readApiError(res);

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json();
}

// Upload multipart/form-data — dùng chung cách báo lỗi với apiFetch.
// Nếu để raw fetch ở từng chỗ thì lỗi CORS/mạng sẽ ném ra "Failed to fetch"
// (tiếng Anh, không dấu) rồi hiện nguyên trong alert.
async function uploadFetch<T>(path: string, file: File): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
  const formData = new FormData();
  formData.append("file", file);

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
  } catch {
    throw new Error(connectionErrorMessage());
  }

  if (!res.ok) throw await readApiError(res);
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
   */
  apply: (data: ApplyDiscountRequest): Promise<DiscountResult> =>
    apiFetch("/api/discount/apply", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /** [ADMIN] Lấy toàn bộ mã giảm giá */
  getAllAdmin: (): Promise<import("@/hooks/useDiscounts").DiscountDto[]> =>
    apiFetch("/api/discount", { headers: getAdminHeaders() }),

  /** [ADMIN] Lấy chi tiết 1 mã */
  getById: (id: string): Promise<import("@/hooks/useDiscounts").DiscountDto> =>
    apiFetch(`/api/discount/${id}`, { headers: getAdminHeaders() }),

  /** [ADMIN] Tạo mã mới */
  create: (data: Partial<import("@/hooks/useDiscounts").DiscountDto>): Promise<import("@/hooks/useDiscounts").DiscountDto> =>
    apiFetch("/api/discount", {
      method: "POST",
      body: JSON.stringify(data),
      headers: getAdminHeaders(),
    }),

  /** [ADMIN] Cập nhật mã */
  update: (id: string, data: Partial<import("@/hooks/useDiscounts").DiscountDto>): Promise<import("@/hooks/useDiscounts").DiscountDto> =>
    apiFetch(`/api/discount/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
      headers: getAdminHeaders(),
    }),

  /** [ADMIN] Xóa mã */
  delete: (id: string): Promise<void> =>
    apiFetch(`/api/discount/${id}`, {
      method: "DELETE",
      headers: getAdminHeaders(),
    }),
};

// ===== CHAT API =====
export const chatApi = {
  /** [PUBLIC] Lấy lịch sử tin nhắn của session */
  getGuestMessages: (sessionId: string): Promise<ChatMessageResponse[]> =>
    apiFetch(`/api/chat/messages/${sessionId}`),

  /** [PUBLIC] Gửi tin nhắn qua REST — fallback khi SignalR/WebSocket bị chặn */
  sendMessage: (data: SendMessageRequest): Promise<ChatMessageResponse> =>
    apiFetch("/api/chat/messages", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /**
   * [PUBLIC] Xác nhận khách đã xem tin của Admin (read receipt).
   * Backend broadcast về group admin để hiện "Đã xem" realtime.
   */
  markGuestMessagesRead: (sessionId: string): Promise<void> =>
    apiFetch(`/api/chat/messages/${sessionId}/read`, { method: "PUT" }),

  /**
   * [ADMIN] Trả lời qua REST — fallback khi SignalR/WebSocket bị chặn.
   * Backend vẫn broadcast realtime qua hub nên khách nhận được ngay.
   */
  adminReply: (data: { chatSessionId: string; content: string }): Promise<ChatMessageResponse> =>
    apiFetch("/api/chat/admin-reply", {
      method: "POST",
      body: JSON.stringify(data),
      headers: getAdminHeaders(),
    }),

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

  /**
   * [ADMIN] Mở/đóng phiên chat (đã phân giải hay chưa).
   * Backend broadcast "SessionResolved" để các tab admin khác cập nhật realtime.
   */
  setResolved: (sessionId: string, isResolved: boolean): Promise<ChatSessionResponse> =>
    apiFetch(`/api/chat/sessions/${sessionId}/resolve?isResolved=${isResolved}`, {
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

  /** [ADMIN] Ảnh upload từ thiết bị cho một ô ảnh của Landing Page
   * (SiteLogo, HeroBannerUrl, StoryImage, CultureImage — backend whitelist key) */
  uploadImage: (key: string, file: File): Promise<{ imagePath: string; message: string }> =>
    uploadFetch(`/api/content/upload-image?key=${encodeURIComponent(key)}`, file),
};


// ===== PRODUCT API =====
export const productApi = {
  /** [PUBLIC] Lấy danh sách sản phẩm hiển thị */
  getAllPublic: (): Promise<import("@/types/api.types").ProductResponse[]> =>
    apiFetch("/api/products"),

  /** [ADMIN] Lấy toàn bộ sản phẩm (kể cả ẩn) */
  getAllAdmin: (): Promise<import("@/types/api.types").ProductResponse[]> =>
    apiFetch("/api/products/admin", { headers: getAdminHeaders() }),

  /** [ADMIN] Tạo sản phẩm mới */
  create: (data: import("@/types/api.types").ProductRequest): Promise<import("@/types/api.types").ProductResponse> =>
    apiFetch("/api/products", {
      method: "POST",
      body: JSON.stringify(data),
      headers: getAdminHeaders(),
    }),

  /** [ADMIN] Cập nhật sản phẩm */
  update: (id: string, data: import("@/types/api.types").ProductRequest): Promise<import("@/types/api.types").ProductResponse> =>
    apiFetch(`/api/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
      headers: getAdminHeaders(),
    }),

  /** [ADMIN] Xóa sản phẩm */
  delete: (id: string): Promise<void> =>
    apiFetch(`/api/products/${id}`, {
      method: "DELETE",
      headers: getAdminHeaders(),
    }),

  /** [ADMIN] Upload ảnh cho sản phẩm (từ thiết bị) */
  uploadImage: (productId: string, file: File): Promise<import("@/types/api.types").ProductImageResponse> =>
    uploadFetch(`/api/products/${productId}/images`, file),

  /** [ADMIN] Xóa ảnh của sản phẩm */
  deleteImage: (productId: string, imageId: string): Promise<void> =>
    apiFetch(`/api/products/${productId}/images/${imageId}`, {
      method: "DELETE",
      headers: getAdminHeaders(),
    }),

  /** [ADMIN] Sắp xếp thứ tự ảnh — id đầu tiên là ảnh đại diện trên Landing Page */
  reorderImages: (productId: string, imageIds: string[]): Promise<void> =>
    apiFetch(`/api/products/${productId}/images/order`, {
      method: "PUT",
      body: JSON.stringify({ imageIds }),
      headers: getAdminHeaders(),
    }),
};

// ===== AUTH API =====
export const authApi = {
  /** Đăng nhập admin bằng username/password → JWT role Admin */
  adminLogin: (username: string, password: string): Promise<AdminLoginResponse> =>
    apiFetch("/api/auth/admin-login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  /** Kiểm tra token hiện tại còn hiệu lực */
  me: (): Promise<{ username: string; authenticated: boolean }> =>
    apiFetch("/api/auth/me", { headers: getAdminHeaders() }),
};

// ===== ADMIN AUTH HELPERS =====
export const adminAuth = {
  /** Lưu token admin vào localStorage sau khi đăng nhập thành công */
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
