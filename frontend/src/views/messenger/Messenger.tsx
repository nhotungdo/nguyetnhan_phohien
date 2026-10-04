"use client"

if (typeof window !== "undefined") {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (
      args.length > 0 && 
      typeof args[0] === "string" && 
      args[0].includes("Failed to start the HttpConnection before stop() was called")
    ) {
      return; // Ignore this specific harmless SignalR unmount error
    }
    originalConsoleError.apply(console, args);
  };
}
import { Search, Info, Phone, Send, Loader2, Check, RotateCcw } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useAdminChat } from "@/hooks/useAdminChat"
import type { ChatStatusFilter } from "@/hooks/useAdminChat"

export default function Messenger() {
  const {
    sessions,
    visibleSessions,
    statusFilter,
    setStatusFilter,
    selectedSessionId,
    messages,
    isLoadingSessions,
    isConnected,
    typingSessionId,
    selectSession,
    setSessionResolved,
    notifyTyping,
    sendMessage
  } = useAdminChat();

  const [inputMessage, setInputMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sendError, setSendError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!inputMessage.trim() || !selectedSessionId) return;
    const ok = await sendMessage(inputMessage);
    // Giữ nguyên nội dung nếu gửi thất bại để người dùng gửi lại
    if (ok) {
      setInputMessage("");
      setSendError(false);
    } else {
      setSendError(true);
    }
  };

  const isGuestTyping = typingSessionId !== null && typingSessionId === selectedSessionId;

  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  // Lọc theo trạng thái (do hook cung cấp) rồi lọc tiếp theo ô tìm kiếm
  const filteredSessions = visibleSessions.filter(s => 
    (s.guestName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (s.guestPhone || "").includes(searchTerm) ||
    s.sessionId.includes(searchTerm)
  );

  const statusOptions: { key: ChatStatusFilter; label: string; count: number }[] = [
    { key: "all", label: "Tất cả", count: sessions.length },
    { key: "open", label: "Chờ phản hồi", count: sessions.filter(s => !s.isResolved).length },
    { key: "resolved", label: "Đã phân giải", count: sessions.filter(s => s.isResolved).length },
  ];

  const handleToggleResolved = async () => {
    if (!selectedSession) return;
    await setSessionResolved(selectedSession.id, !selectedSession.isResolved);
  };

  if (isLoadingSessions) {
    return <div className="p-8 flex items-center justify-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải dữ liệu chat...</div>
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-card rounded-xl border shadow overflow-hidden">
      {/* Sidebar Conversations */}
      <div className="w-80 border-r flex flex-col bg-background/50">
        <div className="p-4 border-b bg-card">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold text-primary">Tin Nhắn</h2>
            <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} shadow-sm`} title={isConnected ? "Đã kết nối" : "Mất kết nối"} />
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Tìm khách hàng..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-lg pl-9 pr-4 py-2 outline-none text-sm transition-all"
            />
          </div>
          {/* Bộ lọc trạng thái phiên chat */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {statusOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setStatusFilter(opt.key)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  statusFilter === opt.key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                {opt.label} <span className="font-bold">{opt.count}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredSessions.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {statusFilter === "all" ? "Chưa có cuộc trò chuyện nào" : "Không có cuộc trò chuyện nào khớp bộ lọc"}
            </div>
          ) : filteredSessions.map((chat) => (
            <div 
              key={chat.id} 
              onClick={() => selectSession(chat.id)}
              className={`p-4 border-b cursor-pointer transition-colors ${selectedSessionId === chat.id ? 'bg-primary/5' : 'hover:bg-muted/50'} ${chat.isResolved ? 'opacity-70' : ''}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`font-semibold ${selectedSessionId === chat.id ? 'text-primary' : 'text-foreground'}`}>
                  {chat.guestName || "Khách hàng ẩn danh"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(chat.lastMessageAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className={`text-sm truncate ${chat.hasUnreadMessages ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                {chat.lastMessagePreview || "Chưa có tin nhắn"}
              </p>
              <div className="flex items-center justify-between gap-2 mt-1">
                <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                  {chat.guestPhone ? `SĐT: ${chat.guestPhone}` : "Khách ẩn danh"}
                </span>
                <span className="flex items-center gap-1 shrink-0">
                  {chat.isResolved && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 border border-emerald-200 bg-emerald-50 rounded-full px-1.5 py-0.5">
                      <Check className="w-2.5 h-2.5" /> Đã phân giải
                    </span>
                  )}
                  {chat.hasUnreadMessages && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500">
                      <span className="w-2 h-2 rounded-full bg-red-500" /> Chưa đọc
                    </span>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-[#FAF7F2] relative">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noiseFilter\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.8\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noiseFilter)\"/%3E%3C/svg%3E')"}}></div>
        
        {selectedSession ? (
          <>
            <div className="p-4 border-b bg-card/80 backdrop-blur-sm z-10 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent text-accent-foreground font-bold flex items-center justify-center">
                  {(selectedSession.guestName || "Khách").substring(0,2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-primary">{selectedSession.guestName || "Khách hàng ẩn danh"}</h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedSession.guestPhone || "Chưa để lại SĐT"}
                    {selectedSession.isResolved && (
                      <span className="ml-2 font-semibold text-emerald-600">· Đã phân giải</span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleResolved}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full border transition-colors ${
                  selectedSession.isResolved
                    ? "border-border text-muted-foreground hover:bg-muted"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
                title={selectedSession.isResolved ? "Mở lại phiên trò chuyện" : "Đánh dấu phiên đã phân giải"}
              >
                {selectedSession.isResolved ? (
                  <><RotateCcw className="w-3.5 h-3.5" /> Mở lại phiên</>
                ) : (
                  <><Check className="w-3.5 h-3.5" /> Đã phân giải</>
                )}
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4 relative z-10">
              {messages.map((msg, idx) => (
                <div key={msg.id || idx} className={`flex ${msg.senderType === "Admin" ? 'justify-end' : 'justify-start'}`}>
                  <div className={`py-2 px-4 max-w-[70%] shadow-sm ${msg.senderType === "Admin" ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm' : 'bg-white border rounded-2xl rounded-tl-sm text-foreground'}`}>
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    <span className={`text-[10px] block mt-1 ${msg.senderType === "Admin" ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground'}`}>
                      {new Date(msg.sentAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      {msg.senderType === "Admin" && msg.isRead && <span className="ml-1">· Đã xem</span>}
                    </span>
                  </div>
                </div>
              ))}
              {isGuestTyping && (
                <div className="flex justify-start">
                  <div className="py-3 px-4 bg-white border rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1" aria-label="Khách đang gõ">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]"></span>
                    <span className="ml-2 text-xs text-muted-foreground">Khách đang gõ...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t bg-card z-10">
              <div className="relative flex items-center gap-2">
                <input 
                  type="text"
                  value={inputMessage}
                  onChange={(e) => {
                    setInputMessage(e.target.value);
                    if (e.target.value.trim()) notifyTyping();
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Nhập tin nhắn phản hồi..." 
                  className="flex-1 bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-full pl-4 pr-4 py-3 outline-none transition-all shadow-sm"
                />
                <button 
                  onClick={handleSend}
                  disabled={!inputMessage.trim()}
                  className="bg-accent hover:bg-accent/90 disabled:opacity-50 text-accent-foreground p-3 rounded-full transition-colors flex-shrink-0 shadow-sm"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              {sendError && (
                <p className="text-xs text-red-500 mt-2 px-2">
                  Không gửi được tin nhắn. Kiểm tra kết nối rồi thử lại — nội dung vẫn được giữ.
                </p>
              )}
              <div className="flex gap-2 mt-3 px-2 overflow-x-auto pb-1">
                <button onClick={() => setInputMessage("Chào bạn, Nguyệt Nhãn có thể giúp gì cho bạn?")} className="text-xs bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-1.5 rounded-full transition-colors border whitespace-nowrap">👋 Chào hỏi</button>
                <button onClick={() => setInputMessage("Bạn muốn lấy loại Đặc biệt (350k/hộp) hay Túi Zip (320k/túi) ạ?")} className="text-xs bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-1.5 rounded-full transition-colors border whitespace-nowrap">💰 Báo giá</button>
                <button onClick={() => setInputMessage("Bạn cho shop xin Tên, SĐT và Địa chỉ để lên đơn nhé!")} className="text-xs bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-1.5 rounded-full transition-colors border whitespace-nowrap">📍 Xin thông tin</button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center relative z-10 space-y-4">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
              <Info className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">Chọn một cuộc trò chuyện để phản hồi</p>
          </div>
        )}
      </div>

      {/* Right Sidebar - Customer Info */}
      <div className="w-72 border-l bg-card p-4 hidden lg:block">
        {selectedSession ? (
          <>
            <div className="flex flex-col items-center mb-6 pt-4">
              <div className="w-24 h-24 rounded-full bg-accent/20 text-accent font-bold text-3xl flex items-center justify-center mb-4">
                {(selectedSession.guestName || "Khách").substring(0,2).toUpperCase()}
              </div>
              <h3 className="font-bold text-lg text-primary">{selectedSession.guestName || "Khách hàng ẩn danh"}</h3>
              <p className="text-sm text-muted-foreground">ID: {selectedSession.sessionId.substring(0,8)}...</p>
            </div>

            <div className="space-y-4">
              <div className="bg-background rounded-xl border p-4 shadow-sm">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Thông tin liên hệ</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm">
                    <Phone className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    {selectedSession.guestPhone ? (
                      <span className="text-foreground font-medium">{selectedSession.guestPhone}</span>
                    ) : (
                      <span className="text-muted-foreground italic">Chưa cung cấp SĐT</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
