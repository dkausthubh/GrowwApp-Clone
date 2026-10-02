import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { API_URL } from './api.config';
import { AuthResponse } from './models';

/**
 * Central auth service for logging in, registering, persisting the authenticated session,
 * and checking whether the current user token is still valid.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly KEY = 'gc_auth';

  /**
   * Stores the current auth payload in a signal so components can reactively read it.
   */
  private _user = signal<AuthResponse | null>(this.load());
  user = this._user.asReadonly();

  /**
   * Returns true when the stored token is present and has not expired yet.
   */
  isLoggedIn = computed(() => {
    const u = this._user();
    return !!u && new Date(u.expiresAt) > new Date();
  });

  /**
   * Returns the active bearer token, if one is currently available.
   */
  get token(): string | null {
    return this._user()?.token ?? null;
  }

  /**
   * Authenticates a user with email and password.
   */
  login(body: { email: string; password: string }) {
    return this.http.post<AuthResponse>(`${API_URL}/auth/login`, body)
      .pipe(tap(r => this.save(r)));
  }

  /**
   * Registers a new user and automatically stores the returned auth session.
   */
  register(body: { fullName: string; email: string; password: string }) {
    return this.http.post<AuthResponse>(`${API_URL}/auth/register`, body)
      .pipe(tap(r => this.save(r)));
  }

  /**
   * Clears the persisted auth state and sends the user back to the login screen.
   */
  logout() {
    localStorage.removeItem(this.KEY);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  /**
   * Persists the response from the backend and updates the in-memory auth state.
   */
  private save(r: AuthResponse) {
    localStorage.setItem(this.KEY, JSON.stringify(r));
    this._user.set(r);
  }

  /**
   * Restores the auth payload from local storage when the app is reloaded.
   */
  private load(): AuthResponse | null {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}