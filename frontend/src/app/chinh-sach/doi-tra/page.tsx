"use client";

import { useLanguageStore } from "@/stores/useLanguageStore";

export default function ReturnPolicy() {
  const language = useLanguageStore((s) => s.language);

  return (
    <div className="container mx-auto px-4 md:px-6 max-w-3xl">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-border">
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-8 border-b pb-4">
          {language === "en" ? "Return & Refund Policy" : "Chính Sách Đổi Trả"}
        </h1>
        <div className="text-foreground/80 space-y-4 text-base sm:text-lg leading-relaxed">
          <p>
            {language === "en"
              ? "To ensure our customers' best interests, Nguyệt Nhãn Phố Hiến applies a transparent return policy as follows:"
              : "Nhằm đảm bảo quyền lợi tốt nhất của khách hàng, Nguyệt Nhãn Phố Hiến áp dụng chính sách đổi trả minh bạch như sau:"}
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>
                {language === "en" ? "Return window: " : "Thời gian đổi trả: "}
              </strong>
              {language === "en"
                ? "Within 7 days from the receipt date."
                : "Trong vòng 7 ngày kể từ khi nhận được hàng."}
            </li>
            <li>
              <strong>
                {language === "en" ? "Conditions for return: " : "Điều kiện đổi trả: "}
              </strong>
              {language === "en"
                ? "Product remains in intact packaging, unused, accompanied by order invoice or registered phone number."
                : "Sản phẩm còn nguyên bao bì, chưa qua sử dụng, và khách hàng cần cung cấp hóa đơn hoặc số điện thoại mua hàng."}
            </li>
            <li>
              <strong>
                {language === "en" ? "Free replacement eligibility: " : "Trường hợp được đổi trả miễn phí: "}
              </strong>
              {language === "en"
                ? "Damaged during transit or manufacturing defects (mold, torn packaging prior to opening)."
                : "Sản phẩm bị hỏng hóc do quá trình vận chuyển hoặc lỗi từ phía nhà sản xuất (nấm mốc, rách bao bì trước khi mở)."}
            </li>
          </ul>
          <p>
            <em>
              {language === "en"
                ? "* Please record an unboxing video upon receipt so our team can provide the fastest and most accurate support."
                : "* Quý khách vui lòng quay lại video quá trình mở hộp để chúng tôi có thể hỗ trợ nhanh chóng và chính xác nhất."}
            </em>
          </p>
        </div>
      </div>
    </div>
  );
}
