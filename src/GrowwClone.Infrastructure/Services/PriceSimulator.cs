using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace GrowwClone.Infrastructure.Services;

// Simulates live market data by nudging each price by up to ±0.5% every 5 seconds.
public class PriceSimulator : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly Random _rng = new();

    public PriceSimulator(IServiceScopeFactory scopeFactory) => _scopeFactory = scopeFactory;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                var instruments = await db.Instruments.ToListAsync(stoppingToken);
                foreach (var i in instruments)
                {
                    var pct = (decimal)(_rng.NextDouble() * 0.01 - 0.005);   // -0.5% .. +0.5%
                    var newPrice = Math.Round(i.LastPrice * (1 + pct), 2);
                    i.LastPrice = Math.Max(newPrice, 1m);
                }
                await db.SaveChangesAsync(stoppingToken);
            }
            catch (OperationCanceledException) { break; }
            catch { /* keep the simulator alive; log in a real app */ }

            await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
        }
    }
}