import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './api.config';
import { Order, OrderRequest, Portfolio, Wallet } from './models';

@Injectable({ providedIn: 'root' })
export class TradingService {
  private http = inject(HttpClient);

  placeOrder(req: OrderRequest) {
    return this.http.post<Order>(`${API_URL}/orders`, req);
  }
  getOrders() {
    return this.http.get<Order[]>(`${API_URL}/orders`);
  }
  getPortfolio() {
    return this.http.get<Portfolio>(`${API_URL}/portfolio`);
  }
  getWallet() {
    return this.http.get<Wallet>(`${API_URL}/wallet`);
  }
}