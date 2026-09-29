"use client"
import React from "react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/AppSidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full relative">
        <AppSidebar />
        <main className="flex-1 flex flex-col relative w-full h-screen overflow-hidden">
          <header className="h-14 flex items-center gap-4 border-b border-border/50 px-4 shrink-0 bg-background/80 backdrop-blur-md sticky top-0 z-10">
            <SidebarTrigger />
            <h1 className="font-semibold text-foreground text-sm">Dashboard</h1>
          </header>
          <div className="flex-1 overflow-auto p-6 relative">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
