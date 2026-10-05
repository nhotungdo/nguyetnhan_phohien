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
}
