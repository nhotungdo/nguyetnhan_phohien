import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bảo Mật Thông Tin - Nguyệt Nhãn Phố Hiến',
};

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 md:px-6 max-w-3xl">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-border">
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-8 border-b pb-4">Bảo Mật Thông Tin</h1>
        <div className="text-foreground/80 space-y-4 text-lg leading-relaxed">
          <p>Sự riêng tư và bảo mật thông tin cá nhân của quý khách là ưu tiên hàng đầu tại Nguyệt Nhãn Phố Hiến.</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Mục đích thu thập:</strong> Chúng tôi chỉ thu thập họ tên, số điện thoại và địa chỉ nhằm mục đích xử lý đơn hàng, giao hàng và hỗ trợ chăm sóc khách hàng.</li>
            <li><strong>Bảo mật tuyệt đối:</strong> Mọi thông tin của quý khách được mã hóa an toàn trên hệ thống máy chủ của chúng tôi.</li>
            <li><strong>Cam kết 3 Không:</strong> Không bán, Không chia sẻ, Không cho thuê thông tin cá nhân của quý khách cho bất kỳ bên thứ ba nào vì mục đích thương mại.</li>
          </ul>
          <p>Nếu quý khách muốn yêu cầu xóa dữ liệu cá nhân khỏi hệ thống, xin vui lòng gửi email về <strong>hello@nguyetnhan.vn</strong>.</p>
        </div>
      </div>
    </div>
  );
}
