import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { API_URL } from './api.config';
import { AuthResponse, LoginChallengeResponse, MfaChallenge } from './models';

/**
 * Central auth state manager for the client app.
 *
 * This service owns the current session, tracks whether the token is still valid,
 * and exposes helpers for registering, logging in, verifying OTP, refreshing tokens,
 * and clearing the session during logout.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  /** Local storage key used to persist the authenticated session on the client. */
  private readonly KEY = 'gc_auth';

  /** Signal-backed session state loaded from local storage on startup. */
  private _user = signal<AuthResponse | null>(this.load());

  /** Read-only view of the current user/session state. */
  user = this._user.asReadonly();

  /** Returns true while a valid non-expired access token is present. */
  isLoggedIn = computed(() => {
    const u = this._user();
    return !!u && new Date(u.expiresAt) > new Date();
  });

  /** Current bearer token, or null if no active session exists. */
  get token(): string | null {
    return this._user()?.token ?? null;
  }

  /** Current refresh token used for silent re-authentication. */
  get refreshToken(): string | null {
    return this._user()?.refreshToken ?? null;
  }

  /**
   * Registers a new user account.
   * Successful responses are immediately persisted in local storage.
   */
  register(body: { fullName: string; email: string; password: string }) {
    return this.http.post<AuthResponse>(`${API_URL}/auth/register`, body)
      .pipe(tap(r => this.save(r)));
  }

  /** Step 1: password check. Returns the MFA challenge, not a session. */
  login(body: { email: string; password: string }): Observable<LoginChallengeResponse> {
    return this.http.post<LoginChallengeResponse>(`${API_URL}/auth/login`, body);
  }

  /** Step 2: OTP validation. On success, the session is established. */
  verifyOtp(mfaToken: string, code: string) {
    return this.http.post<AuthResponse>(`${API_URL}/auth/verify-otp`, { mfaToken, code })
      .pipe(tap(r => this.save(r)));
  }

  /**
   * Exchanges the stored refresh token for a new access token.
   * This is used when the access token expires while the user remains active.
   */
  refresh() {
    return this.http.post<AuthResponse>(`${API_URL}/auth/refresh`, { refreshToken: this.refreshToken })
      .pipe(tap(r => this.save(r)));
  }

  /**
   * Clears the client session and signs the user out.
   *
   * The UI navigates to /login immediately, while the backend logout call is
   * attempted in the background as a best-effort server-side cleanup.
   */
  logout() {
    const rt = this.refreshToken;
    localStorage.removeItem(this.KEY);
    this._user.set(null);
    this.router.navigate(['/login']);
    if (rt) {
      // Best-effort server-side revoke; the UI does not block on this response.
      this.http.post(`${API_URL}/auth/logout`, { refreshToken: rt }).subscribe({ error: () => {} });
    }
  }

  /** Persists the auth payload to local storage and updates the reactive session state. */
  private save(r: AuthResponse) {
    localStorage.setItem(this.KEY, JSON.stringify(r));
    this._user.set(r);
  }

  /** Reads the session from storage if it exists and returns null if parsing fails. */
  private load(): AuthResponse | null {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}