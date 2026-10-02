using GrowwClone.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace GrowwClone.Infrastructure.Services;

// Checks active price alerts against current prices every 5 seconds (same
// cadence as PriceSimulator, so an alert fires within one price tick).
public class AlertChecker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    public AlertChecker(IServiceScopeFactory scopeFactory) => _scopeFactory = scopeFactory;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                var activeAlerts = await db.PriceAlerts
                    .Include(a => a.Instrument)
                    .Where(a => a.Status == AlertStatus.Active)
                    .ToListAsync(stoppingToken);

                foreach (var alert in activeAlerts)
                {
                    var price = alert.Instrument!.LastPrice;
                    var hit = alert.Condition == AlertCondition.Above
                        ? price >= alert.TargetPrice
                        : price <= alert.TargetPrice;

                    if (!hit) continue;

                    alert.Status = AlertStatus.Triggered;
                    alert.TriggeredAt = DateTime.UtcNow;

                    db.Notifications.Add(new Notification
                    {
                        UserId = alert.UserId,
                        Message = $"{alert.Instrument.Symbol} {(alert.Condition == AlertCondition.Above ? "crossed above" : "fell below")} ₹{alert.TargetPrice:N2} (now ₹{price:N2})"
                    });
                }

                if (activeAlerts.Any(a => a.Status == AlertStatus.Triggered))
                    await db.SaveChangesAsync(stoppingToken);
            }
            catch (OperationCanceledException) { break; }
            catch { /* keep running; log in a real app */ }

            await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
        }
    }
}