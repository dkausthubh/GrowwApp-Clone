import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './api.config';
import { Alert, CreateAlertRequest, Notification } from './models';

/**
 * Provides API methods for creating, listing, cancelling, and tracking alerts and notifications.
 */
@Injectable({ providedIn: 'root' })
export class AlertsService {
  private http = inject(HttpClient);

  /**
   * Creates a new price alert for the current user.
   */
  create(req: CreateAlertRequest) {
    return this.http.post<Alert>(`${API_URL}/alerts`, req);
  }

  /**
   * Fetches all alerts associated with the current user.
   */
  getAll() {
    return this.http.get<Alert[]>(`${API_URL}/alerts`);
  }

  /**
   * Cancels an existing alert by its identifier.
   */
  cancel(id: number) {
    return this.http.delete(`${API_URL}/alerts/${id}`);
  }

  /**
   * Retrieves notifications tied to the user’s alert activity.
   */
  getNotifications() {
    return this.http.get<Notification[]>(`${API_URL}/notifications`);
  }

  /**
   * Marks all notifications as read for the current user.
   */
  markAllRead() {
    return this.http.post(`${API_URL}/notifications/mark-read`, {});
  }
}