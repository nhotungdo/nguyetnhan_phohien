import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chính Sách Giao Hàng - Nguyệt Nhãn Phố Hiến',
};

export default function DeliveryPolicy() {
  return (
    <div className="container mx-auto px-4 md:px-6 max-w-3xl">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-border">
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-8 border-b pb-4">Chính Sách Giao Hàng</h1>
        <div className="text-foreground/80 space-y-4 text-lg leading-relaxed">
          <p>Cảm ơn quý khách đã tin tưởng và mua sắm tại Nguyệt Nhãn Phố Hiến. Dưới đây là chính sách giao hàng của chúng tôi:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Đơn hàng trong khu vực Hưng Yên và Hà Nội:</strong> Giao hàng trong vòng 24 - 48 giờ.</li>
            <li><strong>Các tỉnh thành khác:</strong> Giao hàng từ 3 - 5 ngày làm việc.</li>
            <li><strong>Miễn phí vận chuyển:</strong> Áp dụng cho các đơn hàng từ 1.000.000 VNĐ trở lên.</li>
            <li><strong>Phí vận chuyển tiêu chuẩn:</strong> 30.000 VNĐ cho các đơn hàng dưới định mức trên.</li>
          </ul>
          <p>Mọi thắc mắc về quá trình giao hàng, quý khách vui lòng liên hệ hotline 0982.072.601 để được hỗ trợ kịp thời.</p>
        </div>
      </div>
    </div>
  );
}
