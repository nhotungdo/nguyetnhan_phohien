"use client";

import { NavigationHeader } from "@/components/layout/NavigationHeader";
import { GlobalFooter } from "@/components/layout/GlobalFooter";

interface StorefrontLayoutProps {
  children: React.ReactNode;
  headerOffset?: boolean;
}

export function StorefrontLayout({ children, headerOffset = true }: StorefrontLayoutProps) {
  return (
    <div className="storefront min-h-screen bg-background text-foreground font-sans selection:bg-accent selection:text-accent-foreground w-full max-w-full overflow-x-clip flex flex-col justify-between">
      <NavigationHeader />
      <main
        className={`w-full max-w-full overflow-x-clip flex-1 pb-20 md:pb-0 ${
          headerOffset ? "pt-[68px] sm:pt-[76px]" : ""
        }`}
      >
        {children}
      </main>
      <GlobalFooter />
    </div>
  );
}

export default StorefrontLayout;

