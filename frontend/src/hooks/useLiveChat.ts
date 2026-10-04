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

// Tạo hoặc lấy sessionId từ sessionStorage
function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  let sessionId = sessionStorage.getItem("chatSessionId");
  if (!sessionId) {
    sessionId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem("chatSessionId", sessionId);
  }
  return sessionId;
}

export function useLiveChat() {
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  /** Admin đang gõ — tự ẩn sau TYPING_HIDE_MS nếu không có tín hiệu mới. */
  const [isAdminTyping, setIsAdminTyping] = useState(false);

  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const sessionId = useRef<string>("");
  const messagesRef = useRef<ChatMessageResponse[]>([]);
  const adminTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(0);

  // Dùng ref cho tên/SĐT khách để re-join đúng thông tin sau reconnect
  // mà không cần re-register handlers
  const guestInfoRef = useRef<{ name?: string; phone?: string }>({});

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Kết nối SignalR
  const connect = useCallback(async (guestName?: string, guestPhone?: string) => {
    guestInfoRef.current = { name: guestName, phone: guestPhone };

    // Đã kết nối rồi: chỉ cập nhật thông tin khách (tên/SĐT nhập ở lần bắt đầu chat)
    // bằng cách join lại — backend sẽ ghi đè lên phiên trong DB.
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      sessionId.current = getOrCreateSessionId();
      if (guestName || guestPhone) {
        connectionRef.current
          .invoke("JoinAsGuest", sessionId.current, guestName ?? null, guestPhone ?? null)
          .catch(() => {});
      }
      return;
    }

    sessionId.current = getOrCreateSessionId();

    // Load lịch sử trước khi kết nối
    setIsLoading(true);
    try {
      const history = await chatApi.getGuestMessages(sessionId.current);
      setMessages(history);
    } catch {
      // Session mới, chưa có lịch sử
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
      try {
        await connection.invoke(
          "JoinAsGuest",
          sessionId.current,
          guestInfoRef.current.name ?? null,
          guestInfoRef.current.phone ?? null
        );
      } catch (err) {
        console.error("Failed to re-join session group after reconnect:", err);
      }
      // Tin nhắn trao đổi trong lúc mất kết nối không tự đến — tải lại lịch sử từ server
      try {
        const history = await chatApi.getGuestMessages(sessionId.current);
        setMessages(history);
      } catch (err) {
        console.error("Failed to reload chat history after reconnect:", err);
      }
    });

    try {
      await connection.start();
      // Tham gia vào group của session này
      await connection.invoke("JoinAsGuest", sessionId.current, guestName || null, guestPhone || null);
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
    }
  }, []);

  // Báo cho admin biết khách đang gõ (throttle, chỉ khi hub đang kết nối)
  const notifyTyping = useCallback(() => {
    const conn = connectionRef.current;
    if (conn?.state !== signalR.HubConnectionState.Connected || !sessionId.current) return;

    const now = Date.now();
    if (now - lastTypingSentRef.current < TYPING_THROTTLE_MS) return;
    lastTypingSentRef.current = now;

    conn.invoke("GuestTyping", sessionId.current, true).catch(() => {});
  }, []);

  // Xác nhận khách đã xem tin của Admin (chỉ gọi khi widget đang mở).
  // Backend broadcast "GuestReadMessages" để admin hiện "Đã xem" realtime.
  const markMessagesRead = useCallback(async () => {
    const sid = sessionId.current;
    if (!sid) return;

    const hasUnreadAdminMessage = messagesRef.current.some(
      (m) => m.senderType === "Admin" && !m.isRead
    );
    if (!hasUnreadAdminMessage) return;

    try {
      await chatApi.markGuestMessagesRead(sid);
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

      if (connected) {
        await conn.invoke("SendGuestMessage", sessionId.current, content.trim());
        // Không cần hiển thị "đang gõ" nữa sau khi tin đã gửi
        conn.invoke("GuestTyping", sessionId.current, false).catch(() => {});
        return true;
      }

      // SignalR chưa kết nối (mạng chặn WebSocket, server restart...):
      // gửi qua REST — tin nhắn vẫn được lưu và admin vẫn thấy realtime
      // (backend broadcast qua hub ngay trong controller).
      if (!sessionId.current) sessionId.current = getOrCreateSessionId();
      const saved = await chatApi.sendMessage({
        sessionId: sessionId.current,
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
  }, [connect]);

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
