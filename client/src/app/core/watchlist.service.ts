import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './api.config';
import { WatchlistItem } from './models';

@Injectable({ providedIn: 'root' })
export class WatchlistService {
  private http = inject(HttpClient);

  getAll() {
    return this.http.get<WatchlistItem[]>(`${API_URL}/watchlist`);
  }
  add(instrumentId: number) {
    return this.http.post(`${API_URL}/watchlist/${instrumentId}`, {});
  }
  remove(instrumentId: number) {
    return this.http.delete(`${API_URL}/watchlist/${instrumentId}`);
  }
}