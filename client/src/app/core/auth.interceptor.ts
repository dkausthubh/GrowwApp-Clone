import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Attaches the current bearer token to outgoing requests and handles expired-session recovery.
 *
 * If a non-auth request fails with 401 and a refresh token is available, the interceptor
 * silently refreshes the session and retries the original request once. Auth endpoints
 * are excluded from this refresh flow to avoid retry loops during login and OTP verification.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token;

  // Attach the access token for authenticated requests so the backend can authorize them.
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      const isAuthEndpoint = req.url.includes('/auth/');

      if (err.status === 401 && !isAuthEndpoint && auth.refreshToken) {
        // Access token likely expired mid-session — try one silent refresh,
        // then retry the original request using the new token.
        return auth.refresh().pipe(
          switchMap(newAuth => {
            const retried = req.clone({ setHeaders: { Authorization: `Bearer ${newAuth.token}` } });
            return next(retried);
          }),
          catchError(refreshErr => {
            auth.logout();
            return throwError(() => refreshErr);
          })
        );
      }

      if (err.status === 401 && isAuthEndpoint) {
        auth.logout();
      }

      return throwError(() => err);
    })
  );
};