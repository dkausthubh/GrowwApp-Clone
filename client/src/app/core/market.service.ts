import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_URL } from './api.config';
import { Instrument } from './models';

@Injectable({ providedIn: 'root' })
export class MarketService {
  private http = inject(HttpClient);

  getAll(search?: string) {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http.get<Instrument[]>(`${API_URL}/instruments`, { params });
  }
}