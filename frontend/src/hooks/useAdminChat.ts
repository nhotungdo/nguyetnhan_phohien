"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import { chatApi } from "@/services/api.service";
import type { ChatSessionResponse, ChatMessageResponse } from "@/types/api.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

export function useAdminChat() {
  const [sessions, setSessions] = useState<ChatSessionResponse[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  // 1. Load danh sách session ban đầu
  const fetchSessions = useCallback(async () => {
    try {
      const data = await chatApi.getAllSessions();
      setSessions(data.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()));
    } catch (err) {
      console.error("Failed to load chat sessions:", err);
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  // 2. Lấy tin nhắn của một session
  const selectSession = useCallback(async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    try {
      // Đánh dấu đã đọc
      await chatApi.markRead(sessionId);
      
      // Update local state
      setSessions((prev) => 
        prev.map(s => s.id === sessionId ? { ...s, hasUnreadMessages: false } : s)
      );

      const msgs = await chatApi.getSessionMessages(sessionId);
      setMessages(msgs);
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  }, []);

  // 3. Khởi tạo SignalR kết nối
  useEffect(() => {
    // eslint-disable-next-line
    fetchSessions();

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_URL}/hubs/chat`, {
        withCredentials: true,
      })
      .withAutomaticReconnect()
      .build();

    // Lắng nghe khách gửi tin nhắn
    connection.on("ReceiveGuestMessage", (data: { sessionId: string; message: ChatMessageResponse }) => {
      // Nếu đang mở session này -> Thêm vào list tin nhắn
      if (selectedSessionId === data.sessionId) {
        setMessages((prev) => [...prev, data.message]);
        // Cần gọi API markRead luôn vì admin đang xem
        chatApi.markRead(data.sessionId).catch(console.error);
      } else {
        // Nếu không mở -> Đánh dấu session có tin nhắn chưa đọc
        setSessions((prev) => {
          const updated = prev.map(s => s.id === data.sessionId ? { ...s, hasUnreadMessages: true, lastMessageAt: new Date().toISOString() } : s);
          return updated.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
        });
      }
    });

    // Lắng nghe khi admin gửi tin nhắn thành công (phản hồi từ hub)
    connection.on("AdminReplied", (data: { sessionId: string; message: ChatMessageResponse }) => {
       if (selectedSessionId === data.sessionId) {
         setMessages((prev) => [...prev, data.message]);
       }
    });

    connection.onclose(() => setIsConnected(false));
    connection.onreconnected(() => setIsConnected(true));

    connection.start()
      .then(async () => {
        setIsConnected(true);
        await connection.invoke("JoinAsAdmin");
        connectionRef.current = connection;
      })
      .catch(err => console.error("SignalR Admin connection error:", err));

    return () => {
      connection.stop();
    };
  }, [fetchSessions, selectedSessionId]);

  // 4. Hàm Admin reply
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !selectedSessionId) return;
    
    // Gửi qua SignalR (không cần gọi API POST vì Hub tự gọi Service lưu db)
    try {
      await connectionRef.current?.invoke("AdminReply", {
        ChatSessionId: selectedSessionId, // Guid từ backend trả ra (session.id)
        Content: content.trim()
      });
    } catch (err) {
      console.error("Failed to send reply:", err);
    }
  }, [selectedSessionId]);

  return {
    sessions,
    selectedSessionId,
    messages,
    isConnected,
    isLoadingSessions,
    selectSession,
    sendMessage
  };
}
