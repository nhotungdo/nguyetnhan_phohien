namespace NguyetnhanPhohien.Domain.Enums;

public enum EmailOutboxStatus
{
    Pending,     // 0: Đang chờ gửi
    Processing,  // 1: Đang trong tiến trình gửi
    Sent,        // 2: Đã gửi thành công
    Failed       // 3: Đã thất bại (sau khi hết số lần retry)
}
