import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { API_URL } from './api.config';
import { AuthResponse } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly KEY = 'gc_auth';

  private _user = signal<AuthResponse | null>(this.load());
  user = this._user.asReadonly();
  isLoggedIn = computed(() => {
    const u = this._user();
    return !!u && new Date(u.expiresAt) > new Date();
  });

  get token(): string | null {
    return this._user()?.token ?? null;
  }

  login(body: { email: string; password: string }) {
    return this.http.post<AuthResponse>(`${API_URL}/auth/login`, body)
      .pipe(tap(r => this.save(r)));
  }

  register(body: { fullName: string; email: string; password: string }) {
    return this.http.post<AuthResponse>(`${API_URL}/auth/register`, body)
      .pipe(tap(r => this.save(r)));
  }

  logout() {
    localStorage.removeItem(this.KEY);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  private save(r: AuthResponse) {
    localStorage.setItem(this.KEY, JSON.stringify(r));
    this._user.set(r);
  }

  private load(): AuthResponse | null {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}