using GrowwClone.Application.Alerts;
using Microsoft.AspNetCore.Mvc;

namespace GrowwClone.Api.Controllers;

[Route("api")]
public class AlertsController : ApiControllerBase
{
    private readonly IAlertService _alerts;
    public AlertsController(IAlertService alerts) => _alerts = alerts;

    [HttpPost("alerts")]
    public async Task<IActionResult> Create(CreateAlertRequest request)
    {
        var result = await _alerts.CreateAsync(UserId, request);
        return result.Success ? Ok(result.Alert) : BadRequest(new { error = result.Error });
    }

    [HttpGet("alerts")]
    public async Task<IActionResult> GetAll() => Ok(await _alerts.GetAlertsAsync(UserId));

    [HttpDelete("alerts/{id:int}")]
    public async Task<IActionResult> Cancel(int id)
    {
        var ok = await _alerts.CancelAsync(UserId, id);
        return ok ? Ok() : NotFound();
    }

    [HttpGet("notifications")]
    public async Task<IActionResult> GetNotifications() => Ok(await _alerts.GetNotificationsAsync(UserId));

    [HttpPost("notifications/mark-read")]
    public async Task<IActionResult> MarkAllRead()
    {
        await _alerts.MarkAllReadAsync(UserId);
        return Ok();
    }
}