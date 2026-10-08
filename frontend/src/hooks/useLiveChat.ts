"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import { chatApi } from "@/services/api.service";
import type { ChatMessageResponse } from "@/types/api.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

/** Chỉ gửi tín hiệu "đang gõ" tối đa mỗi TYPING_THROTTLE_MS để không spam hub. */
const TYPING_THROTTLE_MS = 1500;
/** Tự ẩn chỉ báo "admin đang gõ" nếu không nhận được tín hiệu mới. */
const TYPING_HIDE_MS = 4000;

/** Khoá lưu phiên chat của tab hiện tại (id + token do server cấp). */
const SESSION_ID_KEY = "chatSessionId";
const SESSION_TOKEN_KEY = "chatSessionToken";

interface ChatSessionCreds {
  id: string;
  token: string;
}

// Đọc phiên đã lưu trong tab. PHẢI có cả token: chỉ id không đủ để truy cập phiên
// (server luôn yêu cầu token do chính server ký).
function readStoredSession(): ChatSessionCreds | null {
  if (typeof window === "undefined") return null;
  const id = sessionStorage.getItem(SESSION_ID_KEY);
  const token = sessionStorage.getItem(SESSION_TOKEN_KEY);
  return id && token ? { id, token } : null;
}

function storeSession(creds: ChatSessionCreds) {
  sessionStorage.setItem(SESSION_ID_KEY, creds.id);
  sessionStorage.setItem(SESSION_TOKEN_KEY, creds.token);
}

function clearStoredSession() {
  sessionStorage.removeItem(SESSION_ID_KEY);
  sessionStorage.removeItem(SESSION_TOKEN_KEY);
}

