import type {
  CreateOrderRequest,
  OrderResponse,
  RecentOrderActivity,
  ApplyDiscountRequest,
  DiscountResult,
  ChatMessageResponse,
  ChatSessionResponse,
  ChatStatsResponse,
  ChatSessionCredentials,
  SendMessageRequest,
  WebsiteContentResponse,
  UpdateContentRequest,
  PaymentSettings,
  DashboardStatsResponse,
  CustomMixOptionsResponse,
  ValidateCustomMixRequest,
  ValidateCustomMixResponse,
} from "@/types/api.types";

// Kết quả đăng nhập admin từ POST /api/auth/admin-login
export interface AdminLoginResponse {
  token: string;
  expiresAtUtc: string;
  username: string;
}

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050").replace(/\/+$/, "");

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

  /** [PUBLIC] Lấy danh sách các đơn hàng gần đây từ database (đã ẩn danh) để hiển thị Social Proof */
  getRecentActivities: (limit = 10): Promise<RecentOrderActivity[]> =>
    apiFetch(`/api/orders/recent-activities?limit=${limit}`),

  /** [ADMIN] Lấy toàn bộ đơn hàng */
  getAll: (): Promise<OrderResponse[]> =>
    apiFetch("/api/orders", { headers: getAdminHeaders() }),

  /** [ADMIN] Lấy đơn hàng theo ID */
  getById: (id: string): Promise<OrderResponse> =>
    apiFetch(`/api/orders/${id}`, { headers: getAdminHeaders() }),

  /** [ADMIN] Cập nhật trạng thái đơn hàng (tự động gửi email xác nhận hủy nếu chuyển sang Cancelled) */
  updateStatus: (id: string, status: string, reason?: string): Promise<OrderResponse> =>
    apiFetch(`/api/orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status, reason }),
      headers: getAdminHeaders(),
    }),

  /** [ADMIN] Gửi lại hóa đơn qua email tới khách hàng */
  resendInvoice: (id: string): Promise<{ message: string }> =>
    apiFetch(`/api/orders/${id}/resend-invoice`, {
      method: "POST",
      headers: getAdminHeaders(),
    }),

  /** [ADMIN] Gửi lại email xác nhận hủy đơn qua email tới khách hàng */
  resendCancellation: (id: string, reason?: string): Promise<{ message: string }> =>
    apiFetch(`/api/orders/${id}/resend-cancellation`, {
      method: "POST",
      body: JSON.stringify({ reason }),
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
  /**
   * [PUBLIC] Bắt đầu phiên chat mới: server sinh SessionId ngẫu nhiên và trả về token.
   * Client KHÔNG tự đặt SessionId — token là bằng chứng duy nhất để truy cập phiên
   * (không có token thì không đọc/gửi được tin của phiên đó).
   */
  createSession: (data?: { guestName?: string; guestPhone?: string }): Promise<ChatSessionCredentials> =>
    apiFetch("/api/chat/session", {
      method: "POST",
      body: JSON.stringify({ guestName: data?.guestName, guestPhone: data?.guestPhone }),
    }),

  /** [PUBLIC] Lấy lịch sử tin nhắn của phiên (cần token phiên, gửi qua header) */
  getGuestMessages: (sessionId: string, sessionToken: string): Promise<ChatMessageResponse[]> =>
    apiFetch(`/api/chat/messages/${sessionId}`, {
      headers: { "X-Chat-Token": sessionToken },
    }),

  /** [PUBLIC] Gửi tin nhắn qua REST — fallback khi SignalR/WebSocket bị chặn */
  sendMessage: (data: SendMessageRequest): Promise<ChatMessageResponse> =>
    apiFetch("/api/chat/messages", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /**
   * [PUBLIC] Xác nhận khách đã xem tin của Admin (read receipt) — cần token phiên.
   * Backend broadcast về group admin để hiện "Đã xem" realtime.
   */
  markGuestMessagesRead: (sessionId: string, sessionToken: string): Promise<void> =>
    apiFetch(`/api/chat/messages/${sessionId}/read`, {
      method: "PUT",
      headers: { "X-Chat-Token": sessionToken },
    }),

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

  /** [ADMIN] Lấy số lượng phiên chat & số chưa đọc siêu nhanh cho Dashboard */
  getStats: async (): Promise<ChatStatsResponse> => {
    try {
      return await apiFetch<ChatStatsResponse>("/api/chat/stats", { headers: getAdminHeaders() });
    } catch {
      // Fallback nếu backend chưa cập nhật endpoint stats
      const sessions = await chatApi.getAllSessions();
      return {
        totalSessions: sessions.length,
        unreadSessions: sessions.filter((s) => s.hasUnreadMessages).length,
      };
    }
  },

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

  /**
   * [ADMIN] Xoá hẳn phiên chat kèm tin nhắn. Backend broadcast "SessionDeleted"
   * để các tab admin khác bỏ phiên khỏi danh sách và widget của khách tự mở phiên mới.
   */
  deleteSession: (sessionId: string): Promise<void> =>
    apiFetch(`/api/chat/sessions/${sessionId}`, {
      method: "DELETE",
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

// ===== PAYMENT SETTINGS API =====
// Thông tin nhận thanh toán (VietQR) in trong email hóa đơn. Chủ shop sửa ở /payment
// nên đổi số tài khoản KHÔNG cần build lại hay sửa appsettings.
export const paymentSettingsApi = {
  /** [ADMIN] Lấy cấu hình nhận thanh toán hiện tại */
  get: (): Promise<PaymentSettings> =>
    apiFetch("/api/payment-settings", { headers: getAdminHeaders() }),

  /** [ADMIN] Cập nhật cấu hình nhận thanh toán */
  update: (data: PaymentSettings): Promise<PaymentSettings> =>
    apiFetch("/api/payment-settings", {
      method: "PUT",
      body: JSON.stringify(data),
      headers: getAdminHeaders(),
    }),
};

// ===== DASHBOARD API =====
export const dashboardApi = {
  /** [ADMIN] Lấy toàn bộ số liệu tổng quan siêu nhanh (tính sẵn phía server, phản hồi < 1ms) */
  getStats: (): Promise<DashboardStatsResponse> =>
    apiFetch("/api/dashboard/stats", { headers: getAdminHeaders() }),
};

// ===== NUTRITION AI API (Trợ lý Dinh Dưỡng & Dưỡng Sinh Đa Hạt) =====
export interface SuggestedProduct {
  id: string;
  name: string;
  size: string;
  price: number;
  imageUrl?: string;
  reason?: string;
}

export interface NutritionConsultationRequest {
  message: string;
  history?: { role: string; content: string }[];
  healthProfile?: {
    goal?: string;
    healthCondition?: string;
    allergens?: string[];
  };
}

export interface NutritionConsultationResponse {
  reply: string;
  suggestedProducts: SuggestedProduct[];
  portionTip?: string;
  allergenNotice?: string;
}

export interface NutritionStreamMeta {
  suggestedProducts?: SuggestedProduct[];
  portionTip?: string;
  allergenNotice?: string;
}

export interface NutritionStreamCallbacks {
  onChunk: (text: string) => void;
  onMeta?: (meta: NutritionStreamMeta) => void;
  onError?: (err: Error) => void;
  onDone?: () => void;
}

export const nutritionAiApi = {
  consult: (req: NutritionConsultationRequest): Promise<NutritionConsultationResponse> =>
    apiFetch("/api/ai/nutrition/consult", {
      method: "POST",
      body: JSON.stringify(req),
    }),

  stream: async (
    req: NutritionConsultationRequest,
    callbacks: NutritionStreamCallbacks,
    signal?: AbortSignal
  ): Promise<void> => {
    let res: Response;
    try {
      res = await fetch(`${API_URL}/api/ai/nutrition/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify(req),
        signal,
      });
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") return;
      throw new Error(connectionErrorMessage());
    }

    if (!res.ok) {
      throw await readApiError(res);
    }

    if (!res.body) {
      throw new Error("Trình duyệt không hỗ trợ đọc luồng phản hồi.");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const dataStr = trimmed.substring(6).trim();
          if (dataStr === "[DONE]") {
            callbacks.onDone?.();
            return;
          }

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.event === "chunk" && parsed.text) {
              callbacks.onChunk(parsed.text);
            } else if (parsed.event === "meta") {
              const rawProducts = Array.isArray(parsed.suggestedProducts) ? parsed.suggestedProducts : [];
              const normalizedProducts: SuggestedProduct[] = rawProducts.map((p: Record<string, unknown>) => ({
                id: String(p.id ?? p.Id ?? ""),
                name: String(p.name ?? p.Name ?? ""),
                size: String(p.size ?? p.Size ?? ""),
                price: typeof p.price === "number" ? p.price : typeof p.Price === "number" ? p.Price : (Number(p.price || p.Price) || 0),
                imageUrl: (p.imageUrl ?? p.ImageUrl) ? String(p.imageUrl ?? p.ImageUrl) : undefined,
                reason: (p.reason ?? p.Reason) ? String(p.reason ?? p.Reason) : undefined,
              }));
              callbacks.onMeta?.({
                suggestedProducts: normalizedProducts,
                portionTip: (parsed.portionTip ?? parsed.PortionTip) ? String(parsed.portionTip ?? parsed.PortionTip) : undefined,
                allergenNotice: (parsed.allergenNotice ?? parsed.AllergenNotice) ? String(parsed.allergenNotice ?? parsed.AllergenNotice) : undefined,
              });
            } else if (parsed.event === "error") {
              callbacks.onError?.(new Error(parsed.message || "Lỗi phản hồi từ AI."));
            }
          } catch {
            // bỏ qua parse error cho chunk chưa hoàn chỉnh
          }
        }
      }
      callbacks.onDone?.();
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") return;
      callbacks.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  },
};

