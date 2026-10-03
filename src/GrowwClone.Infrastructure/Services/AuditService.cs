using GrowwClone.Application.Audit;
using GrowwClone.Domain;
using Microsoft.EntityFrameworkCore;

namespace GrowwClone.Infrastructure.Services;

public class AuditService : IAuditLogger, IAuditLogService
{
    private readonly AppDbContext _db;
    public AuditService(AppDbContext db) => _db = db;

    public async Task LogAsync(int? userId, string eventType, string detail, string? ipAddress = null)
    {
        _db.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            EventType = eventType,
            Detail = detail,
            IpAddress = ipAddress
        });
        await _db.SaveChangesAsync();
    }

    public async Task<List<AuditLogDto>> GetForUserAsync(int userId, int take = 50)
    {
        return await _db.AuditLogs
            .AsNoTracking()
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.CreatedAt)
            .Take(take)
            .Select(a => new AuditLogDto(a.Id, a.EventType, a.Detail, a.IpAddress, a.CreatedAt))
            .ToListAsync();
    }
}