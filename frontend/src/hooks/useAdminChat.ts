"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as signalR from "@microsoft/signalr";
import { chatApi, adminAuth } from "@/services/api.service";
import type { ChatSessionResponse, ChatMessageResponse } from "@/types/api.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

/** Chỉ gửi tín hiệu "đang gõ" tối đa mỗi TYPING_THROTTLE_MS để không spam hub. */
const TYPING_THROTTLE_MS = 1500;
/** Tự ẩn chỉ báo "đang gõ" nếu không nhận được tín hiệu mới. */
const TYPING_HIDE_MS = 4000;
/** Thử khởi động lại SignalR sau khi auto-reconnect từ bỏ hẳn (backend restart/mất mạng lâu). */
const RESTART_DELAY_MS = 10_000;

/** Bộ lọc trạng thái phiên chat ở danh sách admin. */
export type ChatStatusFilter = "all" | "open" | "resolved";

const sortSessions = (list: ChatSessionResponse[]) =>
  [...list].sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );

/** Phát âm thanh thông báo dễ chịu khi có tin nhắn mới từ khách hàng */
function playNotificationChime() {
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
    // Âm thanh 2 tông hiện đại: 587.33Hz (D5) -> 880Hz (A5)
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Không làm gián đoạn UI nếu trình duyệt chặn autoplay
  }
}

/** So sánh an toàn không phân biệt hoa thường giữa 2 chuỗi GUID */
export const areIdsEqual = (a?: string | null, b?: string | null) =>
  Boolean(a && b && a.toLowerCase() === b.toLowerCase());