// ===== CUSTOM MIX (TỰ CHỌN HẠT) API =====
export const customMixApi = {
  /** [PUBLIC] Lấy danh sách quy cách bao bì (150g, 300g, 900g) và 5 loại hạt đang mở bán */
  getOptions: async (): Promise<CustomMixOptionsResponse> => {
    return apiFetch<CustomMixOptionsResponse>("/api/custom-mix/options");
  },

  /** [PUBLIC] Kiểm tra tính hợp lệ của công thức tự chọn hạt và tính giá niêm yết */
  validate: async (request: ValidateCustomMixRequest): Promise<ValidateCustomMixResponse> => {
    return apiFetch<ValidateCustomMixResponse>("/api/custom-mix/validate", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },
};

// ===== ADMIN AUTH HELPERS =====
export const adminAuth = {
  /** Lưu token admin vào localStorage sau khi đăng nhập thành công */
  login: (token: string) => {
    localStorage.setItem("adminToken", token);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("adminAuthChange"));
    }
  },

  /** Xóa token admin */
  logout: () => {
    localStorage.removeItem("adminToken");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("adminAuthChange"));
    }
  },

  /** Kiểm tra admin đang đăng nhập */
  isLoggedIn: (): boolean => {
    if (typeof window === "undefined") return false;
    const token = localStorage.getItem("adminToken");
    if (!token) return false;
    // Decode JWT expiry (basic check)
    try {
      // JWT là base64url: "-"/"_" thay cho "+"/"/" và có thể thiếu padding.
      // atob() với chuỗi base64url có thể ném lỗi → token còn hạn bị coi là hết hạn
      // (useAdminGuard đá về trang đăng nhập oan). Chuyển về base64 chuẩn + bù "=".
      const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
      const payload = JSON.parse(atob(padded));
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
