using GrowwClone.Application.Market;

namespace GrowwClone.Application.Trading;

public record PlaceOrderRequest(int InstrumentId, string Side, int Quantity);

public record OrderDto(
    int Id, int InstrumentId, string Symbol, string Side,
    int Quantity, decimal Price, decimal Total, string Status, DateTime CreatedAt);

public record HoldingDto(
    int InstrumentId, string Symbol, string Name,
    int Quantity, decimal AvgPrice, decimal LastPrice,
    decimal InvestedValue, decimal CurrentValue, decimal Pnl, decimal PnlPercent);

public record PortfolioDto(
    List<HoldingDto> Holdings, decimal TotalInvested, decimal TotalCurrent,
    decimal TotalPnl, decimal TotalPnlPercent, decimal WalletBalance);

public record WalletDto(decimal Balance);

public record OrderResult(bool Success, string? Error, OrderDto? Order);

public interface ITradingService
{
    Task<OrderResult> PlaceOrderAsync(int userId, PlaceOrderRequest request);
    Task<List<OrderDto>> GetOrdersAsync(int userId);
    Task<PortfolioDto> GetPortfolioAsync(int userId);
    Task<WalletDto> GetWalletAsync(int userId);
}