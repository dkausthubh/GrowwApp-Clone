import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_URL } from './api.config';
import { Instrument, PricePoint } from './models';

/**
 * Gateway for all instrument browsing and historical price queries.
 *
 * This service keeps UI components decoupled from the raw API contracts while
 * centralizing query parameters like search text and chart window size.
 */
@Injectable({ providedIn: 'root' })
export class MarketService {
  private http = inject(HttpClient);

  /**
   * Fetches instruments, optionally filtered by a search query.
   * Used for listings and discovery views such as the market explorer.
   */
  getAll(search?: string) {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http.get<Instrument[]>(`${API_URL}/instruments`, { params });
  }

  /**
   * Retrieves the details for a single instrument.
   * This is typically used on the instrument detail page.
   */
  getById(id: number) {
    return this.http.get<Instrument>(`${API_URL}/instruments/${id}`);
  }

  /**
   * Loads historical price points for a chart over a time window.
   * The default window is 30 minutes, but callers can request a different range.
   */
  getHistory(id: number, minutes = 30) {
    const params = new HttpParams().set('minutes', minutes);
    return this.http.get<PricePoint[]>(`${API_URL}/instruments/${id}/history`, { params });
  }
}