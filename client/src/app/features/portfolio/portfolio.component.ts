import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { TradingService } from '../../core/trading.service';
import { Portfolio } from '../../core/models';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe],
  template: `
    <h2>Portfolio</h2>

    @if (portfolio(); as p) {
      <div class="summary">
        <div class="card">
          <div class="label">Invested</div>
          <div class="value">{{ p.totalInvested | currency:'INR':'symbol':'1.2-2' }}</div>
        </div>
        <div class="card">
          <div class="label">Current value</div>
          <div class="value">{{ p.totalCurrent | currency:'INR':'symbol':'1.2-2' }}</div>
        </div>
        <div class="card">
          <div class="label">P&amp;L</div>
          <div class="value" [class.up]="p.totalPnl >= 0" [class.down]="p.totalPnl < 0">
            {{ p.totalPnl | currency:'INR':'symbol':'1.2-2' }} ({{ p.totalPnlPercent | number:'1.2-2' }}%)
          </div>
        </div>
        <div class="card">
          <div class="label">Wallet balance</div>
          <div class="value">{{ p.walletBalance | currency:'INR':'symbol':'1.2-2' }}</div>
        </div>
      </div>

      @if (p.holdings.length === 0) {
        <p>No holdings yet. Buy a stock from Explore to see it here.</p>
      } @else {
        <table>
          <thead>
            <tr>
              <th>Stock</th><th>Qty</th><th>Avg price</th><th>LTP</th>
              <th>Invested</th><th>Current</th><th>P&amp;L</th>
            </tr>
          </thead>
          <tbody>
            @for (h of p.holdings; track h.instrumentId) {
              <tr>
                <td>
                  <div class="sym">{{ h.symbol }}</div>
                  <div class="name">{{ h.name }}</div>
                </td>
                <td>{{ h.quantity }}</td>
                <td>{{ h.avgPrice | currency:'INR':'symbol':'1.2-2' }}</td>
                <td>{{ h.lastPrice | currency:'INR':'symbol':'1.2-2' }}</td>
                <td>{{ h.investedValue | currency:'INR':'symbol':'1.2-2' }}</td>
                <td>{{ h.currentValue | currency:'INR':'symbol':'1.2-2' }}</td>
                <td [class.up]="h.pnl >= 0" [class.down]="h.pnl < 0">
                  {{ h.pnl | currency:'INR':'symbol':'1.2-2' }} ({{ h.pnlPercent | number:'1.2-2' }}%)
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    }
  `,
  styles: [`
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; background: #fff; }
    .label { color: #6b7280; font-size: 13px; margin-bottom: 6px; }
    .value { font-size: 18px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; background: #fff; }
    th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    .sym { font-weight: 600; }
    .name { color: #6b7280; font-size: 12px; }
    .up { color: #00b386; }
    .down { color: #eb5b3c; }
  `]
})
export class PortfolioComponent implements OnInit {
  private trading = inject(TradingService);
  portfolio = signal<Portfolio | null>(null);

  ngOnInit() {
    this.trading.getPortfolio().subscribe(p => this.portfolio.set(p));
  }
}