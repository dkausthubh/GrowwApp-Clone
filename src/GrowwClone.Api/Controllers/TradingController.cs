using GrowwClone.Application.Trading;
using Microsoft.AspNetCore.Mvc;

namespace GrowwClone.Api.Controllers;

[Route("api")]
public class TradingController : ApiControllerBase
{
    private readonly ITradingService _trading;
    public TradingController(ITradingService trading) => _trading = trading;

    [HttpPost("orders")]
    public async Task<IActionResult> PlaceOrder(PlaceOrderRequest request)
    {
        var result = await _trading.PlaceOrderAsync(UserId, request);
        return result.Success ? Ok(result.Order) : BadRequest(new { error = result.Error });
    }

    [HttpGet("orders")]
    public async Task<IActionResult> GetOrders() => Ok(await _trading.GetOrdersAsync(UserId));

    [HttpGet("portfolio")]
    public async Task<IActionResult> GetPortfolio() => Ok(await _trading.GetPortfolioAsync(UserId));

    [HttpGet("wallet")]
    public async Task<IActionResult> GetWallet() => Ok(await _trading.GetWalletAsync(UserId));
}