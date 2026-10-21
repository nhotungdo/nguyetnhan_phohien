import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar
} from "@/components/ui/sidebar"
import { MessageSquare, Package, LayoutDashboard, LogOut, Globe, Ticket, CreditCard, ExternalLink } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { adminAuth, chatApi } from "@/services/api.service"

const items = [
  { title: "Tổng quan", url: "/dashboard", icon: LayoutDashboard },
  { title: "Đơn hàng", url: "/orders", icon: Package },
  { title: "Nhắn tin", url: "/messenger", icon: MessageSquare },
  { title: "Nội dung Website", url: "/content", icon: Globe },
  { title: "Mã giảm giá", url: "/discounts", icon: Ticket },
  { title: "Thanh toán", url: "/payment", icon: CreditCard },
]

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();

  const { data: chatStats } = useQuery({
    queryKey: ["chat", "stats"],
    queryFn: () => chatApi.getStats(),
    refetchInterval: 30_000,
    staleTime: 5_000,
  });
  const unreadChatCount = chatStats?.unreadSessions || 0;

  const handleNavigate = (url: string) => {
    if (isMobile) {
      setOpenMobile(false);
    }
    router.push(url);
  };

  const handleLogout = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
    adminAuth.logout();
    router.push("/");
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-border/50">
        <div 
          onClick={() => handleNavigate("/dashboard")}
          className="flex items-center gap-3 px-2 py-2 cursor-pointer select-none"
        >
          <div className="w-10 h-10 rounded-md bg-card text-accent font-sans font-bold text-xs flex items-center justify-center overflow-hidden border border-border/30 shadow-sm relative shrink-0">
            <span className="absolute">NN</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="Nguyệt Nhãn Phố Hiến" className="w-full h-full object-cover relative z-10" onError={(e) => e.currentTarget.style.display = 'none'} />
          </div>
          <div className="flex flex-col min-w-0">
            <span style={{ fontFamily: 'var(--font-dancing)' }} className="font-bold text-2xl tracking-wide text-primary truncate">Nguyệt Nhãn</span>
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Trang quản trị</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground">Menu Quản trị</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const currentPathname = pathname || "";
                const isActive = currentPathname === item.url || (item.url !== "/" && currentPathname.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      isActive={isActive} 
                      tooltip={item.title}
                      onClick={() => handleNavigate(item.url)}
                      className="py-2.5"
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.title}</span>
                      {item.url === "/messenger" && unreadChatCount > 0 && (
                        <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold text-white bg-red-500 rounded-full shadow-sm animate-pulse">
                          {unreadChatCount > 99 ? "99+" : unreadChatCount}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="text-muted-foreground">Lối tắt</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => {
                    if (isMobile) setOpenMobile(false);
                    router.push("/");
                  }}
                  className="text-muted-foreground hover:text-primary py-2.5"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Xem Website khách</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-border/50">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-semibold text-sm">
              AD
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Quản trị viên</span>
              <span className="text-xs text-muted-foreground text-green-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Đang online
              </span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
            title="Đăng xuất"
            aria-label="Đăng xuất"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
