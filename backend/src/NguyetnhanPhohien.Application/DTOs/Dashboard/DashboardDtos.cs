using System.Collections.Generic;

namespace NguyetnhanPhohien.Application.DTOs.Dashboard;

public class DayPointDto
{
    public string Key { get; set; } = string.Empty; // YYYY-MM-DD
    public string Label { get; set; } = string.Empty; // dd/MM
    public decimal Revenue { get; set; }
    public int Orders { get; set; }
}

public class TopProductDto
{
    public string Key { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Size { get; set; }
    public int Quantity { get; set; }
    public decimal Revenue { get; set; }
    public double SharePct { get; set; }
}

public class DashboardStatsResponse
{
    public decimal Revenue { get; set; }
    public int OrdersCount { get; set; }
    public int CustomersCount { get; set; }
    public int MessagesCount { get; set; }
    public int UnreadMessages { get; set; }
    public List<DayPointDto> DailyStats { get; set; } = new();
    public List<TopProductDto> TopProducts { get; set; } = new();
}
