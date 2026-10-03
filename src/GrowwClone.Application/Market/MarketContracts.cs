namespace GrowwClone.Application.Market;

public record InstrumentDto(
    int Id,
    string Symbol,
    string Name,
    string Type,
    string Exchange,
    decimal LastPrice,
    decimal PrevClose,
    decimal Change,
    decimal ChangePercent);
public record PricePointDto(DateTime RecordedAt, decimal Price);
public interface IMarketService
{
    Task<List<InstrumentDto>> GetInstrumentsAsync(string? search, string? type);
    Task<InstrumentDto?> GetByIdAsync(int id);
    Task<List<PricePointDto>> GetHistoryAsync(int instrumentId, int minutes);
}