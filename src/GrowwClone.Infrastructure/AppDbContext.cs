using GrowwClone.Domain;
using Microsoft.EntityFrameworkCore;

namespace GrowwClone.Infrastructure;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Wallet> Wallets => Set<Wallet>();
    public DbSet<WalletTransaction> WalletTransactions => Set<WalletTransaction>();
    public DbSet<Instrument> Instruments => Set<Instrument>();
    public DbSet<WatchlistItem> Watchlists => Set<WatchlistItem>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<Holding> Holdings => Set<Holding>();
    public DbSet<PriceAlert> PriceAlerts => Set<PriceAlert>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<PriceHistory> PriceHistory => Set<PriceHistory>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>().HasIndex(u => u.Email).IsUnique();
        b.Entity<User>().HasOne(u => u.Wallet).WithOne(w => w.User).HasForeignKey<Wallet>(w => w.UserId);

        b.Entity<Wallet>().Property(w => w.Balance).HasPrecision(18, 2);
        b.Entity<WalletTransaction>().Property(t => t.Amount).HasPrecision(18, 2);

        b.Entity<Instrument>().HasIndex(i => i.Symbol).IsUnique();
        b.Entity<Instrument>().Property(i => i.LastPrice).HasPrecision(18, 2);
        b.Entity<Instrument>().Property(i => i.PrevClose).HasPrecision(18, 2);

        b.Entity<WatchlistItem>().HasIndex(w => new { w.UserId, w.InstrumentId }).IsUnique();
        b.Entity<Holding>().HasIndex(h => new { h.UserId, h.InstrumentId }).IsUnique();
        b.Entity<Holding>().Property(h => h.AvgPrice).HasPrecision(18, 2);
        b.Entity<Order>().Property(o => o.Price).HasPrecision(18, 2);

        b.Entity<Instrument>().HasData(
            Seed(1, "RELIANCE", "Reliance Industries", 2900m),
            Seed(2, "TCS", "Tata Consultancy Services", 3900m),
            Seed(3, "INFY", "Infosys", 1650m),
            Seed(4, "HDFCBANK", "HDFC Bank", 1600m),
            Seed(5, "ICICIBANK", "ICICI Bank", 1150m),
            Seed(6, "SBIN", "State Bank of India", 800m),
            Seed(7, "ITC", "ITC Ltd", 470m),
            Seed(8, "WIPRO", "Wipro", 520m));

        b.Entity<PriceAlert>().Property(a => a.TargetPrice).HasPrecision(18, 2);
        b.Entity<PriceAlert>().HasIndex(a => new { a.UserId, a.Status });
        b.Entity<Notification>().HasIndex(n => new { n.UserId, n.IsRead });
        b.Entity<PriceHistory>().Property(p => p.Price).HasPrecision(18, 2);
        b.Entity<PriceHistory>().HasIndex(p => new { p.InstrumentId, p.RecordedAt });
        b.Entity<RefreshToken>().HasIndex(r => r.TokenHash).IsUnique();
        b.Entity<RefreshToken>().HasIndex(r => r.UserId);
    }

    private static Instrument Seed(int id, string symbol, string name, decimal price) => new()
    {
        Id = id, Symbol = symbol, Name = name, Type = InstrumentType.Stock,
        Exchange = "NSE", LastPrice = price, PrevClose = price
    };
}