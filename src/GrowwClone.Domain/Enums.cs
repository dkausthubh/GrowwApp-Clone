namespace GrowwClone.Domain;

public enum InstrumentType { Stock = 1, Etf = 2, MutualFund = 3 }
public enum OrderSide { Buy = 1, Sell = 2 }
public enum OrderStatus { Executed = 1, Rejected = 2 }
public enum WalletTransactionType { Credit = 1, Debit = 2 }