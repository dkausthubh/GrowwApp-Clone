using GrowwClone.Application.Trading;
using GrowwClone.Domain;
using Microsoft.EntityFrameworkCore;

namespace GrowwClone.Infrastructure.Services;

public class TradingService : ITradingService
{
    private readonly AppDbContext _db;

    /// <summary>
    /// Creates a trading service using the application's database context.
    /// </summary>
    /// <param name="db">The database context used to read and update trading data.</param>
    public TradingService(AppDbContext db) => _db = db;

    /// <summary>
    /// Validates and executes a buy or sell order in a database transaction.
    /// </summary>
    /// <param name="userId">The identifier of the user placing the order.</param>
    /// <param name="request">The instrument, side, and quantity for the order.</param>
    /// <returns>The result of the order, including the executed order details when successful.</returns>
    public async Task<OrderResult> PlaceOrderAsync(int userId, PlaceOrderRequest request)
    {
        if (request.Quantity <= 0)
            return new OrderResult(false, "Quantity must be greater than zero.", null);

        if (!Enum.TryParse<OrderSide>(request.Side, true, out var side))
            return new OrderResult(false, "Side must be 'Buy' or 'Sell'.", null);

        var instrument = await _db.Instruments.FindAsync(request.InstrumentId);
        if (instrument is null)
            return new OrderResult(false, "Instrument not found.", null);

        // EF Core's execution strategy wraps our manual transaction so retries
        // (e.g. transient SQL errors) replay the whole block safely.
        var strategy = _db.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync(async () =>
        {
            await using var tx = await _db.Database.BeginTransactionAsync();

            var wallet = await _db.Wallets.FirstAsync(w => w.UserId == userId);
            var price = instrument.LastPrice;
            var total = price * request.Quantity;

            var holding = await _db.Holdings
                .FirstOrDefaultAsync(h => h.UserId == userId && h.InstrumentId == instrument.Id);

            if (side == OrderSide.Buy)
            {
                if (wallet.Balance < total)
                {
                    await tx.RollbackAsync();
                    return new OrderResult(false, "Insufficient wallet balance.", null);
                }

                wallet.Balance -= total;
                _db.WalletTransactions.Add(new WalletTransaction
                {
                    WalletId = wallet.Id, Type = WalletTransactionType.Debit,
                    Amount = total, Description = $"Buy {request.Quantity} {instrument.Symbol}"
                });

                if (holding is null)
                {
                    holding = new Holding
                    {
                        UserId = userId, InstrumentId = instrument.Id,
                        Quantity = request.Quantity, AvgPrice = price
                    };
                    _db.Holdings.Add(holding);
                }
                else
                {
                    // weighted average price across old and new shares
                    var totalCost = holding.AvgPrice * holding.Quantity + total;
                    holding.Quantity += request.Quantity;
                    holding.AvgPrice = Math.Round(totalCost / holding.Quantity, 2);
                }
            }
            else // Sell
            {
                if (holding is null || holding.Quantity < request.Quantity)
                {
                    await tx.RollbackAsync();
                    return new OrderResult(false, "You don't own enough shares to sell.", null);
                }

                wallet.Balance += total;
                _db.WalletTransactions.Add(new WalletTransaction
                {
                    WalletId = wallet.Id, Type = WalletTransactionType.Credit,
                    Amount = total, Description = $"Sell {request.Quantity} {instrument.Symbol}"
                });

                holding.Quantity -= request.Quantity;
                if (holding.Quantity == 0)
                    _db.Holdings.Remove(holding);
                // AvgPrice is left unchanged on a partial sell — standard practice;
                // it only moves on new buys.
            }

            var order = new Order
            {
                UserId = userId, InstrumentId = instrument.Id, Side = side,
                Quantity = request.Quantity, Price = price, Status = OrderStatus.Executed
            };
            _db.Orders.Add(order);

            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            return new OrderResult(true, null, new OrderDto(
                order.Id, instrument.Id, instrument.Symbol, side.ToString(),
                request.Quantity, price, total, order.Status.ToString(), order.CreatedAt));
        });
    }

    /// <summary>
    /// Retrieves the user's executed orders, newest first.
    /// </summary>
    /// <param name="userId">The identifier of the user whose orders should be retrieved.</param>
    /// <returns>A list of order details belonging to the user.</returns>
    public async Task<List<OrderDto>> GetOrdersAsync(int userId)
    {
        return await _db.Orders
            .AsNoTracking()
            .Include(o => o.Instrument)
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new OrderDto(
                o.Id, o.InstrumentId, o.Instrument!.Symbol, o.Side.ToString(),
                o.Quantity, o.Price, o.Price * o.Quantity, o.Status.ToString(), o.CreatedAt))
            .ToListAsync();
    }

    /// <summary>
    /// Builds the user's portfolio with holdings, valuation, profit and loss, and wallet balance.
    /// </summary>
    /// <param name="userId">The identifier of the user whose portfolio should be retrieved.</param>
    /// <returns>The user's holdings and aggregated portfolio values.</returns>
    public async Task<PortfolioDto> GetPortfolioAsync(int userId)
    {
        var holdings = await _db.Holdings
            .AsNoTracking()
            .Include(h => h.Instrument)
            .Where(h => h.UserId == userId)
            .ToListAsync();

        var wallet = await _db.Wallets.AsNoTracking().FirstAsync(w => w.UserId == userId);

        var dtos = holdings.Select(h =>
        {
            var i = h.Instrument!;
            var invested = h.AvgPrice * h.Quantity;
            var current = i.LastPrice * h.Quantity;
            var pnl = Math.Round(current - invested, 2);
            var pnlPct = invested == 0 ? 0 : Math.Round(pnl / invested * 100, 2);
            return new HoldingDto(i.Id, i.Symbol, i.Name, h.Quantity, h.AvgPrice,
                i.LastPrice, invested, current, pnl, pnlPct);
        }).ToList();

        var totalInvested = dtos.Sum(d => d.InvestedValue);
        var totalCurrent = dtos.Sum(d => d.CurrentValue);
        var totalPnl = Math.Round(totalCurrent - totalInvested, 2);
        var totalPnlPct = totalInvested == 0 ? 0 : Math.Round(totalPnl / totalInvested * 100, 2);

        return new PortfolioDto(dtos, totalInvested, totalCurrent, totalPnl, totalPnlPct, wallet.Balance);
    }

    /// <summary>
    /// Retrieves the current wallet balance for a user.
    /// </summary>
    /// <param name="userId">The identifier of the user whose wallet should be retrieved.</param>
    /// <returns>The user's wallet balance.</returns>
    public async Task<WalletDto> GetWalletAsync(int userId)
    {
        var wallet = await _db.Wallets.AsNoTracking().FirstAsync(w => w.UserId == userId);
        return new WalletDto(wallet.Balance);
    }
}