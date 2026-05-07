import { Component, signal, output, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AiService, FilterBuilderResponse } from '../../core/services/ai.service';

@Component({
  selector: 'app-ai-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="ai-search" [class.active]="focused()">
      <div class="search-wrap">
        <span class="search-icon">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.5"/>
            <path d="M9.5 9.5L12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </span>
        <input #inputEl class="search-input" [formControl]="queryCtrl"
          placeholder='Ask AI: "Hot healthcare leads not contacted in 2 weeks"'
          (focus)="focused.set(true)" (blur)="onBlur()"
          (keydown.enter)="search()" (keydown.escape)="clear()" />
        <span class="ai-badge" *ngIf="!loading()">AI</span>
        <span class="spinner" *ngIf="loading()"></span>
      </div>

      <div class="suggestions" *ngIf="focused() && !loading() && !result()">
        <div class="suggestions-title">Try asking…</div>
        <button *ngFor="let s of suggestions" class="suggestion-chip" (mousedown)="useSuggestion(s)">{{ s }}</button>
      </div>

      <div class="result-preview" *ngIf="result()">
        <div class="result-header">
          <span class="result-label">Filters applied</span>
          <button class="clear-btn" (click)="clear()">✕ Clear</button>
        </div>
        <div class="result-filters">
          <span *ngFor="let f of resultEntries()" class="filter-tag">
            <span class="filter-key">{{ f.key }}</span>
            <span class="filter-val">{{ f.value }}</span>
          </span>
        </div>
        <div class="result-tokens">{{ result()!.tokens_used }} tokens used</div>
      </div>

      <div class="search-error" *ngIf="error()">{{ error() }}</div>
    </div>
  `,
  styles: [`
    .ai-search { position: relative; width: 100%; max-width: 480px; }
    .search-wrap { display: flex; align-items: center; gap: 8px; background: var(--bg-hover); border: 1px solid var(--border); border-radius: 10px; padding: 7px 12px; transition: border-color 0.15s, background 0.15s; }
    .ai-search.active .search-wrap { border-color: var(--accent); background: var(--bg-input); }
    .search-icon { color: var(--text-muted); display: flex; flex-shrink: 0; }
    .search-input { flex: 1; background: none; border: none; outline: none; color: var(--text-primary); font-size: 13px; font-family: var(--font-body); }
    .search-input::placeholder { color: var(--text-muted); font-size: 12.5px; }
    .ai-badge { background: var(--accent-subtle); color: var(--accent); font-size: 9px; font-weight: 800; letter-spacing: 0.08em; padding: 2px 6px; border-radius: 4px; flex-shrink: 0; }
    .spinner { width: 14px; height: 14px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .suggestions, .result-preview, .search-error { position: absolute; top: calc(100% + 6px); left: 0; right: 0; background: var(--bg-surface); border: 1px solid var(--border); border-radius: 10px; padding: 12px; z-index: 50; box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
    .suggestions-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin-bottom: 8px; }
    .suggestion-chip { display: inline-block; background: var(--bg-hover); border: 1px solid var(--border); border-radius: 20px; padding: 4px 10px; font-size: 12px; color: var(--text-secondary); cursor: pointer; margin: 3px 3px 3px 0; font-family: var(--font-body); transition: all 0.15s; }
    .suggestion-chip:hover { border-color: var(--accent); color: var(--accent); }
    .result-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .result-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
    .clear-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 12px; }
    .clear-btn:hover { color: var(--danger); }
    .result-filters { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
    .filter-tag { display: flex; align-items: center; gap: 4px; background: var(--accent-subtle); border-radius: 6px; padding: 4px 8px; }
    .filter-key { font-size: 10px; font-weight: 700; text-transform: uppercase; color: var(--accent); letter-spacing: 0.04em; }
    .filter-val { font-size: 12px; color: var(--text-primary); }
    .result-tokens { font-size: 11px; color: var(--text-muted); }
    .search-error { color: var(--danger); font-size: 13px; background: var(--danger-subtle); }
  `]
})
export class AiSearchComponent {
  filtersApplied = output<Record<string, unknown>>();
  queryCtrl = new FormControl('');
  focused   = signal(false);
  loading   = signal(false);
  result    = signal<FilterBuilderResponse | null>(null);
  error     = signal('');

  suggestions = [
    'Hot leads not contacted in 2 weeks',
    'High priority healthcare deals in proposal stage',
    'Overdue follow-ups this week',
    'New tech leads worth over $10k',
    'Cold leads in negotiation',
  ];

  constructor(private aiSvc: AiService, private router: Router) {}

  search() {
    const query = this.queryCtrl.value?.trim();
    if (!query) return;
    this.loading.set(true);
    this.error.set('');
    this.result.set(null);

    this.aiSvc.buildFilters(query).subscribe({
      next: res => {
        this.result.set(res);
        this.loading.set(false);
        this.filtersApplied.emit(res.filters as Record<string, unknown>);
        this.router.navigate(['/leads'], { queryParams: res.filters });
      },
      error: err => {
        this.error.set(err.error?.message ?? 'AI search failed. Try again.');
        this.loading.set(false);
      },
    });
  }

  useSuggestion(s: string) { this.queryCtrl.setValue(s); this.search(); }

  clear() {
    this.queryCtrl.reset();
    this.result.set(null);
    this.error.set('');
    this.focused.set(false);
    this.filtersApplied.emit({});
  }

  onBlur() { setTimeout(() => this.focused.set(false), 200); }

  resultEntries() {
    const r = this.result();
    if (!r) return [];
    return Object.entries(r.filters).map(([key, value]) => ({ key: key.replace(/_/g, ' '), value: String(value) }));
  }
}
