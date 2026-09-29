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
  SidebarFooter
} from "@/components/ui/sidebar"
import { MessageSquare, Settings, Users, LayoutDashboard } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Messenger", url: "/messenger", icon: MessageSquare },
  { title: "Khách hàng", url: "/customers", icon: Users },
  { title: "Auto Reply / Bot", url: "/chatbot", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-border/50">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-10 h-10 rounded-md bg-card text-accent font-sans font-bold text-xs flex items-center justify-center overflow-hidden border border-border/30 shadow-sm relative">
            <span className="absolute">NN</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="Nguyệt Nhãn Phố Hiến" className="w-full h-full object-cover relative z-10" onError={(e) => e.currentTarget.style.display = 'none'} />
          </div>
          <span style={{ fontFamily: 'var(--font-dancing)' }} className="font-bold text-2xl tracking-wide text-primary">Nguyệt Nhãn Phố Hiến</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground">Menu</SidebarGroupLabel>
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
                      onClick={() => router.push(item.url)}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-border/50">
        <div className="flex items-center gap-2 px-2">
          <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-semibold text-sm">
            AD
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">Admin User</span>
            <span className="text-xs text-muted-foreground">Premium Plan</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
