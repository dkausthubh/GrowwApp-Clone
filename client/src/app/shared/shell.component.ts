import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { Subscription, timer, switchMap } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { AlertsService } from '../core/alerts.service';
import { Notification } from '../core/models';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule,
    MatButtonModule, MatIconModule, MatBadgeModule, MatMenuModule, DatePipe],
  template: `
    <mat-toolbar class="bar">
      <span class="logo">Groww Clone</span>
      <nav>
        <a mat-button routerLink="/explore" routerLinkActive="active">Explore</a>
        <a mat-button routerLink="/watchlist" routerLinkActive="active">Watchlist</a>
        <a mat-button routerLink="/portfolio" routerLinkActive="active">Portfolio</a>
        <a mat-button routerLink="/orders" routerLinkActive="active">Orders</a>
        <a mat-button routerLink="/alerts" routerLinkActive="active">Alerts</a>
      </nav>
      <span class="spacer"></span>
      <button mat-icon-button [matMenuTriggerFor]="menu" (menuOpened)="onOpen()">        <mat-icon [matBadge]="unread()" [matBadgeHidden]="unread() === 0" matBadgeColor="warn" matBadgeSize="small">
          notifications
        </mat-icon>
      </button>
      <mat-menu #menu="matMenu" class="notif-menu">
        @if (notifications().length === 0) {
          <div class="empty">No notifications yet.</div>
        } @else {
          @for (n of notifications(); track n.id) {
            <div class="notif" [class.unread]="!n.isRead">
              <div>{{ n.message }}</div>
              <div class="time">{{ n.createdAt | date:'d MMM, h:mm a' }}</div>
            </div>
          }
        }
      </mat-menu>

      <span class="user">{{ auth.user()?.fullName }}</span>
      <button mat-button (click)="auth.logout()">Logout</button>
    </mat-toolbar>
    <main class="content"><router-outlet /></main>
  `,
  styles: [`
    .bar { background: #fff; border-bottom: 1px solid #e5e7eb; }
    .logo { font-weight: 700; color: #00b386; margin-right: 24px; }
    .spacer { flex: 1; }
    .user { margin-right: 8px; color: #44475b; }
    .active { color: #00b386; }
    .content { padding: 24px; max-width: 1100px; margin: 0 auto; }
    .notif-menu { max-width: 320px; }
    .notif { padding: 10px 16px; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
    .notif.unread { background: #f0fdf9; }
    .notif .time { color: #9ca3af; font-size: 11px; margin-top: 2px; }
    .empty { padding: 16px; color: #6b7280; font-size: 13px; }
  `]
})
export class ShellComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  private alertsSvc = inject(AlertsService);

  notifications = signal<Notification[]>([]);
  unread = signal(0);
  private sub?: Subscription;

  ngOnInit() {
    this.sub = timer(0, 10000)
      .pipe(switchMap(() => this.alertsSvc.getNotifications()))
      .subscribe(list => {
        this.notifications.set(list);
        this.unread.set(list.filter(n => !n.isRead).length);
      });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  onOpen() {
    if (this.unread() === 0) return;
    this.alertsSvc.markAllRead().subscribe(() => {
      this.unread.set(0);
      this.notifications.update(list => list.map(n => ({ ...n, isRead: true })));
    });
  }
}