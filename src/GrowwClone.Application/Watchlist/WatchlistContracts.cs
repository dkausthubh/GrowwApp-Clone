using GrowwClone.Application.Market;

namespace GrowwClone.Application.Watchlist;

public record WatchlistItemDto(int Id, InstrumentDto Instrument);

public interface IWatchlistService
{
    Task<List<WatchlistItemDto>> GetAsync(int userId);
    Task<bool> AddAsync(int userId, int instrumentId);
    Task<bool> RemoveAsync(int userId, int instrumentId);
}