import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kiểm Định Chất Lượng - Nguyệt Nhãn Phố Hiến',
};

export default function QualityPolicy() {
  return (
    <div className="container mx-auto px-4 md:px-6 max-w-3xl">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-border">
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-8 border-b pb-4">Kiểm Định Chất Lượng</h1>
        <div className="text-foreground/80 space-y-4 text-lg leading-relaxed">
          <p>Tại Nguyệt Nhãn Phố Hiến, chất lượng không chỉ là lời hứa mà là minh chứng được kiểm duyệt khắt khe qua nhiều tiêu chuẩn an toàn.</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Quy trình khép kín:</strong> 100% nguyên liệu được thu hoạch trực tiếp tại Hưng Yên. Từ khâu sấy củi thủ công đến đóng gói đều trong môi trường vô trùng.</li>
            <li><strong>Chứng nhận An Toàn Thực Phẩm:</strong> Toàn bộ sản phẩm đều đạt tiêu chuẩn an toàn vệ sinh thực phẩm do Sở Y Tế tỉnh Hưng Yên cấp phép.</li>
            <li><strong>Không hóa chất:</strong> Cam kết hoàn tiền gấp 10 lần nếu phát hiện sử dụng chất tẩy trắng, đường hóa học hoặc chất bảo quản.</li>
            <li><strong>Độ ẩm tiêu chuẩn:</strong> Long nhãn được sấy đạt độ ẩm tiêu chuẩn giúp bảo quản lâu tự nhiên mà vẫn giữ được độ dẻo và hương thơm.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
