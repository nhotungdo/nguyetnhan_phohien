using Microsoft.AspNetCore.Hosting;

namespace NguyetnhanPhohien.Infrastructure.Services;

/// <summary>
/// Nguồn DUY NHẤT quyết định gốc lưu file upload cho MỌI service.
///
/// Vì sao cần lớp này: ProductService trước đây lấy gốc từ config
/// `FileStorage:UploadsPath` (hoặc `Directory.GetCurrentDirectory()/wwwroot`), còn
/// ContentService luôn dùng `Directory.GetCurrentDirectory()/wwwroot`. Hai service
/// ghi vào hai cây thư mục khác nhau khi cấu hình được set, trong khi URL ảnh vẫn
/// hardcode `/uploads/products/...` — mà `/uploads` chỉ được phục vụ từ wwwroot của
/// API (UseStaticFiles trong Program.cs). Cấu hình trỏ ra ngoài wwwroot ⇒ ảnh ghi
/// được nhưng mọi request ảnh trả 404.
///
/// Nay gốc luôn là <see cref="IWebHostEnvironment.WebRootPath"/> — đúng thư mục
/// UseStaticFiles phục vụ — nên đường dẫn file trên đĩa và URL công khai luôn khớp.
/// </summary>
public static class UploadPathResolver
{
    /// <summary>
    /// Gốc web của API (…/wwwroot). WebRootPath có thể null khi thư mục chưa tồn tại
    /// (một số môi trường host); khi đó suy ra từ ContentRootPath.
    /// </summary>
    public static string WebRoot(IWebHostEnvironment env) =>
        !string.IsNullOrWhiteSpace(env.WebRootPath)
            ? env.WebRootPath
            : Path.Combine(env.ContentRootPath, "wwwroot");

    /// <summary>
    /// Thư mục con trong gốc web, tạo sẵn nếu chưa có.
    /// Ví dụ: <c>Directory(env, "uploads", "products")</c> → …/wwwroot/uploads/products
    /// </summary>
    public static string Directory(IWebHostEnvironment env, params string[] segments)
    {
        var root = WebRoot(env);
        var full = segments.Length == 0 ? root : Path.Combine(new[] { root }.Concat(segments).ToArray());
        System.IO.Directory.CreateDirectory(full);
        return full;
    }

    /// <summary>
    /// Đổi đường dẫn tương đối công khai ("/uploads/...") thành đường dẫn tuyệt đối
    /// trên đĩa, tính từ gốc web. Trả về null nếu đường dẫn không nằm trong /uploads
    /// hoặc chứa ".." (chặn path traversal) để caller biết là không được phép xoá.
    /// </summary>
    public static string? ResolveUploadFile(IWebHostEnvironment env, string? relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath)) return null;
        if (!relativePath.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase)) return null;
        if (relativePath.Contains("..", StringComparison.Ordinal)) return null;

        return Path.Combine(WebRoot(env),
            relativePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
    }
}
