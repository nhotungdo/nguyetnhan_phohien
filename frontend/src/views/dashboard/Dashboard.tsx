import { Package, Users, MessageSquare, TrendingUp } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default async function Dashboard() {
  const { count: messagesCount } = await supabase
    .from('Messages')
    .select('*', { count: 'exact', head: true });

  const { count: customersCount } = await supabase
    .from('Customers')
    .select('*', { count: 'exact', head: true });

  const totalMessages = messagesCount ?? 0;
  const totalCustomers = customersCount ?? 0;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">Nguyệt Nhãn Phố Hiến</h2>
        <p className="text-muted-foreground">Tổng quan tình hình kinh doanh & tương tác.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-muted-foreground">Tổng Tin Nhắn</h3>
            <MessageSquare className="w-4 h-4 text-primary" />
          </div>
          <p className="text-3xl font-bold mt-2 text-primary">{totalMessages.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-muted-foreground">Khách Hàng</h3>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <p className="text-3xl font-bold mt-2 text-primary">{totalCustomers.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-muted-foreground">Đơn Hàng</h3>
            <Package className="w-4 h-4 text-primary" />
          </div>
          <p className="text-3xl font-bold mt-2 text-primary">0</p>
          <span className="text-xs text-muted-foreground">Chưa có dữ liệu đơn hàng</span>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-muted-foreground">Tỷ Lệ Bot Trả Lời</h3>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <p className="text-3xl font-bold mt-2 text-primary">0%</p>
          <span className="text-xs text-muted-foreground">Chưa có dữ liệu cấu hình bot</span>
        </div>
      </div>
      
      <div className="h-[400px] rounded-xl border bg-card shadow flex flex-col relative overflow-hidden">
        {/* Organic texture overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noiseFilter\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.8\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noiseFilter)\"/%3E%3C/svg%3E')"}}></div>
        <div className="p-6 border-b z-10">
          <h3 className="font-bold text-lg text-primary">Hiệu suất tuần qua</h3>
        </div>
        <div className="flex-1 flex items-center justify-center z-10">
          <p className="text-muted-foreground">Biểu đồ thống kê lượng tin nhắn và doanh thu sẽ hiển thị ở đây</p>
        </div>
      </div>
    </div>
  )
}
