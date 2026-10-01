import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TradingService } from '../../core/trading.service';
import { Instrument } from '../../core/models';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-order-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, MatDialogModule, MatButtonModule,
    MatButtonToggleModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>{{ data.symbol }}</h2>
    <div class="sub">{{ data.name }} &middot; LTP {{ data.lastPrice | currency:'INR':'symbol':'1.2-2' }}</div>

    <mat-dialog-content>
      <mat-button-toggle-group [formControl]="side" class="toggle">
        <mat-button-toggle value="Buy" class="buy">Buy</mat-button-toggle>
        <mat-button-toggle value="Sell" class="sell">Sell</mat-button-toggle>
      </mat-button-toggle-group>

      <mat-form-field appearance="outline" class="qty">
        <mat-label>Quantity</mat-label>
        <input matInput type="number" min="1" [formControl]="qty" />
      </mat-form-field>

      <div class="total">
        Total: {{ (data.lastPrice * (qty.value || 0)) | currency:'INR':'symbol':'1.2-2' }}
      </div>

      @if (error()) { <div class="error">{{ error() }}</div> }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">Cancel</button>
      <button mat-flat-button class="go" [disabled]="loading() || qty.invalid" (click)="submit()">
        {{ loading() ? 'Placing...' : (side.value + ' ' + data.symbol) }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .sub { color: #6b7280; margin: 0 16px 16px; font-size: 13px; }
    .toggle { width: 100%; margin-bottom: 16px; }
    .buy.mat-button-toggle-checked { background: #00b386; color: #fff; }
    .sell.mat-button-toggle-checked { background: #eb5b3c; color: #fff; }
    .qty { width: 100%; }
    .total { font-weight: 500; margin-bottom: 8px; }
    .error { color: #eb5b3c; margin-bottom: 8px; }
    .go { background: #00b386; color: #fff; }
  `]
})
export class OrderDialogComponent {
  private trading = inject(TradingService);
  private fb = inject(FormBuilder);
  dialogRef = inject(MatDialogRef<OrderDialogComponent>);
  data = inject<Instrument>(MAT_DIALOG_DATA);
  snackBar = inject(MatSnackBar);
  side = this.fb.nonNullable.control<'Buy' | 'Sell'>('Buy');
  qty = this.fb.nonNullable.control(1, [Validators.required, Validators.min(1)]);
  loading = signal(false);
  error = signal('');

  close() {
    this.dialogRef.close();
  }

  submit() {
  this.loading.set(true);
  this.error.set('');
  this.trading.placeOrder({
    instrumentId: this.data.id,
    side: this.side.value,
    quantity: this.qty.value,
  }).subscribe({
    next: order => {
      this.snackBar.open(
        `${order.side} order placed: ${order.quantity} ${this.data.symbol} @ ₹${order.price}`,
        'Close',
        { duration: 4000 }
      );
      this.dialogRef.close(order);
    },
    error: e => {
      this.error.set(e.error?.error ?? 'Order failed.');
      this.loading.set(false);
    },
  });
  }
}