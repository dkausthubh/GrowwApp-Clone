namespace GrowwClone.Application.Audit;

/// <summary>
/// Represents an audit entry returned to API consumers.
/// </summary>
/// <param name="Id">The persisted audit log identifier.</param>
/// <param name="EventType">The type of event that occurred.</param>
/// <param name="Detail">Human-readable details for the event.</param>
/// <param name="IpAddress">Optional client IP address associated with the event.</param>
/// <param name="CreatedAt">When the audit event was recorded.</param>
public record AuditLogDto(long Id, string EventType, string Detail, string? IpAddress, DateTime CreatedAt);

/// <summary>
/// Write-side audit abstraction used by application services such as authentication and trading flows.
/// This interface is intentionally limited to command-style writes so callers can emit audit events
/// without depending on retrieval or query concerns.
/// </summary>
public interface IAuditLogger
{
    /// <summary>
    /// Records an audit event for the supplied user and request context.
    /// </summary>
    /// <param name="userId">Optional identifier of the user initiating the action.</param>
    /// <param name="eventType">The event category to store, such as login or trade.</param>
    /// <param name="detail">A descriptive message about what happened.</param>
    /// <param name="ipAddress">Optional client IP address captured for the event.</param>
    Task LogAsync(int? userId, string eventType, string detail, string? ipAddress = null);
}

/// <summary>
/// Read-side audit abstraction used by presentation/controller layers.
/// Keeping this separate from <see cref="IAuditLogger"/> follows a small command/query split:
/// write operations are tracked by services, while reads are handled by controllers or query endpoints.
/// </summary>
public interface IAuditLogService
{
    /// <summary>
    /// Retrieves the most recent audit entries for a specific user.
    /// </summary>
    /// <param name="userId">The user whose audit history should be returned.</param>
    /// <param name="take">Maximum number of recent entries to retrieve.</param>
    /// <returns>A list of recent audit records ordered by recency as defined by the implementation.</returns>
    Task<List<AuditLogDto>> GetForUserAsync(int userId, int take = 50);
}