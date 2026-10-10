using System.Text;

namespace NguyetnhanPhohien.Domain;

/// <summary>
/// Chuẩn hóa số điện thoại trước khi dùng làm khóa so khớp.
///
/// Cùng một khách có thể gõ "0912 345 678", "0912.345.678", "+84 912 345 678"
/// hoặc "0912345678" — nếu so khớp nguyên chuỗi thì một người vẫn dùng được
/// mã giảm giá nhiều lần. Chỉ giữ chữ số để mọi cách gõ quy về một khóa.
/// </summary>
public static class PhoneNumber
{
    /// <summary>
    /// Chỉ giữ chữ số của số điện thoại. Nếu chuỗi không có chữ số nào
    /// (dữ liệu rác) thì trả về bản gốc đã trim để các SĐT rác không dồn về
    /// cùng một khóa rỗng và chặn nhau oan.
    /// </summary>
    public static string Normalize(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone)) return string.Empty;

        var digits = new StringBuilder(phone.Length);
        foreach (var ch in phone)
        {
            if (char.IsDigit(ch)) digits.Append(ch);
        }

        return digits.Length > 0 ? digits.ToString() : phone.Trim();
    }
}
