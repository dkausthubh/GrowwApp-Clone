import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { TradingService } from '../../core/trading.service';
import { Order } from '../../core/models';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  template: `
    <h2>Orders</h2>
    @if (orders().length === 0) {
      <p>No orders yet.</p>
    } @else {
      <table>
        <thead>
          <tr><th>Date</th><th>Stock</th><th>Side</th><th>Qty</th><th>Price</th><th>Total</th><th>Status</th></tr>
        </thead>
        <tbody>
          @for (o of orders(); track o.id) {
            <tr>
              <td>{{ o.createdAt | date:'d MMM, h:mm a' }}</td>
              <td>{{ o.symbol }}</td>
              <td [class.up]="o.side === 'Buy'" [class.down]="o.side === 'Sell'">{{ o.side }}</td>
              <td>{{ o.quantity }}</td>
              <td>{{ o.price | currency:'INR':'symbol':'1.2-2' }}</td>
              <td>{{ o.total | currency:'INR':'symbol':'1.2-2' }}</td>
              <td>{{ o.status }}</td>
            </tr>
          }
        </tbody>
      </table>
    }
  `,
  styles: [`
    table { width: 100%; border-collapse: collapse; background: #fff; }
    th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    .up { color: #00b386; } .down { color: #eb5b3c; }
  `]
})
export class OrdersComponent implements OnInit {
  private trading = inject(TradingService);
  orders = signal<Order[]>([]);

  ngOnInit() {
    this.trading.getOrders().subscribe(list => this.orders.set(list));
  }
}