import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <div class="wrap">
      <mat-card class="card">
        <h2>{{ isRegister() ? 'Create your account' : 'Welcome to Groww Clone' }}</h2>
        <p class="sub">Simple, free investing (paper trading, virtual money)</p>

        <form [formGroup]="form" (ngSubmit)="submit()">
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

        <button mat-button type="button" (click)="toggle()">
          {{ isRegister() ? 'Already have an account? Login' : 'New here? Create an account' }}
        </button>
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

  isRegister = signal(false);
  loading = signal(false);
  error = signal('');

  form = this.fb.nonNullable.group({
    fullName: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  toggle() {
    this.isRegister.update(v => !v);
    const c = this.form.controls.fullName;
    c.setValidators(this.isRegister() ? [Validators.required] : []);
    c.updateValueAndValidity();
    this.error.set('');
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    const v = this.form.getRawValue();

    const call$ = this.isRegister()
      ? this.auth.register(v)
      : this.auth.login({ email: v.email, password: v.password });

    call$.subscribe({
      next: () => this.router.navigate(['/explore']),
      error: e => {
        this.error.set(e.error?.error ?? 'Something went wrong. Is the API running?');
        this.loading.set(false);
      },
    });
  }
}