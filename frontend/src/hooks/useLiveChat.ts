"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import { chatApi } from "@/services/api.service";
import type { ChatMessageResponse } from "@/types/api.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

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
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const sessionId = useRef<string>("");

  // Dùng ref cho tên/SĐT khách để re-join đúng thông tin sau reconnect
  // mà không cần re-register handlers
  const guestInfoRef = useRef<{ name?: string; phone?: string }>({});

  // Kết nối SignalR
  const connect = useCallback(async (guestName?: string, guestPhone?: string) => {
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) return;

    sessionId.current = getOrCreateSessionId();
    guestInfoRef.current = { name: guestName, phone: guestPhone };

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
      setMessages((prev) => [...prev, message]);
    });

    // Echo xác nhận tin nhắn của chính khách đã được lưu
    connection.on("MessageSent", (message: ChatMessageResponse) => {
      setMessages((prev) => {
        // Tránh hiển thị trùng nếu tin nhắn đã được append optimistic
        const exists = prev.some((m) => m.id === message.id);
        return exists ? prev : [...prev, message];
      });
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

  // Gửi tin nhắn: ưu tiên SignalR realtime, fallback REST nếu WebSocket/SignalR bị chặn
  const sendMessage = useCallback(async (content: string, guestName?: string, guestPhone?: string) => {
    if (!content.trim()) return;

    setIsSending(true);
    try {
      const connected = connectionRef.current?.state === signalR.HubConnectionState.Connected;
      if (connected) {
        await connectionRef.current?.invoke("SendGuestMessage", sessionId.current, content.trim());
      } else {
        // SignalR chưa kết nối (mạng chặn WebSocket, server restart...):
        // gửi qua REST — tin nhắn vẫn được lưu và admin vẫn thấy qua danh sách phiên.
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
      }
    } catch (err) {
      console.error("Send message error:", err);
    } finally {
      setIsSending(false);
    }
  }, [connect]);

  // Disconnect khi unmount
  useEffect(() => {
    return () => {
      connectionRef.current?.stop().catch(() => {});
    };
  }, []);

  return {
    messages,
    isConnected,
    isLoading,
    isSending,
    connect,
    sendMessage,
  };
}
