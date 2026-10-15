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
/** Thử khởi động lại SignalR sau khi auto-reconnect từ bỏ hẳn (backend restart/mất mạng lâu). */
const RESTART_DELAY_MS = 10_000;

/** Khoá lưu phiên chat (id + token do server cấp). */
const SESSION_ID_KEY = "chatSessionId";
const SESSION_TOKEN_KEY = "chatSessionToken";

interface ChatSessionCreds {
  id: string;
  token: string;
}

/** Phát âm thanh chuông nhẹ nhàng khi có phản hồi từ Admin */
function playCustomerNotificationChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    // Âm thanh 2 tông êm dịu: 523.25Hz (C5) -> 659.25Hz (E5)
    osc.frequency.setValueAtTime(523.25, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Bỏ qua nếu trình duyệt chặn autoplay
  }
}

// Đọc phiên đã lưu. Ưu tiên localStorage để duy trì qua nhiều tab/khi mở lại,
// fallback sessionStorage nếu localStorage bị chặn.
function readStoredSession(): ChatSessionCreds | null {
  if (typeof window === "undefined") return null;
  try {
    const id = localStorage.getItem(SESSION_ID_KEY) || sessionStorage.getItem(SESSION_ID_KEY);
    const token = localStorage.getItem(SESSION_TOKEN_KEY) || sessionStorage.getItem(SESSION_TOKEN_KEY);
    return id && token ? { id, token } : null;
  } catch {
    return null;
  }
}

function storeSession(creds: ChatSessionCreds) {
  try {
    localStorage.setItem(SESSION_ID_KEY, creds.id);
    localStorage.setItem(SESSION_TOKEN_KEY, creds.token);
  } catch {}
  try {
    sessionStorage.setItem(SESSION_ID_KEY, creds.id);
    sessionStorage.setItem(SESSION_TOKEN_KEY, creds.token);
  } catch {}
}

