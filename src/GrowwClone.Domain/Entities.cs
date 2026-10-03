namespace GrowwClone.Domain;

public class User
{
    public int Id { get; set; }
    public string FullName { get; set; } = "";
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Wallet? Wallet { get; set; }
}

public class Wallet
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public decimal Balance { get; set; }
    public User? User { get; set; }
    public List<WalletTransaction> Transactions { get; set; } = new();
}

public class WalletTransaction
{
    public int Id { get; set; }
    public int WalletId { get; set; }
    public WalletTransactionType Type { get; set; }
    public decimal Amount { get; set; }
    public string Description { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Instrument
{
    public int Id { get; set; }
    public string Symbol { get; set; } = "";
    public string Name { get; set; } = "";
    public InstrumentType Type { get; set; }
    public string Exchange { get; set; } = "NSE";
    public decimal LastPrice { get; set; }
    public decimal PrevClose { get; set; }
}

public class WatchlistItem
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int InstrumentId { get; set; }
    public Instrument? Instrument { get; set; }
}

public class Order
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int InstrumentId { get; set; }
    public OrderSide Side { get; set; }
    public int Quantity { get; set; }
    public decimal Price { get; set; }
    public OrderStatus Status { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Instrument? Instrument { get; set; }
}

public class Holding
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int InstrumentId { get; set; }
    public int Quantity { get; set; }
    public decimal AvgPrice { get; set; }
    public Instrument? Instrument { get; set; }
}
public class PriceAlert
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int InstrumentId { get; set; }
    public AlertCondition Condition { get; set; }
    public decimal TargetPrice { get; set; }
    public AlertStatus Status { get; set; } = AlertStatus.Active;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? TriggeredAt { get; set; }
    public Instrument? Instrument { get; set; }
}

public class Notification
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Message { get; set; } = "";
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
public class PriceHistory
{
    public long Id { get; set; }
    public int InstrumentId { get; set; }
    public decimal Price { get; set; }
    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
}