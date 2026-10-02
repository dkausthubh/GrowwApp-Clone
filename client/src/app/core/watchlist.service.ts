import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './api.config';
import { WatchlistItem } from './models';

/**
 * Service for retrieving and updating the user's watchlist.
 */
@Injectable({ providedIn: 'root' })
export class WatchlistService {
  private http = inject(HttpClient);

  /**
   * Returns all instruments currently on the user’s watchlist.
   */
  getAll() {
    return this.http.get<WatchlistItem[]>(`${API_URL}/watchlist`);
  }

  /**
   * Adds an instrument to the watchlist.
   */
  add(instrumentId: number) {
    return this.http.post(`${API_URL}/watchlist/${instrumentId}`, {});
  }

  /**
   * Removes an instrument from the watchlist.
   */
  remove(instrumentId: number) {
    return this.http.delete(`${API_URL}/watchlist/${instrumentId}`);
  }
}