function clearStoredSession() {
  try {
    localStorage.removeItem(SESSION_ID_KEY);
    localStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {}
  try {
    sessionStorage.removeItem(SESSION_ID_KEY);
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {}
}

export function useLiveChat() {
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  /** Admin đang gõ — tự ẩn sau TYPING_HIDE_MS nếu không có tín hiệu mới. */
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  /** Cờ đánh dấu phiên đã bị Admin xoá/kết thúc */
  const [isSessionTerminated, setIsSessionTerminated] = useState(false);

  const connectionRef = useRef<signalR.HubConnection | null>(null);
  /** Phiên chat hiện tại (id + token do server cấp) — null khi chưa xin phiên. */
  const sessionRef = useRef<ChatSessionCreds | null>(null);
  const messagesRef = useRef<ChatMessageResponse[]>([]);
  const adminTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(0);
  /** Timer tự kết nối lại khi SignalR đóng hẳn (không còn auto-reconnect). */
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dùng ref cho tên/SĐT khách để re-join đúng thông tin sau reconnect
  const guestInfoRef = useRef<{ name?: string; phone?: string }>({});

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  /** Số lượng tin nhắn Admin chưa đọc */
  const unreadCount = messages.filter((m) => m.senderType === "Admin" && !m.isRead).length;

  /**
   * Lấy phiên chat đang lưu; nếu chưa có thì xin SERVER cấp phiên mới
   * (SessionId ngẫu nhiên + token). forceNew = true khi token cũ bị server từ chối.
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
      setIsSessionTerminated(false);
      return creds;
    },
    []
  );

  // Bắt đầu phiên chat mới sạch sẽ
  const startNewChat = useCallback(() => {
    clearStoredSession();
    sessionRef.current = null;
    setMessages([]);
    setIsSessionTerminated(false);
  }, []);

  // Kết nối SignalR
  const connect = useCallback(async (guestName?: string, guestPhone?: string) => {
    guestInfoRef.current = { name: guestName, phone: guestPhone };

    const creds = await ensureSession(false, guestName, guestPhone);

    // Đã kết nối rồi: chỉ cập nhật thông tin khách bằng cách join lại
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
      setIsSessionTerminated(false);
    } catch {
      // Phiên cũ không còn hoặc token không dùng được -> dọn phiên lỗi
      clearStoredSession();
      sessionRef.current = null;
      setMessages([]);
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

    const scheduleRestart = () => {
      if (restartTimerRef.current) return;
      restartTimerRef.current = setTimeout(async () => {
        restartTimerRef.current = null;
        if (connectionRef.current) return;
        const current = sessionRef.current;
        try {
          await connection.start();
          if (current) {
            await connection.invoke(
              "JoinAsGuest", current.id, current.token,
              guestInfoRef.current.name ?? null, guestInfoRef.current.phone ?? null
            );
            try {
              const history = await chatApi.getGuestMessages(current.id, current.token);
              setMessages(history);
            } catch { /* tải bù thất bại — lần sau thử lại */ }
          }
          setIsConnected(true);
          connectionRef.current = connection;
        } catch {
          scheduleRestart();
        }
      }, RESTART_DELAY_MS);
    };

    // Nhận tin nhắn từ Admin
    connection.on("ReceiveAdminMessage", (message: ChatMessageResponse) => {
      playCustomerNotificationChime();
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    });

    // Echo xác nhận tin nhắn của chính khách đã được lưu
    connection.on("MessageSent", (message: ChatMessageResponse) => {
      setMessages((prev) => {
        const tempIdx = prev.findIndex((m) => m.id.startsWith("temp-") && m.content === message.content);
        if (tempIdx !== -1) {
          const updated = [...prev];
          updated[tempIdx] = message;
          return updated;
        }
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

    // Admin xoá phiên này: dọn sạch session và cập nhật UI, KHÔNG tự động tạo phiên mới
    connection.on("SessionDeleted", (data: { sessionId: string; sessionKey: string }) => {
      const current = sessionRef.current;
      if (!current || current.id !== data.sessionKey) return;

      clearStoredSession();
      sessionRef.current = null;
      setMessages([]);
      setIsSessionTerminated(true);
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

    connection.onclose(() => {
      setIsConnected(false);
      if (connectionRef.current === connection) connectionRef.current = null;
      scheduleRestart();
    });

    connection.onreconnected(async () => {
      setIsConnected(true);
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

      try {
        const history = await chatApi.getGuestMessages(current.id, current.token);
        setMessages(history);
      } catch (err) {
        console.error("Failed to reload chat history after reconnect:", err);
      }
    });

    try {
      await connection.start();
      if (restartTimerRef.current) { clearTimeout(restartTimerRef.current); restartTimerRef.current = null; }
      
      try {
        await connection.invoke("JoinAsGuest", creds.id, creds.token, guestName || null, guestPhone || null);
      } catch (joinErr) {
        // Token cũ bị server từ chối: dọn sạch và xin phiên mới trên kết nối hiện tại
        console.warn("Token phiên chat không hợp lệ, đang làm mới...", joinErr);
        clearStoredSession();
        const fresh = await ensureSession(true, guestName, guestPhone);
        await connection.invoke("JoinAsGuest", fresh.id, fresh.token, guestName || null, guestPhone || null);
      }

      setIsConnected(true);
      connectionRef.current = connection;
    } catch (err) {
      if (
        err instanceof Error &&
        err.message !== "The connection was stopped during negotiation." &&
        err.message !== "Failed to start the HttpConnection before stop() was called."
      ) {
        console.error("SignalR connection error:", err);
      }
      scheduleRestart();
    }
  }, [ensureSession]);

  // Báo cho admin biết khách đang gõ
  const notifyTyping = useCallback(() => {
    const conn = connectionRef.current;
    const current = sessionRef.current;
    if (conn?.state !== signalR.HubConnectionState.Connected || !current) return;

    const now = Date.now();
    if (now - lastTypingSentRef.current < TYPING_THROTTLE_MS) return;
    lastTypingSentRef.current = now;

    conn.invoke("GuestTyping", current.id, current.token, true).catch(() => {});
  }, []);

  // Xác nhận khách đã xem tin của Admin (cập nhật DB & state local để tránh lặp request)
  const markMessagesRead = useCallback(async () => {
    const current = sessionRef.current;
    if (!current) return;

    const hasUnreadAdminMessage = messagesRef.current.some(
      (m) => m.senderType === "Admin" && !m.isRead
    );
    if (!hasUnreadAdminMessage) return;

    try {
      await chatApi.markGuestMessagesRead(current.id, current.token);
      // Cập nhật ngay local state để đồng bộ unreadCount = 0 và dừng lặp effect
      setMessages((prev) =>
        prev.map((m) => (m.senderType === "Admin" ? { ...m, isRead: true } : m))
      );
    } catch (err) {
      console.warn("Mark messages read failed:", err);
    }
  }, []);

  // Gửi tin nhắn với cơ chế tự phục hồi nếu phiên bị hết hạn / xoá
  const sendMessage = useCallback(async (content: string, guestName?: string, guestPhone?: string): Promise<boolean> => {
    const trimmed = content.trim();
    if (!trimmed) return false;

    // Optimistic Update
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessageResponse = {
      id: tempId,
      content: trimmed,
      senderType: "Guest",
      isRead: false,
      sentAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setIsSessionTerminated(false);

    setIsSending(true);

    const trySend = async (credsToUse: ChatSessionCreds): Promise<boolean> => {
      const conn = connectionRef.current;
      const connected = conn?.state === signalR.HubConnectionState.Connected;

      if (connected) {
        await conn.invoke("SendGuestMessage", credsToUse.id, credsToUse.token, trimmed);
        conn.invoke("GuestTyping", credsToUse.id, credsToUse.token, false).catch(() => {});
        return true;
      }

      // Fallback REST
      const saved = await chatApi.sendMessage({
        sessionId: credsToUse.id,
        sessionToken: credsToUse.token,
        content: trimmed,
        guestName: guestName || guestInfoRef.current.name,
        guestPhone: guestPhone || guestInfoRef.current.phone,
      });

      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === tempId);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = saved;
          return updated;
        }
        return prev.some((m) => m.id === saved.id) ? prev : [...prev, saved];
      });

      connect(guestName, guestPhone).catch(() => {});
      return true;
    };

    try {
      let creds = await ensureSession(false, guestName, guestPhone);
      try {
        return await trySend(creds);
      } catch (firstErr) {
        // Nếu lỗi do phiên cũ không tồn tại hoặc token hết hạn -> tự tạo phiên mới và gửi lại
        console.warn("Lần gửi đầu thất bại, thử phục hồi phiên chat mới...", firstErr);
        clearStoredSession();
        creds = await ensureSession(true, guestName, guestPhone);
        return await trySend(creds);
      }
    } catch (err) {
      console.error("Send message error:", err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      return false;
    } finally {
      setIsSending(false);
    }
  }, [connect, ensureSession]);

  // Disconnect khi unmount
  useEffect(() => {
    return () => {
      if (adminTypingTimeoutRef.current) clearTimeout(adminTypingTimeoutRef.current);
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      connectionRef.current?.stop().catch(() => {});
    };
  }, []);

  return {
    messages,
    isConnected,
    isLoading,
    isSending,
    isAdminTyping,
    unreadCount,
    isSessionTerminated,
    connect,
    notifyTyping,
    markMessagesRead,
    sendMessage,
    startNewChat,
  };
}
