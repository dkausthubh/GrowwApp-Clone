import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subscription, catchError, combineLatest, debounceTime, distinctUntilChanged, of, startWith, switchMap, timer } from 'rxjs';
import { MarketService } from '../../core/market.service';
import { WatchlistService } from '../../core/watchlist.service';
import { Instrument } from '../../core/models';
import { OrderDialogComponent } from './order-dialog.component';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatIconModule,
    MatButtonModule, MatDialogModule, CurrencyPipe, DecimalPipe],
  template: `
    <h2>Stocks</h2>
    <mat-form-field appearance="outline" class="search">
      <mat-label>Search stocks</mat-label>
      <input matInput [formControl]="search" placeholder="e.g. TCS or bank" />
    </mat-form-field>

    <div class="grid">
      @for (i of instruments(); track i.id) {
        <div class="tile">
          <button class="star" (click)="toggleStar(i)">
            <mat-icon>{{ starred().has(i.id) ? 'star' : 'star_border' }}</mat-icon>
          </button>
          <div class="sym">{{ i.symbol }}</div>
          <div class="name">{{ i.name }}</div>
          <div class="price">{{ i.lastPrice | currency:'INR':'symbol':'1.2-2' }}</div>
          <div class="chg" [class.up]="i.change >= 0" [class.down]="i.change < 0">
            {{ i.change | number:'1.2-2' }} ({{ i.changePercent | number:'1.2-2' }}%)
          </div>
          <button mat-flat-button class="buy-btn" (click)="openOrder(i)">Buy / Sell</button>
        </div>
      } @empty {
        <p>No stocks found.</p>
      }
    </div>
  `,
  styles: [`
    .search { width: 320px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 16px; }
    .tile { position: relative; border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px; background: #fff; }
    .star { position: absolute; top: 12px; right: 12px; background: none; border: none; cursor: pointer; color: #f5a623; }
    .sym { font-weight: 600; font-size: 18px; }
    .name { color: #6b7280; font-size: 13px; margin-bottom: 20px; }
    .price { font-size: 18px; font-weight: 500; }
    .chg { margin-top: 4px; font-size: 14px; }
    .up { color: #00b386; }
    .down { color: #eb5b3c; }
    .buy-btn { margin-top: 12px; width: 100%; background: #00b386; color: #fff; }
  `]
})
export class ExploreComponent implements OnInit, OnDestroy {
  private market = inject(MarketService);
  private watchlistSvc = inject(WatchlistService);
  private dialog = inject(MatDialog);

  search = new FormControl('', { nonNullable: true });
  instruments = signal<Instrument[]>([]);
  starred = signal<Set<number>>(new Set());
  private sub?: Subscription;

  ngOnInit() {
    this.watchlistSvc.getAll().subscribe(list =>
      this.starred.set(new Set(list.map(w => w.instrument.id)))
    );

    const term$ = this.search.valueChanges.pipe(
      startWith(this.search.value),
      debounceTime(300),
      distinctUntilChanged()
    );

    this.sub = combineLatest([term$, timer(0, 5000)])
      .pipe(
        switchMap(([term]) =>
          this.market.getAll(term).pipe(catchError(() => of(this.instruments())))
        )
      )
      .subscribe(list => this.instruments.set(list));
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  toggleStar(i: Instrument) {
    const isStarred = this.starred().has(i.id);
    const call$ = isStarred ? this.watchlistSvc.remove(i.id) : this.watchlistSvc.add(i.id);
    call$.subscribe(() => {
      this.starred.update(s => {
        const next = new Set(s);
        isStarred ? next.delete(i.id) : next.add(i.id);
        return next;
      });
    });
  }

  openOrder(i: Instrument) {
    this.dialog.open(OrderDialogComponent, { width: '340px', data: i });
  }
}