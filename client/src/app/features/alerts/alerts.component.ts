import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { AlertsService } from '../../core/alerts.service';
import { Alert } from '../../core/models';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, MatButtonModule],
  template: `
    <h2>Price Alerts</h2>
    @if (alerts().length === 0) {
      <p>No alerts yet. Set one from the bell icon on a stock in Explore.</p>
    } @else {
      <table>
        <thead>
          <tr><th>Stock</th><th>Condition</th><th>Target</th><th>Status</th><th>Created</th><th></th></tr>
        </thead>
        <tbody>
          @for (a of alerts(); track a.id) {
            <tr>
              <td>{{ a.symbol }}</td>
              <td>{{ a.condition === 'Above' ? 'Rises above' : 'Falls below' }}</td>
              <td>{{ a.targetPrice | currency:'INR':'symbol':'1.2-2' }}</td>
              <td [class.active]="a.status === 'Active'" [class.triggered]="a.status === 'Triggered'">
                {{ a.status }}
              </td>
              <td>{{ a.createdAt | date:'d MMM, h:mm a' }}</td>
              <td>
                @if (a.status === 'Active') {
                  <button mat-button color="warn" (click)="cancel(a)">Cancel</button>
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    }
  `,
  styles: [`
    table { width: 100%; border-collapse: collapse; background: #fff; }
    th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    .active { color: #00b386; } .triggered { color: #6b7280; }
  `]
})
export class AlertsComponent implements OnInit {
  private alertsSvc = inject(AlertsService);
  alerts = signal<Alert[]>([]);

  ngOnInit() {
    this.alertsSvc.getAll().subscribe(list => this.alerts.set(list));
  }

  cancel(a: Alert) {
    this.alertsSvc.cancel(a.id).subscribe(() =>
      this.alerts.update(list => list.map(x => x.id === a.id ? { ...x, status: 'Cancelled' } : x))
    );
  }
}