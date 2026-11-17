import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { LeadService } from '../../../core/services/lead.service';
import { Lead, LeadFilters, LeadStatus } from '../../../core/models';
import { AiSearchComponent } from '../../ai/ai-search.component';

@Component({
  selector: 'app-leads-list',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, TitleCasePipe, ReactiveFormsModule, AiSearchComponent],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <h1 class="page-title">Leads</h1>
          <p class="page-sub">{{ total() }} total · Page {{ page() }} of {{ lastPage() }}</p>
        </div>
        <a routerLink="/leads/new" class="btn-primary">+ New Lead</a>
      </header>

      <app-ai-search (filtersApplied)="applyAiFilters($any($event))"></app-ai-search>

      <div class="toolbar">
        <input type="search" class="search-input" placeholder="Search leads, contacts, companies…" [formControl]="searchCtrl" />
        <select class="filter-select" (change)="setFilter('status', $any($event.target).value)">
          <option value="">All statuses</option>
          <option *ngFor="let s of statuses" [value]="s">{{ s | titlecase }}</option>
        </select>
        <select class="filter-select" (change)="setFilter('priority', $any($event.target).value)">
          <option value="">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <label class="filter-check">
          <input type="checkbox" (change)="setOverdue($any($event.target).checked)" /> Overdue only
        </label>
      </div>

      <div class="table-wrap">
        <div class="loading-overlay" *ngIf="loading()"><div class="spinner"></div></div>
        <table class="leads-table">
          <thead>
            <tr>
              <th (click)="sort('title')" class="sortable">Lead <span *ngIf="sortBy()==='title'">{{ sortDir()==='asc'?'↑':'↓' }}</span></th>
              <th>Company</th>
              <th (click)="sort('value')" class="sortable">Value <span *ngIf="sortBy()==='value'">{{ sortDir()==='asc'?'↑':'↓' }}</span></th>
              <th>Status</th>
              <th>Priority</th>
              <th (click)="sort('ai_score')" class="sortable">AI Score <span *ngIf="sortBy()==='ai_score'">{{ sortDir()==='asc'?'↑':'↓' }}</span></th>
              <th>Assigned</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngIf="!leads().length && !loading()">
              <td colspan="8" class="empty-row">No leads found. <a routerLink="/leads/new">Create one?</a></td>
            </tr>
            <tr *ngFor="let lead of leads()" class="lead-row">
              <td>
                <a [routerLink]="['/leads', lead.id]" class="lead-title-link">{{ lead.title }}</a>
                <div class="lead-contact">{{ lead.contact_name }}</div>
              </td>
              <td class="muted">{{ lead.company?.name }}</td>
              <td class="mono">{{ lead.value / 100 | currency:'USD':'symbol':'1.0-0' }}</td>
              <td><span class="status-chip" [class]="'status-' + lead.status">{{ lead.status | titlecase }}</span></td>
              <td><span class="priority-dot" [class]="'p-' + lead.priority">{{ lead.priority | titlecase }}</span></td>
              <td>
                <span class="ai-badge" [class]="'badge-' + (lead.ai_badge ?? 'unscored')" [title]="lead.ai_reason ?? ''" *ngIf="lead.ai_score !== null">{{ lead.ai_score }}</span>
                <span class="ai-badge badge-unscored" *ngIf="lead.ai_score === null">—</span>
              </td>
              <td class="muted">{{ lead.assigned_to?.name }}</td>
              <td><a [routerLink]="['/leads', lead.id, 'edit']" class="action-btn">✎</a></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination" *ngIf="lastPage() > 1">
        <button class="page-btn" [disabled]="page() <= 1" (click)="goToPage(page() - 1)">← Prev</button>
        <span class="page-info">{{ page() }} / {{ lastPage() }}</span>
        <button class="page-btn" [disabled]="page() >= lastPage()" (click)="goToPage(page() + 1)">Next →</button>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 28px 32px; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
    .page-title { font-family: var(--font-display); font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0 0 4px; }
    .page-sub { color: var(--text-muted); font-size: 13px; margin: 0; }
    .btn-primary { background: var(--accent); color: var(--bg-base); border: none; border-radius: 8px; padding: 9px 18px; font-size: 13.5px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; transition: opacity 0.15s; &:hover { opacity: 0.88; } }
    .toolbar { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }
    .search-input { flex: 1; min-width: 200px; background: var(--bg-surface); border: 1px solid var(--border); border-radius: 8px; padding: 9px 12px; color: var(--text-primary); font-size: 13.5px; outline: none; &:focus { border-color: var(--accent); } &::placeholder { color: var(--text-muted); } }
    .filter-select { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 8px; padding: 9px 12px; color: var(--text-secondary); font-size: 13px; outline: none; cursor: pointer; }
    .filter-check { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-muted); cursor: pointer; padding: 9px 4px; input { accent-color: var(--accent); } }
    .table-wrap { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; position: relative; }
    .loading-overlay { position: absolute; inset: 0; background: rgba(13,15,18,0.7); display: flex; align-items: center; justify-content: center; z-index: 10; }
    .spinner { width: 24px; height: 24px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .leads-table { width: 100%; border-collapse: collapse; }
    .leads-table th { text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); padding: 12px 16px; border-bottom: 1px solid var(--border); background: var(--bg-hover); }
    .leads-table th.sortable { cursor: pointer; user-select: none; &:hover { color: var(--text-primary); } }
    .leads-table td { padding: 14px 16px; border-bottom: 1px solid var(--border); font-size: 13.5px; color: var(--text-secondary); vertical-align: middle; }
    .lead-row:last-child td { border-bottom: none; }
    .lead-row:hover td { background: var(--bg-hover); }
    .lead-title-link { color: var(--text-primary); font-weight: 600; text-decoration: none; display: block; &:hover { color: var(--accent); } }
    .lead-contact { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
    .muted { color: var(--text-muted) !important; }
    .mono { font-family: var(--font-mono); font-size: 13px; }
    .empty-row { text-align: center; color: var(--text-muted); padding: 40px 16px !important; a { color: var(--accent); } }
    .status-chip { font-size: 11px; font-weight: 600; text-transform: uppercase; padding: 3px 7px; border-radius: 5px; white-space: nowrap; }
    .status-new { background: var(--bg-hover); color: var(--text-muted); }
    .status-contacted { background: rgba(96,165,250,0.15); color: #60a5fa; }
    .status-qualified { background: rgba(167,139,250,0.15); color: #a78bfa; }
    .status-proposal { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .status-negotiation { background: rgba(249,115,22,0.15); color: #f97316; }
    .status-closed_won { background: var(--success-subtle); color: var(--success); }
    .status-closed_lost { background: var(--danger-subtle); color: var(--danger); }
    .priority-dot { font-size: 12px; font-weight: 600; }
    .p-high { color: var(--danger); } .p-medium { color: #f59e0b; } .p-low { color: var(--text-muted); }
    .ai-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 34px; padding: 3px 7px; border-radius: 6px; font-size: 12px; font-weight: 700; }
    .badge-hot { background: rgba(239,68,68,0.15); color: #ef4444; }
    .badge-warm { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .badge-cold { background: rgba(96,165,250,0.15); color: #60a5fa; }
    .badge-unscored { background: var(--bg-hover); color: var(--text-muted); }
    .action-btn { color: var(--text-muted); text-decoration: none; font-size: 16px; padding: 4px 6px; border-radius: 4px; &:hover { background: var(--bg-hover); color: var(--accent); } }
    .pagination { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 20px; }
    .page-btn { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 8px; padding: 7px 14px; font-size: 13px; color: var(--text-secondary); cursor: pointer; transition: all 0.15s; &:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); } &:disabled { opacity: 0.4; cursor: not-allowed; } }
    .page-info { font-size: 13px; color: var(--text-muted); }
  `]
})
export class LeadsListComponent implements OnInit, OnDestroy {
  leads = signal<Lead[]>([]); total = signal(0); page = signal(1); lastPage = signal(1);
  loading = signal(false); sortBy = signal('created_at'); sortDir = signal<'asc'|'desc'>('desc');
  searchCtrl = new FormControl('');
  private filters: LeadFilters = {};
  private aiFilters: LeadFilters = {};
  private destroy$ = new Subject<void>();
  statuses: LeadStatus[] = ['new','contacted','qualified','proposal','negotiation','closed_won','closed_lost'];

  constructor(private leadSvc: LeadService) {}

  ngOnInit() {
    this.searchCtrl.valueChanges.pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(val => { this.filters = { ...this.filters, search: val ?? '' }; this.page.set(1); this.load(); });
    this.load();
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }
  setFilter(key: keyof LeadFilters, v: string) { this.filters = { ...this.filters, [key]: v }; this.page.set(1); this.load(); }
  setOverdue(c: boolean) { this.filters = { ...this.filters, overdue: c || undefined }; this.page.set(1); this.load(); }
  applyAiFilters(f: LeadFilters) { this.aiFilters = f; this.page.set(1); this.load(); }
  clearAiFilters() { this.aiFilters = {}; this.page.set(1); this.load(); }
  sort(field: string) { this.sortBy() === field ? this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc') : (this.sortBy.set(field), this.sortDir.set('desc')); this.load(); }
  goToPage(p: number) { this.page.set(p); this.load(); }

  private load() {
    this.loading.set(true);
    this.leadSvc.list({ ...this.filters, ...this.aiFilters, sort_by: this.sortBy(), sort_dir: this.sortDir(), page: this.page() }).subscribe({
      next: res => { this.leads.set(res.data); this.total.set(res.total); this.lastPage.set(res.last_page); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
