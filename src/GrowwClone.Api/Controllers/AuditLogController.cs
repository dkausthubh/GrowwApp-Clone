using GrowwClone.Application.Audit;
using Microsoft.AspNetCore.Mvc;

namespace GrowwClone.Api.Controllers;

[Route("api/audit-logs")]
public class AuditLogController : ApiControllerBase
{
    private readonly IAuditLogService _audit;
    public AuditLogController(IAuditLogService audit) => _audit = audit;

    [HttpGet]
    public async Task<IActionResult> Get() => Ok(await _audit.GetForUserAsync(UserId));
}