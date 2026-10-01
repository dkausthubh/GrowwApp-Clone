export interface AuthResponse {
  token: string;
  expiresAt: string;
  fullName: string;
  email: string;
}

export interface Instrument {
  id: number;
  symbol: string;
  name: string;
  type: string;
  exchange: string;
  lastPrice: number;
  prevClose: number;
  change: number;
  changePercent: number;
}
export interface WatchlistItem {
  id: number;
  instrument: Instrument;
}
export interface OrderRequest {
  instrumentId: number;
  side: 'Buy' | 'Sell';
  quantity: number;
}

export interface Order {
  id: number;
  instrumentId: number;
  symbol: string;
  side: string;
  quantity: number;
  price: number;
  total: number;
  status: string;
  createdAt: string;
}

export interface Holding {
  instrumentId: number;
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  lastPrice: number;
  investedValue: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
}

export interface Portfolio {
  holdings: Holding[];
  totalInvested: number;
  totalCurrent: number;
  totalPnl: number;
  totalPnlPercent: number;
  walletBalance: number;
}

export interface Wallet {
  balance: number;
}