export function useAdminChat() {
  const [sessions, setSessions] = useState<ChatSessionResponse[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  /** Id phiên mà khách đang gõ — Messenger chỉ hiện khi trùng phiên đang chọn. */
  const [typingSessionId, setTypingSessionId] = useState<string | null>(null);
  /** Bộ lọc trạng thái phiên chat: tất cả / chờ phản hồi / đã phân giải. */
  const [statusFilter, setStatusFilter] = useState<ChatStatusFilter>("all");

  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(0);

  // 1. Load danh sách session ban đầu
  const fetchSessions = useCallback(async () => {
    try {
      const data = await chatApi.getAllSessions();
      setSessions(sortSessions(data));
    } catch (err) {
      console.warn("Failed to load chat sessions:", err);
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  // 2. Lấy tin nhắn của một session
  const selectSession = useCallback(async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setTypingSessionId(null);

    // markRead lỗi (mạng/401) KHÔNG được chặn việc tải tin nhắn
    try {
      // Đánh dấu đã đọc (backend broadcast "MessagesRead" để khách thấy "Đã xem")
      await chatApi.markRead(sessionId);
      setSessions((prev) =>
        prev.map((s) => (areIdsEqual(s.id, sessionId) ? { ...s, hasUnreadMessages: false } : s))
      );
    } catch (err) {
      console.warn("Mark session read failed:", err);
    }

    try {
      const msgs = await chatApi.getSessionMessages(sessionId);
      setMessages(msgs);
    } catch (err) {
      console.warn("Failed to load messages:", err);
    }
  }, []);

  // Dùng ref để tránh stale closure trong SignalR listeners mà không cần re-connect
  const selectedSessionIdRef = useRef(selectedSessionId);
  useEffect(() => {
    selectedSessionIdRef.current = selectedSessionId;
  }, [selectedSessionId]);

  const sessionsRef = useRef(sessions);
  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  // Cập nhật preview + thời gian ở danh sách hội thoại sau khi có tin mới
  const applySessionUpdate = useCallback(
    (
      sessionId: string,
      message: ChatMessageResponse,
      hasUnread: boolean,
      patch?: Partial<ChatSessionResponse>
    ) => {
      setSessions((prev) => {
        if (!prev.some((s) => areIdsEqual(s.id, sessionId))) return prev;
        return sortSessions(
          prev.map((s) =>
            areIdsEqual(s.id, sessionId)
              ? {
                  ...s,
                  ...patch,
                  hasUnreadMessages: hasUnread,
                  lastMessageAt: message.sentAt,
                  lastMessagePreview: message.content,
                }
              : s
          )
        );
      });
    },
    []
  );

  // Danh sách hiển thị theo bộ lọc trạng thái (Messenger lọc thêm theo ô tìm kiếm)
  const visibleSessions = useMemo(
    () =>
      sessions.filter((s) =>
        statusFilter === "all"
          ? true
          : statusFilter === "resolved"
            ? s.isResolved
            : !s.isResolved
      ),
    [sessions, statusFilter]
  );

  // 2b. Mở/đóng phiên chat (đánh dấu đã phân giải) — optimistic + đồng bộ server
  const setSessionResolved = useCallback(
    async (sessionId: string, isResolved: boolean): Promise<boolean> => {
      setSessions((prev) =>
        prev.map((s) =>
          areIdsEqual(s.id, sessionId)
            ? { ...s, isResolved, ...(isResolved ? { hasUnreadMessages: false } : {}) }
            : s
        )
      );

      try {
        const updated = await chatApi.setResolved(sessionId, isResolved);
        setSessions((prev) => prev.map((s) => (areIdsEqual(s.id, sessionId) ? { ...s, ...updated } : s)));
        return true;
      } catch (err) {
        console.error("Failed to update session resolved state:", err);
        // Hoàn nguyên: lấy lại danh sách đúng từ server
        fetchSessions();
        return false;
      }
    },
    [fetchSessions]
  );

  /** Bỏ một phiên khỏi danh sách; nếu đang mở đúng phiên đó thì xoá cả khung chat. */
  const dropSession = useCallback((sessionId: string) => {
    setSessions((prev) => prev.filter((s) => !areIdsEqual(s.id, sessionId)));
    if (areIdsEqual(selectedSessionIdRef.current, sessionId)) {
      setSelectedSessionId(null);
      setMessages([]);
    }
    setTypingSessionId((prev) => (areIdsEqual(prev, sessionId) ? null : prev));
  }, []);

  // 2c. Xoá hẳn phiên chat (kèm tin nhắn) — thao tác không thể hoàn tác nên UI phải
  // xác nhận trước; hook chỉ chạy khi đã xác nhận.
  const deleteSession = useCallback(
    async (sessionId: string): Promise<boolean> => {
      try {
        await chatApi.deleteSession(sessionId);
        dropSession(sessionId);
        return true;
      } catch (err) {
        console.error("Failed to delete session:", err);
        fetchSessions();
        return false;
      }
    },
    [dropSession, fetchSessions]
  );

  // 3. Khởi tạo SignalR kết nối
  useEffect(() => {
    // eslint-disable-next-line
    fetchSessions();

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_URL}/hubs/chat`, {
        withCredentials: true,
        accessTokenFactory: () => adminAuth.getToken() || "",
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.None)
      .build();

    let disposed = false;
    let restartTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRestart = () => {
      if (disposed || restartTimer) return;
      restartTimer = setTimeout(() => {
        restartTimer = null;
        connection
          .start()
          .then(async () => {
            setIsConnected(true);
            connectionRef.current = connection;
            await connection.invoke("JoinAsAdmin");
            await fetchSessions();
          })
          .catch(() => scheduleRestart());
      }, RESTART_DELAY_MS);
    };

    // Khách gửi tin nhắn (qua SignalR hoặc qua REST fallback — controller cũng broadcast)
    connection.on(
      "ReceiveGuestMessage",
      (data: {
        sessionId: string;
        session?: ChatSessionResponse;
        message: ChatMessageResponse;
      }) => {
        const isSelected = areIdsEqual(selectedSessionIdRef.current, data.sessionId);

        // Chuông báo tin nhắn mới
        playNotificationChime();

        if (isSelected) {
          setMessages((prev) =>
            prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]
          );
          // Đang mở phiên này => coi như admin đã đọc (direct DB update)
          chatApi.markRead(data.sessionId).catch(console.error);
        }

        // Cập nhật danh sách sessions ngay lập tức trong local state (0ms - không cần fetch HTTP)
        setSessions((prev) => {
          const index = prev.findIndex((s) => areIdsEqual(s.id, data.sessionId));
          if (index !== -1) {
            const existing = prev[index];
            const updated: ChatSessionResponse = {
              ...existing,
              isResolved: false,
              hasUnreadMessages: !isSelected,
              lastMessageAt: data.message.sentAt,
              lastMessagePreview: data.message.content,
            };
            const next = [...prev];
            next.splice(index, 1);
            return [updated, ...next];
          }

          // Phiên mới chưa có trong list: dùng data.session do backend gửi kèm, hoặc tạo fallback
          const newSession: ChatSessionResponse = data.session || {
            id: data.sessionId,
            sessionId: data.sessionId,
            guestName: "Khách hàng",
            guestPhone: "",
            hasUnreadMessages: !isSelected,
            isResolved: false,
            lastMessageAt: data.message.sentAt,
            lastMessagePreview: data.message.content,
          };

          const sessionToAdd: ChatSessionResponse = {
            ...newSession,
            hasUnreadMessages: !isSelected,
            isResolved: false,
            lastMessageAt: data.message.sentAt,
            lastMessagePreview: data.message.content,
          };

          return [sessionToAdd, ...prev];
        });
      }
    );

    // Phiên chat mới tạo từ khách (realtime)
    connection.on("SessionCreated", (session: ChatSessionResponse) => {
      setSessions((prev) => {
        if (prev.some((s) => areIdsEqual(s.id, session.id))) return prev;
        return [session, ...prev];
      });
    });

    // Admin khác trong cùng phiên trả lời (kể cả echo tab của chính mình)
    connection.on(
      "AdminReplied",
      (data: { sessionId: string; message: ChatMessageResponse }) => {
        if (areIdsEqual(selectedSessionIdRef.current, data.sessionId)) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === data.message.id)) return prev;
            // Thay thế tin nhắn optimistic nếu có
            const tempIdx = prev.findIndex(
              (m) =>
                m.id.startsWith("temp-") &&
                m.senderType === "Admin" &&
                m.content === data.message.content
            );
            if (tempIdx !== -1) {
              const next = [...prev];
              next[tempIdx] = data.message;
              return next;
            }
            return [...prev, data.message];
          });
        }
        applySessionUpdate(data.sessionId, data.message, false, { isResolved: false });
      }
    );

    // Khách xác nhận đã xem tin của Admin -> hiện "Đã xem" realtime
    connection.on("GuestReadMessages", (data: { sessionId: string }) => {
      if (!areIdsEqual(selectedSessionIdRef.current, data.sessionId)) return;
      setMessages((prev) =>
        prev.map((m) => (m.senderType === "Admin" ? { ...m, isRead: true } : m))
      );
    });

    // Tab admin khác mở/đóng phiên -> đồng bộ bộ lọc & trạng thái realtime
    connection.on(
      "SessionResolved",
      (data: { sessionId: string; isResolved: boolean; hasUnreadMessages: boolean }) => {
        setSessions((prev) =>
          prev.map((s) =>
            areIdsEqual(s.id, data.sessionId)
              ? { ...s, isResolved: data.isResolved, hasUnreadMessages: data.hasUnreadMessages }
              : s
          )
        );
      }
    );

    // Tab admin khác xoá phiên -> bỏ khỏi danh sách ngay, không cần tải lại
    connection.on("SessionDeleted", (data: { sessionId: string; sessionKey: string }) => {
      dropSession(data.sessionId);
    });

    // Khách đang gõ
    connection.on(
      "GuestTyping",
      (data: { sessionId: string; isTyping: boolean }) => {
        setTypingSessionId(data.isTyping ? data.sessionId : null);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (data.isTyping) {
          typingTimeoutRef.current = setTimeout(
            () => setTypingSessionId(null),
            TYPING_HIDE_MS
          );
        }
      }
    );

    connection.onclose(() => {
      setIsConnected(false);
      scheduleRestart();
    });
    connection.onreconnected(async () => {
      setIsConnected(true);
      try {
        await connection.invoke("JoinAsAdmin");
        // Tin nhắn bị mất trong lúc mất kết nối: reload sessions để lấy trạng thái mới nhất
        await fetchSessions();
      } catch (err) {
        console.error("Re-join admin group error:", err);
      }
    });

    connection.start()
      .then(async () => {
        setIsConnected(true);
        await connection.invoke("JoinAsAdmin");
        connectionRef.current = connection;
      })
      .catch(err => {
        // Chỉ log nếu không phải là lỗi hủy do component unmount
        if (
            err.message !== "The connection was stopped during negotiation." &&
            err.message !== "Failed to start the HttpConnection before stop() was called."
        ) {
            console.error("SignalR Admin connection error:", err);
        }
        // Backend chưa chạy / mạng chặn WS → vẫn thử lại định kỳ thay vì bỏ cuộc
        scheduleRestart();
      });

    return () => {
      disposed = true;
      if (restartTimer) clearTimeout(restartTimer);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      connection.stop().catch(() => {});
    };
  }, [fetchSessions, applySessionUpdate, dropSession]);

  // 4. Báo "đang gõ" cho khách (throttle, chỉ gửi khi hub đang kết nối)
  const notifyTyping = useCallback(() => {
    const conn = connectionRef.current;
    const targetSession = selectedSessionIdRef.current;
    if (conn?.state !== signalR.HubConnectionState.Connected || !targetSession) return;

    const now = Date.now();
    if (now - lastTypingSentRef.current < TYPING_THROTTLE_MS) return;
    lastTypingSentRef.current = now;

    conn.invoke("AdminTyping", targetSession, true).catch(() => {});
  }, []);

  // 5. Hàm Admin reply — trả về true nếu tin đã được gửi thành công
  const sendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      const trimmed = content.trim();
      if (!trimmed || !selectedSessionId) return false;

      const conn = connectionRef.current;
      const connected = conn?.state === signalR.HubConnectionState.Connected;

      // Optimistic update: hiển thị ngay trên UI admin với độ trễ 0ms
      const tempId = `temp-${Date.now()}`;
      const optimisticMsg: ChatMessageResponse = {
        id: tempId,
        content: trimmed,
        senderType: "Admin",
        isRead: false,
        sentAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimisticMsg]);
      applySessionUpdate(selectedSessionId, optimisticMsg, false, { isResolved: false });

      try {
        if (connected) {
          // Gửi qua SignalR (Hub tự gọi Service lưu db)
          await conn.invoke("AdminReply", {
            ChatSessionId: selectedSessionId, // Guid từ backend trả ra (session.id)
            Content: trimmed,
          });
          conn.invoke("AdminTyping", selectedSessionId, false).catch(() => {});
          return true;
        }

        // Mất kết nối / WebSocket bị chặn -> gửi qua REST.
        // Backend vẫn broadcast qua hub nên khách nhận được ngay.
        const saved = await chatApi.adminReply({
          chatSessionId: selectedSessionId,
          content: trimmed,
        });
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? saved : m))
        );
        applySessionUpdate(selectedSessionId, saved, false, { isResolved: false });
        return true;
      } catch (err) {
        console.error("Failed to send reply:", err);
        // Hoàn nguyên tin nhắn lạc quan nếu gửi thất bại
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        return false;
      }
    },
    [selectedSessionId, applySessionUpdate]
  );

  return {
    sessions,
    visibleSessions,
    statusFilter,
    setStatusFilter,
    selectedSessionId,
    messages,
    isConnected,
    isLoadingSessions,
    typingSessionId,
    selectSession,
    setSessionResolved,
    deleteSession,
    notifyTyping,
    sendMessage,
  };
}
