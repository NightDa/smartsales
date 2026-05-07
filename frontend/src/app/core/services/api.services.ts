import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  Company, DashboardStats, Anomaly,
  AppNotification, PaginatedResponse
} from '../models';

// ── CompanyService ────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private readonly api = `${environment.apiUrl}/companies`;

  constructor(private http: HttpClient) {}

  list(search = '', industry = '') {
    let params = new HttpParams();
    if (search)   params = params.set('search', search);
    if (industry) params = params.set('industry', industry);
    return this.http.get<PaginatedResponse<Company>>(this.api, { params });
  }

  get(id: number) {
    return this.http.get<Company>(`${this.api}/${id}`);
  }

  create(data: Partial<Company>) {
    return this.http.post<Company>(this.api, data);
  }

  update(id: number, data: Partial<Company>) {
    return this.http.put<Company>(`${this.api}/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}

// ── DashboardService ──────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private http: HttpClient) {}

  stats() {
    return this.http.get<DashboardStats>(`${environment.apiUrl}/dashboard/stats`);
  }
}

// ── NotificationService ───────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly api = `${environment.apiUrl}/notifications`;

  constructor(private http: HttpClient) {}

  list() {
    return this.http.get<{ data: PaginatedResponse<AppNotification>; unread_count: number }>(this.api);
  }

  markRead(id: string) {
    return this.http.post<void>(`${this.api}/${id}/read`, {});
  }

  markAllRead() {
    return this.http.post<void>(`${this.api}/read-all`, {});
  }
}

// ── AnomalyService ────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AnomalyService {
  constructor(private http: HttpClient) {}

  list() {
    return this.http.get<{ anomalies: Anomaly[]; total: number }>(
      `${environment.apiUrl}/anomalies`
    );
  }
}
