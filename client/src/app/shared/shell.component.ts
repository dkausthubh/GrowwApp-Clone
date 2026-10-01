import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule],
  template: `
    <mat-toolbar class="bar">
      <span class="logo">Groww Clone</span>
      <nav>
        <a mat-button routerLink="/explore" routerLinkActive="active">Explore</a>
        <a mat-button routerLink="/watchlist" routerLinkActive="active">Watchlist</a>
        <a mat-button routerLink="/portfolio" routerLinkActive="active">Portfolio</a>
        <a mat-button routerLink="/orders" routerLinkActive="active">Orders</a>
    </nav>
      <span class="spacer"></span>
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
  `]
})
export class ShellComponent {
  auth = inject(AuthService);
}