export function useLiveChat() {
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  /** Admin đang gõ — tự ẩn sau TYPING_HIDE_MS nếu không có tín hiệu mới. */
  const [isAdminTyping, setIsAdminTyping] = useState(false);

  const connectionRef = useRef<signalR.HubConnection | null>(null);
  /** Phiên chat hiện tại (id + token do server cấp) — null khi chưa xin phiên. */
  const sessionRef = useRef<ChatSessionCreds | null>(null);
  const messagesRef = useRef<ChatMessageResponse[]>([]);
  const adminTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(0);

  // Dùng ref cho tên/SĐT khách để re-join đúng thông tin sau reconnect
  // mà không cần re-register handlers
  const guestInfoRef = useRef<{ name?: string; phone?: string }>({});

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  /**
   * Lấy phiên chat đang lưu trong tab; nếu chưa có thì xin SERVER cấp phiên mới
   * (SessionId ngẫu nhiên + token). forceNew = true khi token cũ bị server từ chối.
   * Không còn tự sinh sessionId ở client — đó là lỗi cho phép chiếm phiên người khác.
   */
  const ensureSession = useCallback(
    async (forceNew = false, guestName?: string, guestPhone?: string): Promise<ChatSessionCreds> => {
      if (!forceNew) {
        const stored = readStoredSession();
        if (stored) {
          sessionRef.current = stored;
          return stored;
        }
      }

      const created = await chatApi.createSession({ guestName, guestPhone });
      const creds: ChatSessionCreds = { id: created.sessionId, token: created.sessionToken };
      storeSession(creds);
      sessionRef.current = creds;
      return creds;
    },
    []
  );

  // Kết nối SignalR
  const connect = useCallback(async (guestName?: string, guestPhone?: string) => {
    guestInfoRef.current = { name: guestName, phone: guestPhone };

    const creds = await ensureSession(false, guestName, guestPhone);

    // Đã kết nối rồi: chỉ cập nhật thông tin khách (tên/SĐT nhập ở lần bắt đầu chat)
    // bằng cách join lại — backend sẽ ghi đè lên phiên trong DB.
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      if (guestName || guestPhone) {
        connectionRef.current
          .invoke("JoinAsGuest", creds.id, creds.token, guestName ?? null, guestPhone ?? null)
          .catch(() => {});
      }
      return;
    }

    // Load lịch sử trước khi kết nối
    setIsLoading(true);
    try {
      const history = await chatApi.getGuestMessages(creds.id, creds.token);
      setMessages(history);
    } catch {
      // Phiên mới chưa có lịch sử (hoặc token không dùng được) — bỏ qua
    } finally {
      setIsLoading(false);
    }

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_URL}/hubs/chat`, {
        withCredentials: true,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.None)
      .build();

    // Nhận tin nhắn từ Admin — event name phải khớp ChatHub.AdminReply
    connection.on("ReceiveAdminMessage", (message: ChatMessageResponse) => {
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    });

    // Echo xác nhận tin nhắn của chính khách đã được lưu
    connection.on("MessageSent", (message: ChatMessageResponse) => {
      setMessages((prev) => {
        // Tránh hiển thị trùng nếu tin nhắn đã được append optimistic
        const exists = prev.some((m) => m.id === message.id);
        return exists ? prev : [...prev, message];
      });
    });

    // Admin đã mở phiên => tin của khách được xem → hiện "Đã xem"
    connection.on("MessagesRead", () => {
      setMessages((prev) =>
        prev.map((m) => (m.senderType === "Guest" ? { ...m, isRead: true } : m))
      );
    });

    // Admin xoá phiên này (dọn phiên rác/spam hoặc theo yêu cầu xoá dữ liệu của khách).
    // Phiên cũ không còn tồn tại nên gửi tiếp sẽ lỗi — tự xin phiên mới và join lại
    // để khách tiếp tục chat được ngay thay vì báo "không gửi được tin nhắn".
    connection.on("SessionDeleted", async (data: { sessionId: string; sessionKey: string }) => {
      const current = sessionRef.current;
      if (!current || current.id !== data.sessionKey) return;

      clearStoredSession();
      sessionRef.current = null;
      setMessages([]);

      try {
        const fresh = await ensureSession(true, guestInfoRef.current.name, guestInfoRef.current.phone);
        await connection.invoke(
          "JoinAsGuest",
          fresh.id,
          fresh.token,
          guestInfoRef.current.name ?? null,
          guestInfoRef.current.phone ?? null
        );
      } catch (err) {
        console.warn("Phiên chat đã bị xoá, chưa tạo được phiên mới:", err);
      }
    });

    // Admin đang gõ
    connection.on("AdminTyping", (isTyping: boolean) => {
      setIsAdminTyping(isTyping);
      if (adminTypingTimeoutRef.current) clearTimeout(adminTypingTimeoutRef.current);
      if (isTyping) {
        adminTypingTimeoutRef.current = setTimeout(
          () => setIsAdminTyping(false),
          TYPING_HIDE_MS
        );
      }
    });

    connection.onclose(() => setIsConnected(false));
    connection.onreconnected(async () => {
      setIsConnected(true);
      // Sau reconnect, connection id mới => mất membership của group cũ.
      // Phải join lại group phiên chat thì mới tiếp tục nhận tin nhắn admin.
      const current = sessionRef.current;
      if (!current) return;

      try {
        await connection.invoke(
          "JoinAsGuest",
          current.id,
          current.token,
          guestInfoRef.current.name ?? null,
          guestInfoRef.current.phone ?? null
        );
      } catch (err) {
        console.error("Failed to re-join session group after reconnect:", err);
      }
      // Tin nhắn trao đổi trong lúc mất kết nối không tự đến — tải lại lịch sử từ server
      try {
        const history = await chatApi.getGuestMessages(current.id, current.token);
        setMessages(history);
      } catch (err) {
        console.error("Failed to reload chat history after reconnect:", err);
      }
    });

    try {
      await connection.start();
      // Tham gia vào group của phiên này (hub kiểm tra token trước khi cho join)
      await connection.invoke("JoinAsGuest", creds.id, creds.token, guestName || null, guestPhone || null);
      setIsConnected(true);
      connectionRef.current = connection;
    } catch (err) {
      if (
        err instanceof Error &&
        err.message !== "The connection was stopped during negotiation." &&
        err.message !== "Failed to start the HttpConnection before stop() was called."
      ) {
        console.error("SignalR connection error:", err);
      } else if (!(err instanceof Error)) {
        console.error("SignalR connection error:", err);
      }

      // Token bị server từ chối (phiên đã bị xoá / DB reset): bỏ phiên cũ, xin phiên
      // mới rồi join lại MỘT lần để khách không bị kẹt không chat được.
      try {
        clearStoredSession();
        const fresh = await ensureSession(true, guestName, guestPhone);
        await connection.invoke("JoinAsGuest", fresh.id, fresh.token, guestName || null, guestPhone || null);
        setIsConnected(true);
        connectionRef.current = connection;
      } catch {
        // Vẫn thất bại (backend chưa chạy...) — im lặng như trước, REST vẫn dùng được.
      }
    }
  }, [ensureSession]);

  // Báo cho admin biết khách đang gõ (throttle, chỉ khi hub đang kết nối)
  const notifyTyping = useCallback(() => {
    const conn = connectionRef.current;
    const current = sessionRef.current;
    if (conn?.state !== signalR.HubConnectionState.Connected || !current) return;

    const now = Date.now();
    if (now - lastTypingSentRef.current < TYPING_THROTTLE_MS) return;
    lastTypingSentRef.current = now;

    conn.invoke("GuestTyping", current.id, current.token, true).catch(() => {});
  }, []);

  // Xác nhận khách đã xem tin của Admin (chỉ gọi khi widget đang mở).
  // Backend broadcast "GuestReadMessages" để admin hiện "Đã xem" realtime.
  const markMessagesRead = useCallback(async () => {
    const current = sessionRef.current;
    if (!current) return;

    const hasUnreadAdminMessage = messagesRef.current.some(
      (m) => m.senderType === "Admin" && !m.isRead
    );
    if (!hasUnreadAdminMessage) return;

    try {
      await chatApi.markGuestMessagesRead(current.id, current.token);
    } catch (err) {
      console.warn("Mark messages read failed:", err);
    }
  }, []);

  // Gửi tin nhắn: ưu tiên SignalR realtime, fallback REST nếu WebSocket/SignalR bị chặn.
  // Trả về true nếu tin đã được gửi thành công (client giữ nguyên input khi false).
  const sendMessage = useCallback(async (content: string, guestName?: string, guestPhone?: string): Promise<boolean> => {
    if (!content.trim()) return false;

    setIsSending(true);
    try {
      const conn = connectionRef.current;
      const connected = conn?.state === signalR.HubConnectionState.Connected;

      // Phiên phải tồn tại trước khi gửi (token do server cấp ở POST /api/chat/session)
      const creds = await ensureSession(false, guestName, guestPhone);

      if (connected) {
        await conn.invoke("SendGuestMessage", creds.id, creds.token, content.trim());
        // Không cần hiển thị "đang gõ" nữa sau khi tin đã gửi
        conn.invoke("GuestTyping", creds.id, creds.token, false).catch(() => {});
        return true;
      }

      // SignalR chưa kết nối (mạng chặn WebSocket, server restart...):
      // gửi qua REST — tin nhắn vẫn được lưu và admin vẫn thấy realtime
      // (backend broadcast qua hub ngay trong controller).
      const saved = await chatApi.sendMessage({
        sessionId: creds.id,
        sessionToken: creds.token,
        content: content.trim(),
        guestName: guestName || guestInfoRef.current.name,
        guestPhone: guestPhone || guestInfoRef.current.phone,
      });
      // Hiển thị ngay tin đã lưu (không chờ realtime echo)
      setMessages((prev) => (prev.some((m) => m.id === saved.id) ? prev : [...prev, saved]));
      // Cố gắng kết nối lại nền để các tin sau nhận realtime bình thường
      connect(guestName, guestPhone).catch(() => {});
      return true;
    } catch (err) {
      console.error("Send message error:", err);
      return false;
    } finally {
      setIsSending(false);
    }
  }, [connect, ensureSession]);

  // Disconnect khi unmount
  useEffect(() => {
    return () => {
      if (adminTypingTimeoutRef.current) clearTimeout(adminTypingTimeoutRef.current);
      connectionRef.current?.stop().catch(() => {});
    };
  }, []);

  return {
    messages,
    isConnected,
    isLoading,
    isSending,
    isAdminTyping,
    connect,
    notifyTyping,
    markMessagesRead,
    sendMessage,
  };
}
