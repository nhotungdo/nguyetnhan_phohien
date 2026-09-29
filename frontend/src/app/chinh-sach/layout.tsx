import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PolicyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary text-white py-4 shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:text-accent transition-colors font-medium">
            <ArrowLeft className="w-5 h-5" /> Trở về trang chủ
          </Link>
          <div style={{ fontFamily: 'var(--font-dancing)' }} className="text-2xl font-bold">
            Nguyệt Nhãn Phố Hiến
          </div>
        </div>
      </header>
      <main className="flex-1 py-12 bg-secondary/20">
        {children}
      </main>
      <footer className="bg-foreground text-background py-8 text-center text-sm">
        <p>© 2026 Nguyệt Nhãn Phố Hiến. All rights reserved.</p>
      </footer>
    </div>
  );
}
