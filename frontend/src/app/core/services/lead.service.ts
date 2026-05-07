import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  Lead, LeadFilters, Activity, ActivityType,
  Attachment, PaginatedResponse
} from '../models';

@Injectable({ providedIn: 'root' })
export class LeadService {
  private readonly api = `${environment.apiUrl}/leads`;

  constructor(private http: HttpClient) {}

  list(filters: LeadFilters = {}) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== null) {
        params = params.set(k, String(v));
      }
    });
    return this.http.get<PaginatedResponse<Lead>>(this.api, { params });
  }

  get(id: number) {
    return this.http.get<Lead>(`${this.api}/${id}`);
  }

  create(data: Partial<Lead>) {
    return this.http.post<Lead>(this.api, data);
  }

  update(id: number, data: Partial<Lead>) {
    return this.http.put<Lead>(`${this.api}/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  // ── Activities ────────────────────────────────────────────────────────────

  addActivity(leadId: number, type: ActivityType, content: string) {
    return this.http.post<Activity>(`${this.api}/${leadId}/activities`, { type, content });
  }

  // ── Attachments ───────────────────────────────────────────────────────────

  uploadAttachment(leadId: number, file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<Attachment>(`${this.api}/${leadId}/attachments`, form);
  }

  deleteAttachment(leadId: number, attachmentId: number) {
    return this.http.delete<void>(`${this.api}/${leadId}/attachments/${attachmentId}`);
  }
}
