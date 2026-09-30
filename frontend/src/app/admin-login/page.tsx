"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, adminAuth } from "@/services/api.service";
import { Loader2, Lock, User, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const result = await authApi.adminLogin(username.trim(), password);
      adminAuth.login(result.token);
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Đăng nhập thất bại. Vui lòng thử lại.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#451A03] px-4">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#78350F] rounded-full blur-[100px] opacity-50 -translate-y-1/3 translate-x-1/4 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white flex items-center justify-center shadow-xl">
            <span className="text-accent font-bold text-xl">NN</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Nguyệt Nhãn Phố Hiến</h1>
          <p className="text-[#FDE68A] text-sm mt-1">Đăng nhập quản trị</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="username" className="text-sm font-medium text-foreground/80">
                Tên đăng nhập
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                <input
                  id="username"
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-background border border-border focus:border-accent focus:ring-1 focus:ring-accent rounded-xl pl-9 pr-4 py-3 outline-none transition-all"
                  placeholder="Tên đăng nhập"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground/80">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background border border-border focus:border-accent focus:ring-1 focus:ring-accent rounded-xl pl-9 pr-10 py-3 outline-none transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !username.trim() || !password}
              className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all hover:-translate-y-0.5 active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Đang đăng nhập...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" /> Đăng nhập
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#FDE68A]/70 mt-6">
          Trang dành riêng cho quản trị viên. Mọi truy cập được ghi log.
        </p>
      </div>
    </div>
  );
}
