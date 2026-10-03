import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/auth.service';

type Step = 'credentials' | 'otp';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <div class="wrap">
      <mat-card class="card">

        @if (step() === 'credentials') {
          <h2>{{ isRegister() ? 'Create your account' : 'Welcome to Groww Clone' }}</h2>
          <p class="sub">Simple, free investing (paper trading, virtual money)</p>

          <form [formGroup]="credForm" (ngSubmit)="submitCredentials()">
            @if (isRegister()) {
              <mat-form-field appearance="outline">
                <mat-label>Full name</mat-label>
                <input matInput formControlName="fullName" />
                <mat-error>Name is required</mat-error>
              </mat-form-field>
            }

            <mat-form-field appearance="outline">
              <mat-label>Email address</mat-label>
              <input matInput type="email" formControlName="email" />
              <mat-error>Enter a valid email</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="password" />
              <mat-error>Minimum 6 characters</mat-error>
            </mat-form-field>

            @if (error()) { <div class="error">{{ error() }}</div> }

            <button mat-flat-button class="go" type="submit" [disabled]="loading()">
              {{ loading() ? 'Please wait...' : (isRegister() ? 'Register' : 'Continue') }}
            </button>
          </form>

          <button mat-button type="button" (click)="toggleMode()">
            {{ isRegister() ? 'Already have an account? Login' : 'New here? Create an account' }}
          </button>
        }

        @if (step() === 'otp') {
          <h2>Verify it's you</h2>
          <p class="sub">
            We sent a 6-digit code to {{ pendingEmail() }}.
            @if (devCode()) { <strong>(dev code: {{ devCode() }})</strong> }
          </p>

          <form [formGroup]="otpForm" (ngSubmit)="submitOtp()">
            <mat-form-field appearance="outline">
              <mat-label>6-digit code</mat-label>
              <input matInput formControlName="code" maxlength="6" inputmode="numeric" />
              <mat-error>Enter the 6-digit code</mat-error>
            </mat-form-field>

            @if (error()) { <div class="error">{{ error() }}</div> }

            <button mat-flat-button class="go" type="submit" [disabled]="loading()">
              {{ loading() ? 'Verifying...' : 'Verify and continue' }}
            </button>
          </form>

          <button mat-button type="button" (click)="backToCredentials()">&larr; Back</button>
        }

      </mat-card>
    </div>
  `,
  styles: [`
    .wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f5f6f8; }
    .card { width: 380px; padding: 28px; }
    h2 { margin: 0 0 4px; }
    .sub { color: #6b7280; margin: 0 0 20px; }
    form { display: flex; flex-direction: column; }
    .go { background: #00b386; color: #fff; height: 46px; margin-bottom: 12px; }
    .error { color: #eb5b3c; margin-bottom: 12px; }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  step = signal<Step>('credentials');
  isRegister = signal(false);
  loading = signal(false);
  error = signal('');

  pendingEmail = signal('');
  devCode = signal<string | null>(null);
  private mfaToken = '';

  credForm = this.fb.nonNullable.group({
    fullName: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  otpForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
  });

  toggleMode() {
    this.isRegister.update(v => !v);
    const c = this.credForm.controls.fullName;
    c.setValidators(this.isRegister() ? [Validators.required] : []);
    c.updateValueAndValidity();
    this.error.set('');
  }

  submitCredentials() {
    if (this.credForm.invalid) { this.credForm.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    const v = this.credForm.getRawValue();

    if (this.isRegister()) {
      // Registration has no MFA step — straight to a session.
      this.auth.register(v).subscribe({
        next: () => this.router.navigate(['/explore']),
        error: e => {
          this.error.set(e.error?.error ?? 'Something went wrong. Is the API running?');
          this.loading.set(false);
        },
      });
      return;
    }

    this.auth.login({ email: v.email, password: v.password }).subscribe({
      next: res => {
        this.mfaToken = res.challenge.mfaToken;
        this.devCode.set(res.challenge.devCode);
        this.pendingEmail.set(v.email);
        this.step.set('otp');
        this.loading.set(false);
      },
      error: e => {
        this.error.set(e.error?.error ?? 'Something went wrong. Is the API running?');
        this.loading.set(false);
      },
    });
  }

  submitOtp() {
    if (this.otpForm.invalid) { this.otpForm.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');

    this.auth.verifyOtp(this.mfaToken, this.otpForm.controls.code.value).subscribe({
      next: () => this.router.navigate(['/explore']),
      error: e => {
        this.error.set(e.error?.error ?? 'Verification failed.');
        this.loading.set(false);
      },
    });
  }

  backToCredentials() {
    this.step.set('credentials');
    this.error.set('');
    this.otpForm.reset();
  }
}