import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './api.config';
import { Order, OrderRequest, Portfolio, Wallet } from './models';

/**
 * Service for creating trades and retrieving portfolio-related data.
 */
@Injectable({ providedIn: 'root' })
export class TradingService {
  private http = inject(HttpClient);

  /**
   * Places a new buy or sell order.
   */
  placeOrder(req: OrderRequest) {
    return this.http.post<Order>(`${API_URL}/orders`, req);
  }

  /**
   * Fetches the user’s recent order history.
   */
  getOrders() {
    return this.http.get<Order[]>(`${API_URL}/orders`);
  }

  /**
   * Retrieves the current portfolio snapshot and holdings summary.
   */
  getPortfolio() {
    return this.http.get<Portfolio>(`${API_URL}/portfolio`);
  }

  /**
   * Fetches the user wallet balance.
   */
  getWallet() {
    return this.http.get<Wallet>(`${API_URL}/wallet`);
  }
}