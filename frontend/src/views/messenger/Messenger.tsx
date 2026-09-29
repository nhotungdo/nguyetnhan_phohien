"use client"
import { Search, Info, Phone, MapPin } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
type ChatType = {
  id: string | number;
  name: string;
  time: string;
  message: string;
  unread: boolean;
};

export default function Messenger() {
  const [conversations, setConversations] = useState<ChatType[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Attempt to fetch from Supabase
        const { data: customersData, error: customersError } = await supabase.from('Customers').select('*');
        if (customersError) {
            console.error(customersError);
            setLoading(false);
            return;
        }
        
        // Mock data structure mapped from real customers if available
        if (customersData && customersData.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mapped: ChatType[] = customersData.map((c: any, index: number) => ({
                id: (c.Id || c.id || index) as string | number,
                name: (c.Name || c.name || "Khách hàng ẩn danh") as string,
                time: "Gần đây",
                message: "...", 
                unread: index === 0
            }));
            setConversations(mapped);
            if (mapped.length > 0) setSelectedChat(mapped[0]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  if (loading) {
      return <div className="p-8 text-center text-muted-foreground">Đang tải dữ liệu từ database...</div>
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-card rounded-xl border shadow overflow-hidden">
      {/* Sidebar Conversations */}
      <div className="w-80 border-r flex flex-col bg-background/50">
        <div className="p-4 border-b bg-card">
          <h2 className="text-xl font-bold text-primary mb-3">Tin Nhắn</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Tìm kiếm khách hàng..." 
              className="w-full bg-background border border-border/50 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg pl-9 pr-4 py-2 outline-none text-sm transition-all"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Chưa có cuộc trò chuyện nào</div>
          ) : conversations.map((chat) => (
            <div 
              key={chat.id} 
              onClick={() => setSelectedChat(chat)}
              className={`p-4 border-b cursor-pointer transition-colors ${selectedChat?.id === chat.id ? 'bg-primary/5' : 'hover:bg-muted/50'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`font-semibold ${selectedChat?.id === chat.id ? 'text-primary' : 'text-foreground'}`}>{chat.name}</span>
                <span className="text-xs text-muted-foreground">{chat.time}</span>
              </div>
              <p className={`text-sm truncate ${chat.unread ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>{chat.message}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-[#FAF7F2] relative">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noiseFilter\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.8\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noiseFilter)\"/%3E%3C/svg%3E')"}}></div>
        
        {selectedChat ? (
          <>
            <div className="p-4 border-b bg-card/80 backdrop-blur-sm z-10 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent text-accent-foreground font-bold flex items-center justify-center">
                  {selectedChat.name.substring(0,2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-primary">{selectedChat.name}</h3>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                    Đang hoạt động
                  </p>
                </div>
              </div>
              <button className="p-2 hover:bg-muted rounded-full text-primary transition-colors">
                <Info className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4 relative z-10">
              <div className="flex justify-center">
                <span className="text-xs text-muted-foreground bg-background/50 px-2 py-1 rounded-full">Dữ liệu thực từ Database</span>
              </div>
              <div className="flex justify-start">
                <div className="bg-white border rounded-2xl rounded-tl-sm py-2 px-4 max-w-[70%] shadow-sm">
                  <p className="text-sm text-foreground">Tin nhắn của khách hàng sẽ hiển thị ở đây.</p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-card z-10">
              <div className="relative flex items-center">
                <input 
                  type="text" 
                  placeholder="Nhập tin nhắn tư vấn..." 
                  className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-full pl-4 pr-12 py-3 outline-none transition-all shadow-sm"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-accent hover:bg-accent/90 text-accent-foreground p-1.5 rounded-full transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                </button>
              </div>
              <div className="flex gap-2 mt-2 px-2 overflow-x-auto pb-1">
                <button className="text-xs bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-1 rounded-full transition-colors border whitespace-nowrap">Báo giá 500g</button>
                <button className="text-xs bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-1 rounded-full transition-colors border whitespace-nowrap">Báo giá 1kg</button>
                <button className="text-xs bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-1 rounded-full transition-colors border whitespace-nowrap">Xin SĐT nhận hàng</button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center relative z-10">
            <p className="text-muted-foreground">Chọn một cuộc trò chuyện để bắt đầu</p>
          </div>
        )}
      </div>

      {/* Right Sidebar - Customer Info */}
      <div className="w-72 border-l bg-card p-4 hidden lg:block">
        {selectedChat && (
          <>
            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 rounded-full bg-accent/20 text-accent font-bold text-2xl flex items-center justify-center mb-3">
                {selectedChat.name.substring(0,2).toUpperCase()}
              </div>
              <h3 className="font-bold text-lg text-primary">{selectedChat.name}</h3>
              <p className="text-sm text-muted-foreground">Khách hàng</p>
            </div>

            <div className="space-y-4">
              <div className="bg-background rounded-lg border p-3 shadow-sm">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Thông tin liên hệ</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <Phone className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-foreground italic text-muted-foreground">Chưa có SĐT</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-foreground italic text-muted-foreground">Chưa có địa chỉ</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-background rounded-lg border p-3 shadow-sm">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Lịch sử đơn hàng</h4>
                <p className="text-sm text-center text-muted-foreground py-2 italic">Chưa có đơn hàng nào</p>
                <button className="w-full mt-2 bg-primary/10 hover:bg-primary/20 text-primary font-medium py-1.5 rounded-md text-sm transition-colors">
                  + Tạo đơn hàng
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
