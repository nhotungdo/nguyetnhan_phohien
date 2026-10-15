using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using NguyetnhanPhohien.Application.DTOs.Dashboard;
using NguyetnhanPhohien.Application.Interfaces;
using NguyetnhanPhohien.Domain.Entities;
using NguyetnhanPhohien.Domain.Enums;
using NguyetnhanPhohien.Infrastructure.Persistence;

namespace NguyetnhanPhohien.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private readonly AppDbContext _db;
    private readonly IMemoryCache _cache;
    public const string CacheKey = "DashboardStatsCacheKey";

    public DashboardService(AppDbContext db, IMemoryCache cache)
    {
        _db = db;
        _cache = cache;
    }

    public async Task<DashboardStatsResponse> GetDashboardStatsAsync()
    {
        if (_cache.TryGetValue(CacheKey, out DashboardStatsResponse? cached) && cached != null)
        {
            return cached;
        }

        // 1. Tổng doanh thu (đơn Completed) & Tổng số đơn
        var totalOrders = await _db.Orders.CountAsync();
        var totalRevenue = await _db.Orders
            .Where(o => o.Status == OrderStatus.Completed)
            .SumAsync(o => (decimal?)o.TotalAmount) ?? 0m;

        // 2. Số khách hàng duy nhất (theo SĐT)
        var customersCount = await _db.Orders
            .Where(o => !string.IsNullOrEmpty(o.CustomerPhone))
            .Select(o => o.CustomerPhone)
            .Distinct()
            .CountAsync();

        // 3. Số phiên chat & số phiên chưa đọc
        var messagesCount = await _db.ChatSessions.CountAsync();
        var unreadMessages = await _db.ChatSessions.CountAsync(s => s.HasUnreadMessages);

        // 4. Biểu đồ 30 ngày gần nhất (theo giờ Việt Nam UTC+7)
        var vnOffset = TimeSpan.FromHours(7);
        var nowVn = DateTime.UtcNow.Add(vnOffset);
        var todayVnDate = nowVn.Date;

        var dailyMap = new Dictionary<string, DayPointDto>();
        for (int i = 29; i >= 0; i--)
        {
            var day = todayVnDate.AddDays(-i);
            var key = day.ToString("yyyy-MM-dd");
            dailyMap[key] = new DayPointDto
            {
                Key = key,
                Label = day.ToString("dd/MM"),
                Revenue = 0,
                Orders = 0
            };
        }

        var cutoffUtc = DateTime.UtcNow.AddDays(-32);
        var recentOrders = await _db.Orders
            .AsNoTracking()
            .Where(o => o.CreatedAt >= cutoffUtc)
            .Select(o => new { o.CreatedAt, o.Status, o.TotalAmount })
            .ToListAsync();

        foreach (var order in recentOrders)
        {
            var orderVn = order.CreatedAt.Add(vnOffset).Date;
            var key = orderVn.ToString("yyyy-MM-dd");
            if (dailyMap.TryGetValue(key, out var point))
            {
                point.Orders += 1;
                if (order.Status == OrderStatus.Completed)
                {
                    point.Revenue += order.TotalAmount;
                }
            }
        }

        // 5. Top sản phẩm bán chạy (natively grouped in PostgreSQL)
        var rawTop = await _db.OrderItems
            .AsNoTracking()
            .GroupBy(i => new { i.ProductName, i.ProductSize })
            .Select(g => new
            {
                Name = g.Key.ProductName,
                Size = g.Key.ProductSize,
                Quantity = g.Sum(x => x.Quantity),
                Revenue = g.Sum(x => x.TotalPrice)
            })
            .OrderByDescending(x => x.Quantity)
            .Take(5)
            .ToListAsync();

        var maxQty = rawTop.Count > 0 ? rawTop.Max(x => x.Quantity) : 0;
        var topProducts = rawTop.Select(x => new TopProductDto
        {
            Key = $"{x.Name}_{x.Size ?? ""}",
            Name = x.Name,
            Size = x.Size,
            Quantity = x.Quantity,
            Revenue = x.Revenue,
            SharePct = maxQty > 0 ? Math.Round((double)x.Quantity / maxQty * 100, 1) : 0
        }).ToList();

        var result = new DashboardStatsResponse
        {
            Revenue = totalRevenue,
            OrdersCount = totalOrders,
            CustomersCount = customersCount,
            MessagesCount = messagesCount,
            UnreadMessages = unreadMessages,
            DailyStats = dailyMap.Values.ToList(),
            TopProducts = topProducts
        };

        // Cache 60 giây (tự động bị xóa khi có đơn mới hoặc phiên chat đổi)
        _cache.Set(CacheKey, result, TimeSpan.FromSeconds(60));

        return result;
    }
}
