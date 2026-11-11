"use client";

import { useLanguageStore } from "@/stores/useLanguageStore";

export default function QualityPolicy() {
  const language = useLanguageStore((s) => s.language);

  return (
    <div className="container mx-auto px-4 md:px-6 max-w-3xl">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-border">
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-8 border-b pb-4">
          {language === "en" ? "Quality Inspection & Standards" : "Kiểm Định Chất Lượng"}
        </h1>
        <div className="text-foreground/80 space-y-4 text-base sm:text-lg leading-relaxed">
          <p>
            {language === "en"
              ? "At Nguyệt Nhãn Phố Hiến, quality is not merely a promise but proven through rigorous safety standards."
              : "Tại Nguyệt Nhãn Phố Hiến, chất lượng không chỉ là lời hứa mà là minh chứng được kiểm duyệt khắt khe qua nhiều tiêu chuẩn an toàn."}
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>
                {language === "en" ? "Closed-loop process: " : "Quy trình khép kín: "}
              </strong>
              {language === "en"
                ? "100% of raw longans are harvested directly in Hung Yen. From convection hot-air drying to packaging, all handled in a sterile environment."
                : "100% nguyên liệu được thu hoạch trực tiếp tại Hưng Yên. Từ khâu sấy nhiệt nóng (sấy đối lưu) đến đóng gói đều trong môi trường vô trùng."}
            </li>
            <li>
              <strong>
                {language === "en" ? "Food Safety Certification: " : "Chứng nhận An Toàn Thực Phẩm: "}
              </strong>
              {language === "en"
                ? "All products meet food hygiene and safety standards certified by the Department of Health."
                : "Toàn bộ sản phẩm đều đạt tiêu chuẩn an toàn vệ sinh thực phẩm do Sở Y Tế tỉnh Hưng Yên cấp phép."}
            </li>
            <li>
              <strong>
                {language === "en" ? "Zero harmful chemicals: " : "Không hóa chất: "}
              </strong>
              {language === "en"
                ? "10x refund guarantee if bleaching agents, artificial sweeteners, or chemical preservatives are detected."
                : "Cam kết hoàn tiền gấp 10 lần nếu phát hiện sử dụng chất tẩy trắng, đường hóa học hoặc chất bảo quản."}
            </li>
            <li>
              <strong>
                {language === "en" ? "Optimum moisture level: " : "Độ ẩm tiêu chuẩn: "}
              </strong>
              {language === "en"
                ? "Dried to optimum moisture content for long-lasting natural shelf life while retaining its supple chew and honey aroma."
                : "Long nhãn được sấy đạt độ ẩm tiêu chuẩn giúp bảo quản lâu tự nhiên mà vẫn giữ được độ dẻo và hương thơm."}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
