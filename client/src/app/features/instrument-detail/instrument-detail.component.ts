import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subscription, switchMap, timer } from 'rxjs';
import Chart from 'chart.js/auto';
import { MarketService } from '../../core/market.service';
import { Instrument, PricePoint } from '../../core/models';
import { OrderDialogComponent } from '../explore/order-dialog.component';
import { AlertDialogComponent } from '../explore/alert-dialog.component';

@Component({
  selector: 'app-instrument-detail',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DecimalPipe, MatButtonModule, MatDialogModule],
  template: `
    @if (instrument(); as i) {
      <a routerLink="/explore" class="back">&larr; Back to Explore</a>

      <div class="header">
        <div>
          <h2>{{ i.symbol }}</h2>
          <div class="name">{{ i.name }} &middot; {{ i.exchange }}</div>
        </div>
        <div class="price-block">
          <div class="price">{{ i.lastPrice | currency:'INR':'symbol':'1.2-2' }}</div>
          <div class="chg" [class.up]="i.change >= 0" [class.down]="i.change < 0">
            {{ i.change | number:'1.2-2' }} ({{ i.changePercent | number:'1.2-2' }}%)
          </div>
        </div>
      </div>

      <div class="ranges">
        @for (r of ranges; track r.minutes) {
          <button mat-button [class.active]="selectedRange() === r.minutes" (click)="selectRange(r.minutes)">
            {{ r.label }}
          </button>
        }
      </div>

      <div class="chart-wrap">
        <canvas #chartCanvas></canvas>
        @if (noData()) { <div class="no-data">Not enough data yet — leave this open a bit longer.</div> }
      </div>

      <div class="actions">
        <button mat-flat-button class="buy-btn" (click)="openOrder(i)">Buy / Sell</button>
        <button mat-stroked-button (click)="openAlert(i)">Set alert</button>
      </div>
    }
  `,
  styles: [`
    .back { display: inline-block; margin-bottom: 16px; color: #6b7280; text-decoration: none; font-size: 13px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    h2 { margin: 0; font-size: 24px; }
    .name { color: #6b7280; font-size: 14px; }
    .price-block { text-align: right; }
    .price { font-size: 24px; font-weight: 600; }
    .chg { font-size: 14px; }
    .up { color: #00b386; } .down { color: #eb5b3c; }
    .ranges { margin-bottom: 8px; }
    .ranges button.active { color: #00b386; font-weight: 600; }
    .chart-wrap { position: relative; height: 320px; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 20px; }
    .no-data { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 13px; }
    .actions { display: flex; gap: 12px; }
    .buy-btn { background: #00b386; color: #fff; }
  `]
})
export class InstrumentDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  private route = inject(ActivatedRoute);
  private market = inject(MarketService);
  private dialog = inject(MatDialog);

  instrument = signal<Instrument | null>(null);
  selectedRange = signal(30);
  noData = signal(false);

  ranges = [
    { label: '5m', minutes: 5 },
    { label: '30m', minutes: 30 },
    { label: '1h', minutes: 60 },
    { label: '1d', minutes: 1440 },
  ];

  private id!: number;
  private chart?: Chart;
  private sub?: Subscription;
  private viewReady = false;

  ngOnInit() {
    this.id = Number(this.route.snapshot.paramMap.get('id'));

    this.sub = timer(0, 5000)
      .pipe(switchMap(() => this.market.getById(this.id)))
      .subscribe(i => this.instrument.set(i));

    this.loadHistory();
  }

  ngAfterViewInit() {
    this.viewReady = true;
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.chart?.destroy();
  }

  selectRange(minutes: number) {
    this.selectedRange.set(minutes);
    this.loadHistory();
  }

  openAlert(instrument: Instrument) {
    this.dialog.open(AlertDialogComponent, { data: instrument });
  }

  openOrder(instrument: Instrument) {
    this.dialog.open(OrderDialogComponent, { data: instrument });
  }

  private loadHistory() {
    this.market.getHistory(this.id, this.selectedRange()).subscribe(points => {
      this.noData.set(points.length < 2);
      // wait a tick for the canvas to exist on first load
      if (this.viewReady) this.renderChart(points);
      else setTimeout(() => this.renderChart(points), 0);
    });
  }

  private renderChart(points: PricePoint[]) {
    const labels = points.map(p => new Date(p.recordedAt).toLocaleTimeString());
    const data = points.map(p => p.price);
    const isUp = data.length < 2 || data[data.length - 1] >= data[0];
    const color = isUp ? '#00b386' : '#eb5b3c';

    if (this.chart) {
      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = data;
      (this.chart.data.datasets[0] as any).borderColor = color;
      this.chart.update();
      return;
    }

    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data,
          borderColor: color,
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.3,
          fill: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { maxTicksLimit: 6 } },
          y: { ticks: { callback: v => '₹' + v } },
        },
      },
    });
  }
}