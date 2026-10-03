import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_URL } from './api.config';
import { Instrument, PricePoint } from './models';

@Injectable({ providedIn: 'root' })
export class MarketService {
  private http = inject(HttpClient);

  getAll(search?: string) {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http.get<Instrument[]>(`${API_URL}/instruments`, { params });
  }

  getById(id: number) {
    return this.http.get<Instrument>(`${API_URL}/instruments/${id}`);
  }

  getHistory(id: number, minutes = 30) {
    const params = new HttpParams().set('minutes', minutes);
    return this.http.get<PricePoint[]>(`${API_URL}/instruments/${id}/history`, { params });
  }
}