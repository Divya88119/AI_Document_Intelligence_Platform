using DocumentIntelligence.API.Models.DTOs;

namespace DocumentIntelligence.API.Services.Interfaces;

public interface IDashboardService
{
    Task<DashboardStatsDto> GetStatsAsync(int? currentUserId = null, bool isAdmin = false);
}

