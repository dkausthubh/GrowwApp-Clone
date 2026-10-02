namespace GrowwClone.Application.Alerts;

/// <summary>
/// Represents the payload required to create a new price alert for an instrument.
/// </summary>
/// <param name="InstrumentId">The unique identifier of the instrument being monitored.</param>
/// <param name="Condition">The comparison condition used to evaluate the alert, such as above or below.</param>
/// <param name="TargetPrice">The price threshold that triggers the alert.</param>
public record CreateAlertRequest(int InstrumentId, string Condition, decimal TargetPrice);

/// <summary>
/// Represents a persisted alert with its current state and trigger metadata.
/// </summary>
/// <param name="Id">Unique identifier of the alert.</param>
/// <param name="InstrumentId">Instrument associated with the alert.</param>
/// <param name="Symbol">Ticker symbol of the instrument for display purposes.</param>
/// <param name="Condition">Alert condition that will be checked against market price.</param>
/// <param name="TargetPrice">Price value that activates the alert.</param>
/// <param name="Status">Current state of the alert, such as active or cancelled.</param>
/// <param name="CreatedAt">When the alert was created.</param>
/// <param name="TriggeredAt">When the alert was triggered, if it has fired.</param>
public record AlertDto(
    int Id, int InstrumentId, string Symbol, string Condition,
    decimal TargetPrice, string Status, DateTime CreatedAt, DateTime? TriggeredAt);

/// <summary>
/// Represents a notification generated for the user related to alert activity.
/// </summary>
/// <param name="Id">Unique notification identifier.</param>
/// <param name="Message">Human-readable alert or system message.</param>
/// <param name="IsRead">Indicates whether the notification has been marked as read by the user.</param>
/// <param name="CreatedAt">When the notification was created.</param>
public record NotificationDto(int Id, string Message, bool IsRead, DateTime CreatedAt);

/// <summary>
/// Encapsulates the outcome of an alert operation, including any validation or processing error.
/// </summary>
/// <param name="Success">True when the operation completed successfully.</param>
/// <param name="Error">Error message returned when the operation fails.</param>
/// <param name="Alert">The created or retrieved alert when the operation produces one.</param>
public record AlertResult(bool Success, string? Error, AlertDto? Alert);

/// <summary>
/// Defines the contract for creating, listing, cancelling, and managing user alerts and their notifications.
/// </summary>
public interface IAlertService
{
    /// <summary>
    /// Creates a new alert for the specified user.
    /// </summary>
    /// <param name="userId">The identifier of the user creating the alert.</param>
    /// <param name="request">The alert configuration to persist.</param>
    /// <returns>A result object describing the success or failure of the creation request.</returns>
    Task<AlertResult> CreateAsync(int userId, CreateAlertRequest request);

    /// <summary>
    /// Retrieves all active and historical alerts for a user.
    /// </summary>
    /// <param name="userId">The identifier of the user whose alerts are requested.</param>
    /// <returns>A list of alert details sorted by the application’s normal retrieval order.</returns>
    Task<List<AlertDto>> GetAlertsAsync(int userId);

    /// <summary>
    /// Cancels an alert owned by the user.
    /// </summary>
    /// <param name="userId">The user attempting to cancel the alert.</param>
    /// <param name="alertId">The alert identifier to cancel.</param>
    /// <returns>True when the alert was successfully cancelled; otherwise false.</returns>
    Task<bool> CancelAsync(int userId, int alertId);

    /// <summary>
    /// Retrieves notifications relevant to the user’s alert activity.
    /// </summary>
    /// <param name="userId">The identifier of the user whose notifications are requested.</param>
    /// <returns>A list of notification records for the user.</returns>
    Task<List<NotificationDto>> GetNotificationsAsync(int userId);

    /// <summary>
    /// Marks all notifications as read for the specified user.
    /// </summary>
    /// <param name="userId">The identifier of the user updating notification state.</param>
    Task MarkAllReadAsync(int userId);
}