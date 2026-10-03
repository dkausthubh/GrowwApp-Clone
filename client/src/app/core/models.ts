/**
 * Authentication payload returned by the backend after login or registration.
 */
export interface AuthResponse {
  token: string;
  expiresAt: string;
  fullName: string;
  email: string;
}

/**
 * Represents a market instrument available for viewing, trading, or watchlisting.
 */
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

/**
 * A watchlist entry linking a user to a tracked instrument.
 */
export interface WatchlistItem {
  id: number;
  instrument: Instrument;
}

/**
 * Request payload used when creating a new trade order.
 */
export interface OrderRequest {
  instrumentId: number;
  side: 'Buy' | 'Sell';
  quantity: number;
}

/**
 * A trade order recorded by the backend.
 */
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

/**
 * Summary of a user’s holding in a single instrument.
 */
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

/**
 * Aggregate portfolio values used for dashboard and investing summaries.
 */
export interface Portfolio {
  holdings: Holding[];
  totalInvested: number;
  totalCurrent: number;
  totalPnl: number;
  totalPnlPercent: number;
  walletBalance: number;
}

/**
 * Represents the user’s wallet balance available for transactions.
 */
export interface Wallet {
  balance: number;
}

/**
 * Payload used to create a new price alert for an instrument.
 */
export interface CreateAlertRequest {
  instrumentId: number;
  condition: 'Above' | 'Below';
  targetPrice: number;
}

/**
 * Alert details returned by the backend after creation or retrieval.
 */
export interface Alert {
  id: number;
  instrumentId: number;
  symbol: string;
  condition: string;
  targetPrice: number;
  status: string;
  createdAt: string;
  triggeredAt: string | null;
}

/**
 * A user-facing notification generated from alert or trading activity.
 */
export interface Notification {
  id: number;
  message: string;
  isRead: boolean;
  createdAt: string;
}
export interface PricePoint {
  recordedAt: string;
  price: number;
}