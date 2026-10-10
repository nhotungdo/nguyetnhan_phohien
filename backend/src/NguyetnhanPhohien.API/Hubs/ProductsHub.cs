using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace NguyetnhanPhohien.API.Hubs;

/// <summary>
/// Hub SignalR phát realtime "dữ liệu đã đổi" cho Frontend (Landing Page + trang Admin).
///
/// Client CHỈ nghe event, không gọi method nào vào hub này, nên KHÔNG gắn [Authorize]:
/// khách chưa đăng nhập cũng phải nhận được tín hiệu khi admin sửa sản phẩm / ảnh /
/// nội dung để invalidate React Query và tải lại dữ liệu ngay (kh cần refresh trang).
///
/// Ai phát sự kiện? Controller (ProductsController, ContentController) qua IHubContext&lt;ProductsHub&gt;.
/// Sau khi broadcast, controller cũng gọi EvictByTagAsync để xóa output-cache GET công khai
/// → client refetch luôn nhận dữ liệu mới, không bao giờ đọc nhầm cache cũ.
///
/// LƯU Ý: không gắn [Authorize] ở cấp class (như ChatHub đã giải thích) — JWT bearer
/// xác thực ở handshake nên yêu cầu auth cấp hub sẽ chặn luôn cả khách vãng lai.
///
/// Tên event:
///   - ProductsChanged: sản phẩm / ảnh sản phẩm đổi (ProductsController)
///   - ContentChanged:  nội dung CMS text + ảnh Landing Page đổi (ContentController)
/// </summary>
public class ProductsHub : Hub
{
    /// <summary>Sản phẩm hoặc ảnh sản phẩm đã thay đổi → client invalidate query ["products"].</summary>
    public const string ProductsChangedEvent = "ProductsChanged";

    /// <summary>Nội dung CMS (text + ảnh Landing Page) đã thay đổi → client invalidate ["website","content"].</summary>
    public const string ContentChangedEvent = "ContentChanged";

    /// <summary>
    /// Đơn hàng đã tạo hoặc đổi trạng thái → client invalidate ["orders","admin"]
    /// và ["dashboard","stats"]. Trước đây không có sự kiện nào cho đơn hàng nên
    /// trang Đơn hàng / Tổng quan chỉ tải một lần lúc mount (staleTime 5 phút,
    /// refetchOnWindowFocus = false) → phải F5 mới thấy đơn mới.
    /// </summary>
    public const string OrdersChangedEvent = "OrdersChanged";

    /// <summary>
    /// Phiên chat đã tạo / đổi trạng thái / có tin nhắn mới → client invalidate
    /// ["dashboard","stats"] (số phiên và số chưa đọc trên Tổng quan).
    /// </summary>
    public const string SessionsChangedEvent = "SessionsChanged";

    /// <summary>
    /// Group chỉ chứa các tab Admin đã đăng nhập. Sự kiện đơn hàng / phiên chat
    /// KHÔNG được phát cho khách vãng lai: chúng chỉ chứa thông tin vận hành nội bộ
    /// (có đơn mới lúc nào), khách không cần biết.
    /// </summary>
    public const string AdminGroup = "Admins";

    /// <summary>
    /// Tab Admin tự đăng ký nhận sự kiện nội bộ. Yêu cầu JWT role Admin — token do
    /// client gửi qua access_token trên query string (Program.cs đã bật cho /hubs).
    /// </summary>
    [Authorize(Roles = "Admin")]
    public Task JoinAsAdmin() => Groups.AddToGroupAsync(Context.ConnectionId, AdminGroup);
}
