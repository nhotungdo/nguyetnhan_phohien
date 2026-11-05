"use client";

import { useLanguageStore } from "@/store/useLanguageStore";

export default function DeliveryPolicy() {
  const language = useLanguageStore((s) => s.language);

  return (
    <div className="container mx-auto px-4 md:px-6 max-w-3xl">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-border">
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-8 border-b pb-4">
          {language === "en" ? "Shipping & Delivery Policy" : "Chính Sách Giao Hàng"}
        </h1>
        <div className="text-foreground/80 space-y-4 text-base sm:text-lg leading-relaxed">
          <p>
            {language === "en"
              ? "Thank you for trusting and shopping at Nguyệt Nhãn Phố Hiến. Below is our delivery policy:"
              : "Cảm ơn quý khách đã tin tưởng và mua sắm tại Nguyệt Nhãn Phố Hiến. Dưới đây là chính sách giao hàng của chúng tôi:"}
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>
                {language === "en" ? "Orders in Hung Yen & Hanoi: " : "Đơn hàng trong khu vực Hưng Yên và Hà Nội: "}
              </strong>
              {language === "en" ? "Delivered within 24 - 48 hours." : "Giao hàng trong vòng 24 - 48 giờ."}
            </li>
            <li>
              <strong>
                {language === "en" ? "Other provinces & cities: " : "Các tỉnh thành khác: "}
              </strong>
              {language === "en" ? "Delivered within 3 - 5 business days." : "Giao hàng từ 3 - 5 ngày làm việc."}
            </li>
            <li>
              <strong>
                {language === "en" ? "Free shipping: " : "Miễn phí vận chuyển: "}
              </strong>
              {language === "en"
                ? "Applicable for orders from 1,000,000 VND and above."
                : "Áp dụng cho các đơn hàng từ 1.000.000 VNĐ trở lên."}
            </li>
            <li>
              <strong>
                {language === "en" ? "Standard shipping fee: " : "Phí vận chuyển tiêu chuẩn: "}
              </strong>
              {language === "en"
                ? "30,000 VND for orders below the threshold."
                : "30.000 VNĐ cho các đơn hàng dưới định mức trên."}
            </li>
          </ul>
          <p>
            {language === "en"
              ? "For any inquiries regarding the delivery process, please contact hotline 0982.072.601 for prompt assistance."
              : "Mọi thắc mắc về quá trình giao hàng, quý khách vui lòng liên hệ hotline 0982.072.601 để được hỗ trợ kịp thời."}
          </p>
        </div>
      </div>
    </div>
  );
}
