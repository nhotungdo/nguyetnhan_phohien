"use client";

import { useState } from "react";
import { Phone, Mail, MapPin, Clock, Send, CheckCircle, MessageCircle, Sparkles } from "lucide-react";
import { useLanguageStore } from "@/store/useLanguageStore";
import { useWebsiteContent } from "@/hooks/useWebsiteContent";

export function ContactPageView() {
  const { language } = useLanguageStore();
  const { content: cmsContent } = useWebsiteContent();

  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;
    setIsSent(true);
  };

  return (
    <div className="py-12 sm:py-16 bg-gradient-to-b from-[#FCFBF7] via-white to-amber-50/20">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Cột 1: Thông tin liên hệ & Kênh hỗ trợ */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8DFC8] shadow-sm space-y-6">
              <h2 className="text-xl sm:text-2xl font-bold text-primary flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                <span>{language === "en" ? "Official Contact" : "Thông Tin Chính Thức"}</span>
              </h2>

              <div className="space-y-4 text-sm sm:text-base">
                <a
                  href={`tel:${cmsContent.Hotline || "0982072601"}`}
                  className="flex items-start gap-4 p-3.5 rounded-2xl bg-[#F7F3EB] hover:bg-amber-100/60 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500 font-medium">Hotline / Zalo (24/7)</p>
                    <p className="font-bold text-primary text-base sm:text-lg">{cmsContent.Hotline || "0982.072.601"}</p>
                  </div>
                </a>

                <a
                  href={`mailto:${cmsContent.ContactEmail || "nguyetnhanphohien@gmail.com"}`}
                  className="flex items-start gap-4 p-3.5 rounded-2xl bg-[#F7F3EB] hover:bg-amber-100/60 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500 font-medium">Email Báo Giá Sỉ & Hỗ Trợ</p>
                    <p className="font-bold text-primary break-all">{cmsContent.ContactEmail || "nguyetnhanphohien@gmail.com"}</p>
                  </div>
                </a>

                <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-[#F7F3EB]">
                  <div className="w-10 h-10 rounded-xl bg-[#78350F] text-white flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500 font-medium">Địa Chỉ Xưởng Sản Xuất</p>
                    <p className="font-bold text-primary leading-snug">
                      {cmsContent.FooterAddress || (language === "en" ? "Pho Hien, Hong Chau Ward, Hung Yen City" : "Phố Hiến, Phường Hồng Châu, Tp. Hưng Yên")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-[#F7F3EB]">
                  <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500 font-medium">Giờ Làm Việc & Đón Tiếp</p>
                    <p className="font-bold text-primary">
                      {cmsContent.ContactHours || "08:00 - 20:00 (Tất cả các ngày trong tuần)"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Kênh hỗ trợ trực tuyến */}
            <div className="bg-gradient-to-r from-amber-900 to-primary text-white p-6 rounded-3xl shadow-sm">
              <h3 className="font-bold text-lg text-[#F3D498] mb-2 flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <span>Tư Vấn Doanh Nghiệp & Quà Biếu Tết</span>
              </h3>
              <p className="text-xs sm:text-sm text-stone-200 leading-relaxed mb-4">
                Quý công ty, đối tác cần báo giá chiết khấu đơn hàng lớn và in logo quà tặng riêng, vui lòng liên hệ trực tiếp qua Zalo hoặc Hotline để nhận chính sách tốt nhất.
              </p>
              <a
                href="https://zalo.me/0982072601"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#F3D498] text-primary hover:bg-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-full transition-all"
              >
                <span>Nhắn Tin Qua Zalo Ngay</span>
              </a>
            </div>
          </div>

          {/* Cột 2: Form gửi lời nhắn / yêu cầu báo giá */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-10 rounded-3xl border border-[#E8DFC8] shadow-md">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-2">
              {language === "en" ? "Send Us a Message" : "Gửi Lời Nhắn Đến Nguyệt Nhãn"}
            </h2>
            <p className="text-stone-600 text-sm sm:text-base mb-6 leading-relaxed">
              Hãy để lại thông tin, đội ngũ tư vấn sẽ liên hệ lại quý khách trong vòng 15 phút làm việc.
            </p>

            {isSent ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-center space-y-3">
                <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="text-lg font-bold">Gửi Lời Nhắn Thành Công!</h3>
                <p className="text-sm text-emerald-800">
                  Cảm ơn quý khách đã gửi thông tin. Chúng tôi sẽ liên hệ lại qua số điện thoại <strong>{form.phone}</strong> sớm nhất.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsSent(false);
                    setForm({ name: "", phone: "", email: "", message: "" });
                  }}
                  className="mt-3 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-colors"
                >
                  Gửi lời nhắn khác
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-stone-700">Họ và tên *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Nguyễn Văn A"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-stone-50 border border-[#E8DFC8] focus:border-accent focus:ring-1 focus:ring-accent rounded-xl px-4 py-3 text-sm outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-stone-700">Số điện thoại *</label>
                    <input
                      type="tel"
                      required
                      placeholder="Ví dụ: 0912 345 678"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full bg-stone-50 border border-[#E8DFC8] focus:border-accent focus:ring-1 focus:ring-accent rounded-xl px-4 py-3 text-sm outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-stone-700">Địa chỉ Email (Không bắt buộc)</label>
                  <input
                    type="email"
                    placeholder="example@gmail.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-stone-50 border border-[#E8DFC8] focus:border-accent focus:ring-1 focus:ring-accent rounded-xl px-4 py-3 text-sm outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-stone-700">Nội dung cần tư vấn *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Quý khách cần tư vấn về loại long nhãn nào, hoặc số lượng quà biếu cần đặt..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full bg-stone-50 border border-[#E8DFC8] focus:border-accent focus:ring-1 focus:ring-accent rounded-xl px-4 py-3 text-sm outline-none transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-accent hover:bg-[#9A3412] text-white font-bold py-3.5 rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base"
                >
                  <Send className="w-4 h-4" />
                  <span>Gửi Lời Nhắn Ngay</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactPageView;
