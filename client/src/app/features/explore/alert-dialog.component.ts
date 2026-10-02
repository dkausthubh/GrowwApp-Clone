import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { AlertsService } from '../../core/alerts.service';
import { Instrument } from '../../core/models';

@Component({
  selector: 'app-alert-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, MatDialogModule, MatButtonModule,
    MatButtonToggleModule, MatFormFieldModule, MatInputModule, MatSnackBarModule],
  template: `
    <h2 mat-dialog-title>Set alert — {{ data.symbol }}</h2>
    <div class="sub">LTP {{ data.lastPrice | currency:'INR':'symbol':'1.2-2' }}</div>

    <mat-dialog-content>
      <mat-button-toggle-group [formControl]="condition" class="toggle">
        <mat-button-toggle value="Above">Rises above</mat-button-toggle>
        <mat-button-toggle value="Below">Falls below</mat-button-toggle>
      </mat-button-toggle-group>

      <mat-form-field appearance="outline" class="price">
        <mat-label>Target price</mat-label>
        <input matInput type="number" min="0" step="0.01" [formControl]="targetPrice" />
      </mat-form-field>

      @if (error()) { <div class="error">{{ error() }}</div> }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-flat-button class="go" [disabled]="loading() || targetPrice.invalid" (click)="submit()">
        {{ loading() ? 'Saving...' : 'Create alert' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .sub { color: #6b7280; margin: 0 16px 16px; font-size: 13px; }
    .toggle { width: 100%; margin-bottom: 16px; }
    .price { width: 100%; }
    .error { color: #eb5b3c; margin-bottom: 8px; }
    .go { background: #00b386; color: #fff; }
  `]
})
export class AlertDialogComponent {
  private alerts = inject(AlertsService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  dialogRef = inject(MatDialogRef<AlertDialogComponent>);
  data = inject<Instrument>(MAT_DIALOG_DATA);

  condition = this.fb.nonNullable.control<'Above' | 'Below'>('Above');
  targetPrice = this.fb.nonNullable.control(this.data.lastPrice, [Validators.required, Validators.min(0.01)]);
  loading = signal(false);
  error = signal('');

  submit() {
    this.loading.set(true);
    this.error.set('');
    this.alerts.create({
      instrumentId: this.data.id,
      condition: this.condition.value,
      targetPrice: this.targetPrice.value,
    }).subscribe({
      next: () => {
        this.snackBar.open(`Alert set for ${this.data.symbol}`, 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: e => {
        this.error.set(e.error?.error ?? 'Could not create alert.');
        this.loading.set(false);
      },
    });
  }
}