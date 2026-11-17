import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { LeadFilters } from '../models';

export interface FilterBuilderResponse {
  filters: Partial<LeadFilters & { min_score?: number; max_score?: number; industry?: string }>;
  query: string;
  tokens_used: number;
}

export interface ReplyResponse {
  reply: string;
  lead_id: number;
  tokens_used: number;
}

export interface UsageResponse {
  period: string;
  by_type: Array<{ prompt_type: string; calls: number; tokens: number }>;
  total_tokens: number;
  estimated_cost_usd: number;
}

export interface SubjectsResponse {
  subjects: string[];
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly api = `${environment.apiUrl}/ai`;

  constructor(private http: HttpClient) {}

  buildFilters(query: string) {
    return this.http.post<FilterBuilderResponse>(`${this.api}/filter`, { query });
  }

  generateReply(leadId: number) {
    return this.http.post<ReplyResponse>(`${this.api}/reply/${leadId}`, {});
  }

  usage() {
    return this.http.get<UsageResponse>(`${this.api}/usage`);
  }

  suggestSubjects(leadId: number) {
    return this.http.get<SubjectsResponse>(`${this.api}/suggest-subject/${leadId}`);
  }
}
