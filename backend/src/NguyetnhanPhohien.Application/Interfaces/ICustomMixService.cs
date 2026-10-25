using System.Threading.Tasks;
using NguyetnhanPhohien.Application.DTOs.CustomMix;

namespace NguyetnhanPhohien.Application.Interfaces;

public interface ICustomMixService
{
    /// <summary>
    /// Lấy danh sách quy cách bao bì và 6 loại hạt đang kích hoạt để hiển thị trên giao diện Studio
    /// </summary>
    Task<CustomMixOptionsResponse> GetOptionsAsync();

    /// <summary>
    /// Kiểm tra tính hợp lệ của công thức phối hạt (tổng gram = 150g, 300g hoặc 900g) và lấy giá trọn gói niêm yết
    /// </summary>
    Task<ValidateCustomMixResponse> ValidateMixAsync(ValidateCustomMixRequest request);
}
