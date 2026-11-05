"use client";

import { useLanguageStore } from "@/store/useLanguageStore";

export default function PrivacyPolicy() {
  const language = useLanguageStore((s) => s.language);

  return (
    <div className="container mx-auto px-4 md:px-6 max-w-3xl">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-border">
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-8 border-b pb-4">
          {language === "en" ? "Information Privacy Policy" : "Bảo Mật Thông Tin"}
        </h1>
        <div className="text-foreground/80 space-y-4 text-base sm:text-lg leading-relaxed">
          <p>
            {language === "en"
              ? "Your personal privacy and data security are top priorities at Nguyệt Nhãn Phố Hiến."
              : "Sự riêng tư và bảo mật thông tin cá nhân của quý khách là ưu tiên hàng đầu tại Nguyệt Nhãn Phố Hiến."}
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>
                {language === "en" ? "Purpose of collection: " : "Mục đích thu thập: "}
              </strong>
              {language === "en"
                ? "We only collect your name, phone number, and address strictly for order processing, fulfillment, and customer support."
                : "Chúng tôi chỉ thu thập họ tên, số điện thoại và địa chỉ nhằm mục đích xử lý đơn hàng, giao hàng và hỗ trợ chăm sóc khách hàng."}
            </li>
            <li>
              <strong>
                {language === "en" ? "Absolute security: " : "Bảo mật tuyệt đối: "}
              </strong>
              {language === "en"
                ? "All customer data is encrypted and securely stored on our protected server infrastructure."
                : "Mọi thông tin của quý khách được mã hóa an toàn trên hệ thống máy chủ của chúng tôi."}
            </li>
            <li>
              <strong>
                {language === "en" ? "Our 3-No Commitment: " : "Cam kết 3 Không: "}
              </strong>
              {language === "en"
                ? "No selling, No sharing, No renting of your personal data to any third party for commercial purposes."
                : "Không bán, Không chia sẻ, Không cho thuê thông tin cá nhân của quý khách cho bất kỳ bên thứ ba nào vì mục đích thương mại."}
            </li>
          </ul>
          <p>
            {language === "en" ? (
              <>
                If you wish to request deletion of your personal data, please contact us at{" "}
                <strong>nguyetnhanphohien@gmail.com</strong>.
              </>
            ) : (
              <>
                Nếu quý khách muốn yêu cầu xóa dữ liệu cá nhân khỏi hệ thống, xin vui lòng gửi email về{" "}
                <strong>nguyetnhanphohien@gmail.com</strong>.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
