using GrowwClone.Application.Market;
using GrowwClone.Application.Watchlist;
using GrowwClone.Domain;
using Microsoft.EntityFrameworkCore;

namespace GrowwClone.Infrastructure.Services;

public class WatchlistService : IWatchlistService
{
    private readonly AppDbContext _db;
    public WatchlistService(AppDbContext db) => _db = db;

    public async Task<List<WatchlistItemDto>> GetAsync(int userId)
    {
        var items = await _db.Watchlists
            .AsNoTracking()
            .Include(w => w.Instrument)
            .Where(w => w.UserId == userId)
            .OrderBy(w => w.Instrument!.Symbol)
            .ToListAsync();

        return items.Select(w =>
        {
            var i = w.Instrument!;
            var change = i.LastPrice - i.PrevClose;
            var pct = i.PrevClose == 0 ? 0 : Math.Round(change / i.PrevClose * 100, 2);
            var dto = new InstrumentDto(i.Id, i.Symbol, i.Name, i.Type.ToString(), i.Exchange,
                i.LastPrice, i.PrevClose, Math.Round(change, 2), pct);
            return new WatchlistItemDto(w.Id, dto);
        }).ToList();
    }

    public async Task<bool> AddAsync(int userId, int instrumentId)
    {
        var exists = await _db.Watchlists.AnyAsync(w => w.UserId == userId && w.InstrumentId == instrumentId);
        if (exists) return true;   // already there, treat as success

        var instrumentExists = await _db.Instruments.AnyAsync(i => i.Id == instrumentId);
        if (!instrumentExists) return false;

        _db.Watchlists.Add(new WatchlistItem { UserId = userId, InstrumentId = instrumentId });
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RemoveAsync(int userId, int instrumentId)
    {
        var item = await _db.Watchlists.FirstOrDefaultAsync(w => w.UserId == userId && w.InstrumentId == instrumentId);
        if (item is null) return false;

        _db.Watchlists.Remove(item);
        await _db.SaveChangesAsync();
        return true;
    }
}