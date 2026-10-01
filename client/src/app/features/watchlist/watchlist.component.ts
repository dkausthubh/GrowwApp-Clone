import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { WatchlistService } from '../../core/watchlist.service';
import { WatchlistItem } from '../../core/models';

@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe, MatIconModule],
  template: `
    <h2>Watchlist</h2>
    @if (items().length === 0) {
      <p>No stocks yet. Star a stock on the Explore page to add it here.</p>
    } @else {
      <div class="grid">
        @for (w of items(); track w.id) {
          <div class="tile">
            <button class="star" (click)="remove(w)"><mat-icon>star</mat-icon></button>
            <div class="sym">{{ w.instrument.symbol }}</div>
            <div class="name">{{ w.instrument.name }}</div>
            <div class="price">{{ w.instrument.lastPrice | currency:'INR':'symbol':'1.2-2' }}</div>
            <div class="chg" [class.up]="w.instrument.change >= 0" [class.down]="w.instrument.change < 0">
              {{ w.instrument.change | number:'1.2-2' }} ({{ w.instrument.changePercent | number:'1.2-2' }}%)
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 16px; }
    .tile { position: relative; border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px; background: #fff; }
    .star { position: absolute; top: 12px; right: 12px; background: none; border: none; cursor: pointer; color: #f5a623; }
    .sym { font-weight: 600; font-size: 18px; }
    .name { color: #6b7280; font-size: 13px; margin-bottom: 20px; }
    .price { font-size: 18px; font-weight: 500; }
    .chg { margin-top: 4px; font-size: 14px; }
    .up { color: #00b386; }
    .down { color: #eb5b3c; }
  `]
})
export class WatchlistComponent implements OnInit {
  private watchlistSvc = inject(WatchlistService);
  items = signal<WatchlistItem[]>([]);

  ngOnInit() {
    this.watchlistSvc.getAll().subscribe(list => this.items.set(list));
  }

  remove(w: WatchlistItem) {
    this.watchlistSvc.remove(w.instrument.id).subscribe(() =>
      this.items.update(list => list.filter(x => x.id !== w.id))
    );
  }
}