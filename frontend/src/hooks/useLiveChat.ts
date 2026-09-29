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

  // Kết nối SignalR
  const connect = useCallback(async (guestName?: string, guestPhone?: string) => {
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) return;

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
      .build();

    // Nhận tin nhắn từ Admin
    connection.on("ReceiveMessage", (message: ChatMessageResponse) => {
      setMessages((prev) => [...prev, message]);
    });

    connection.onclose(() => setIsConnected(false));
    connection.onreconnected(() => setIsConnected(true));

    try {
      await connection.start();
      // Tham gia vào group của session này
      await connection.invoke("JoinSession", sessionId.current, guestName || null, guestPhone || null);
      setIsConnected(true);
      connectionRef.current = connection;
    } catch (err) {
      console.error("SignalR connection error:", err);
    }
  }, []);

  // Gửi tin nhắn
  const sendMessage = useCallback(async (content: string, guestName?: string, guestPhone?: string) => {
    if (!content.trim()) return;
    if (!connectionRef.current || connectionRef.current.state !== signalR.HubConnectionState.Connected) {
      await connect(guestName, guestPhone);
    }

    setIsSending(true);
    try {
      await connectionRef.current?.invoke("SendGuestMessage", {
        sessionId: sessionId.current,
        content: content.trim(),
        guestName,
        guestPhone,
      });
    } catch (err) {
      console.error("Send message error:", err);
    } finally {
      setIsSending(false);
    }
  }, [connect]);

  // Disconnect khi unmount
  useEffect(() => {
    return () => {
      connectionRef.current?.stop();
    };
  }, []);

  return {
    messages,
    isConnected,
    isLoading,
    isSending,
    sessionId: sessionId.current,
    connect,
    sendMessage,
  };
}
