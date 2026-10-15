using System.Threading.Tasks;
using NguyetnhanPhohien.Application.DTOs.Dashboard;

namespace NguyetnhanPhohien.Application.Interfaces;

public interface IDashboardService
{
    Task<DashboardStatsResponse> GetDashboardStatsAsync();
}
