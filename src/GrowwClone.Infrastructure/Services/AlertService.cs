using GrowwClone.Application.Alerts;
using GrowwClone.Domain;
using Microsoft.EntityFrameworkCore;

namespace GrowwClone.Infrastructure.Services;

public class AlertService : IAlertService
{
    private readonly AppDbContext _db;
    public AlertService(AppDbContext db) => _db = db;

    public async Task<AlertResult> CreateAsync(int userId, CreateAlertRequest request)
    {
        if (request.TargetPrice <= 0)
            return new AlertResult(false, "Target price must be greater than zero.", null);

        if (!Enum.TryParse<AlertCondition>(request.Condition, true, out var condition))
            return new AlertResult(false, "Condition must be 'Above' or 'Below'.", null);

        var instrument = await _db.Instruments.FindAsync(request.InstrumentId);
        if (instrument is null)
            return new AlertResult(false, "Instrument not found.", null);

        var alert = new PriceAlert
        {
            UserId = userId,
            InstrumentId = instrument.Id,
            Condition = condition,
            TargetPrice = request.TargetPrice,
            Status = AlertStatus.Active
        };
        _db.PriceAlerts.Add(alert);
        await _db.SaveChangesAsync();

        return new AlertResult(true, null, ToDto(alert, instrument.Symbol));
    }

    public async Task<List<AlertDto>> GetAlertsAsync(int userId)
    {
        return await _db.PriceAlerts
            .AsNoTracking()
            .Include(a => a.Instrument)
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new AlertDto(a.Id, a.InstrumentId, a.Instrument!.Symbol,
                a.Condition.ToString(), a.TargetPrice, a.Status.ToString(), a.CreatedAt, a.TriggeredAt))
            .ToListAsync();
    }

    public async Task<bool> CancelAsync(int userId, int alertId)
    {
        var alert = await _db.PriceAlerts.FirstOrDefaultAsync(a => a.Id == alertId && a.UserId == userId);
        if (alert is null || alert.Status != AlertStatus.Active) return false;

        alert.Status = AlertStatus.Cancelled;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<List<NotificationDto>> GetNotificationsAsync(int userId)
    {
        return await _db.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .Select(n => new NotificationDto(n.Id, n.Message, n.IsRead, n.CreatedAt))
            .ToListAsync();
    }

    public async Task MarkAllReadAsync(int userId)
    {
        await _db.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));
    }

    private static AlertDto ToDto(PriceAlert a, string symbol) =>
        new(a.Id, a.InstrumentId, symbol, a.Condition.ToString(), a.TargetPrice,
            a.Status.ToString(), a.CreatedAt, a.TriggeredAt);
}