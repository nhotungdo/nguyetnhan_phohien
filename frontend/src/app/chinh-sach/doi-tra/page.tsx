import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chính Sách Đổi Trả - Nguyệt Nhãn Phố Hiến',
};

export default function ReturnPolicy() {
  return (
    <div className="container mx-auto px-4 md:px-6 max-w-3xl">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-border">
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-8 border-b pb-4">Chính Sách Đổi Trả</h1>
        <div className="text-foreground/80 space-y-4 text-lg leading-relaxed">
          <p>Nhằm đảm bảo quyền lợi tốt nhất của khách hàng, Nguyệt Nhãn Phố Hiến áp dụng chính sách đổi trả minh bạch như sau:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Thời gian đổi trả:</strong> Trong vòng 7 ngày kể từ khi nhận được hàng.</li>
            <li><strong>Điều kiện đổi trả:</strong> Sản phẩm còn nguyên bao bì, chưa qua sử dụng, và khách hàng cần cung cấp hóa đơn hoặc số điện thoại mua hàng.</li>
            <li><strong>Trường hợp được đổi trả miễn phí:</strong> Sản phẩm bị hỏng hóc do quá trình vận chuyển hoặc lỗi từ phía nhà sản xuất (nấm mốc, rách bao bì trước khi mở).</li>
          </ul>
          <p><em>* Quý khách vui lòng quay lại video quá trình mở hộp để chúng tôi có thể hỗ trợ nhanh chóng và chính xác nhất.</em></p>
        </div>
      </div>
    </div>
  );
}
