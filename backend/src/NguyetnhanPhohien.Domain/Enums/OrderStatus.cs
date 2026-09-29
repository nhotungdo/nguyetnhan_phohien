namespace NguyetnhanPhohien.Domain.Enums;
public enum OrderStatus
{
    PendingConfirmation,  // Chờ xác nhận
    Confirmed,            // Đã xác nhận
    Shipping,             // Đang giao
    Completed,            // Hoàn thành
    Cancelled             // Đã huỷ
}
