using GrowwClone.Application.Market;
using GrowwClone.Domain;
using Microsoft.EntityFrameworkCore;

namespace GrowwClone.Infrastructure.Services;

public class MarketService : IMarketService
{
    private readonly AppDbContext _db;
    public MarketService(AppDbContext db) => _db = db;

    public async Task<List<InstrumentDto>> GetInstrumentsAsync(string? search, string? type)
    {
        var query = _db.Instruments.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            query = query.Where(i => i.Symbol.Contains(s) || i.Name.Contains(s));
        }

        if (!string.IsNullOrWhiteSpace(type) &&
            Enum.TryParse<InstrumentType>(type, true, out var parsed))
        {
            query = query.Where(i => i.Type == parsed);
        }

        var items = await query.OrderBy(i => i.Symbol).ToListAsync();
        return items.Select(ToDto).ToList();
    }

    public async Task<InstrumentDto?> GetByIdAsync(int id)
    {
        var item = await _db.Instruments.AsNoTracking().FirstOrDefaultAsync(i => i.Id == id);
        return item is null ? null : ToDto(item);
    }

    private static InstrumentDto ToDto(Instrument i)
    {
        var change = i.LastPrice - i.PrevClose;
        var pct = i.PrevClose == 0 ? 0 : Math.Round(change / i.PrevClose * 100, 2);
        return new InstrumentDto(i.Id, i.Symbol, i.Name, i.Type.ToString(), i.Exchange,
            i.LastPrice, i.PrevClose, Math.Round(change, 2), pct);
    }
    public async Task<List<PricePointDto>> GetHistoryAsync(int instrumentId, int minutes)
    {
        var since = DateTime.UtcNow.AddMinutes(-minutes);
        return await _db.PriceHistory
            .AsNoTracking()
            .Where(p => p.InstrumentId == instrumentId && p.RecordedAt >= since)
            .OrderBy(p => p.RecordedAt)
            .Select(p => new PricePointDto(p.RecordedAt, p.Price))
            .ToListAsync();
    }
}