import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { CompanyService } from '../../../core/services/api.services';
import { Company, Industry } from '../../../core/models';

@Component({
  selector: 'app-companies-list',
  standalone: true,
  imports: [CommonModule, RouterLink, TitleCasePipe, ReactiveFormsModule, FormsModule],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <h1 class="page-title">Companies</h1>
          <p class="page-sub">{{ total() }} companies</p>
        </div>
        <button class="btn-primary" (click)="openForm()">+ New Company</button>
      </header>

      <!-- Toolbar -->
      <div class="toolbar">
        <input class="search-input" type="search" placeholder="Search companies…" [formControl]="searchCtrl" />
        <select class="filter-select" (change)="setIndustry($any($event.target).value)">
          <option value="">All industries</option>
          <option *ngFor="let i of industries" [value]="i">{{ i | titlecase }}</option>
        </select>
      </div>

      <!-- Grid -->
      <div class="company-grid" *ngIf="companies().length">
        <div class="company-card" *ngFor="let c of companies()">
          <div class="card-header">
            <div class="company-logo">{{ c.name[0] }}</div>
            <div class="industry-tag" [class]="'ind-' + c.industry">{{ c.industry | titlecase }}</div>
          </div>
          <div class="company-name">{{ c.name }}</div>
          <div class="company-meta">
            <span *ngIf="c.size">{{ c.size }} employees</span>
            <a *ngIf="c.website" [href]="c.website" target="_blank" class="website-link" (click)="$event.stopPropagation()">↗ Website</a>
          </div>
          <div class="card-footer">
            <span class="leads-count">{{ c.leads_count ?? 0 }} lead{{ c.leads_count !== 1 ? 's' : '' }}</span>
            <div class="card-actions">
              <button class="action-btn" (click)="editCompany(c)" title="Edit">✎</button>
              <button class="action-btn danger" (click)="deleteCompany(c)" title="Delete">🗑</button>
            </div>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="!companies().length && !loading()">
        <div class="empty-icon">🏢</div>
        <p>No companies yet. Create your first one!</p>
      </div>

      <div class="loading-state" *ngIf="loading()">
        <div class="spinner"></div>
      </div>

      <!-- Inline form modal -->
      <div class="modal-backdrop" *ngIf="showForm()" (click)="closeForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2 class="modal-title">{{ editingCompany() ? 'Edit Company' : 'New Company' }}</h2>
            <button class="modal-close" (click)="closeForm()">×</button>
          </div>
          <form class="modal-form" (ngSubmit)="saveCompany()">
            <div class="field">
              <label class="field-label">Company Name *</label>
              <input class="field-input" [(ngModel)]="formData.name" name="name" placeholder="Acme Corp" required />
            </div>
            <div class="field-row two-col">
              <div class="field">
                <label class="field-label">Industry *</label>
                <select class="field-input" [(ngModel)]="formData.industry" name="industry" required>
                  <option value="">Select…</option>
                  <option *ngFor="let i of industries" [value]="i">{{ i | titlecase }}</option>
                </select>
              </div>
              <div class="field">
                <label class="field-label">Size</label>
                <select class="field-input" [(ngModel)]="formData.size" name="size">
                  <option value="">Unknown</option>
                  <option value="1-10">1–10</option>
                  <option value="11-50">11–50</option>
                  <option value="51-200">51–200</option>
                  <option value="201-1000">201–1,000</option>
                  <option value="1000+">1,000+</option>
                </select>
              </div>
            </div>
            <div class="field">
              <label class="field-label">Website</label>
              <input class="field-input" [(ngModel)]="formData.website" name="website" type="url" placeholder="https://…" />
            </div>
            <div class="api-error" *ngIf="formError()">{{ formError() }}</div>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="closeForm()">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="formLoading()">
                <span *ngIf="!formLoading()">{{ editingCompany() ? 'Save' : 'Create' }}</span>
                <span *ngIf="formLoading()" class="spinner"></span>
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .page { padding: 28px 32px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-title { font-family: var(--font-display); font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0 0 4px; }
    .page-sub { color: var(--text-muted); font-size: 13px; margin: 0; }
    .btn-primary { background: var(--accent); color: var(--bg-base); border: none; border-radius: 8px; padding: 9px 18px; font-size: 13.5px; font-weight: 600; cursor: pointer; transition: opacity 0.15s; &:hover:not(:disabled) { opacity: 0.88; } &:disabled { opacity: 0.5; } }
    .btn-secondary { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 8px; padding: 9px 14px; font-size: 13.5px; color: var(--text-secondary); cursor: pointer; transition: all 0.15s; &:hover { border-color: var(--accent); color: var(--accent); } }

    .toolbar { display: flex; gap: 10px; margin-bottom: 20px; }
    .search-input { flex: 1; background: var(--bg-surface); border: 1px solid var(--border); border-radius: 8px; padding: 9px 12px; color: var(--text-primary); font-size: 13.5px; outline: none; &:focus { border-color: var(--accent); } &::placeholder { color: var(--text-muted); } }
    .filter-select { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 8px; padding: 9px 12px; color: var(--text-secondary); font-size: 13px; outline: none; cursor: pointer; }

    .company-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }

    .company-card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 12px; padding: 18px; display: flex; flex-direction: column; gap: 8px; transition: border-color 0.15s, transform 0.15s; &:hover { border-color: var(--accent); transform: translateY(-1px); } }
    .card-header { display: flex; align-items: center; justify-content: space-between; }
    .company-logo { width: 36px; height: 36px; border-radius: 8px; background: var(--accent-subtle); color: var(--accent); font-weight: 800; font-size: 16px; display: flex; align-items: center; justify-content: center; font-family: var(--font-display); }
    .industry-tag { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; padding: 3px 8px; border-radius: 20px; }
    .ind-tech        { background: rgba(96,165,250,0.15); color: #60a5fa; }
    .ind-healthcare  { background: rgba(52,211,153,0.15); color: #34d399; }
    .ind-finance     { background: rgba(167,139,250,0.15); color: #a78bfa; }
    .ind-retail      { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .ind-other       { background: var(--bg-hover); color: var(--text-muted); }
    .company-name { font-size: 15px; font-weight: 700; color: var(--text-primary); }
    .company-meta { display: flex; gap: 10px; align-items: center; font-size: 12px; color: var(--text-muted); }
    .website-link { color: var(--accent); text-decoration: none; font-size: 11px; &:hover { text-decoration: underline; } }
    .card-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 4px; padding-top: 10px; border-top: 1px solid var(--border); }
    .leads-count { font-size: 12px; font-weight: 600; color: var(--text-muted); }
    .card-actions { display: flex; gap: 4px; }
    .action-btn { background: none; border: none; font-size: 14px; cursor: pointer; padding: 4px 6px; border-radius: 4px; color: var(--text-muted); transition: all 0.15s; &:hover { background: var(--bg-hover); color: var(--accent); } &.danger:hover { background: var(--danger-subtle); color: var(--danger); } }

    .empty-state { text-align: center; padding: 60px 20px; color: var(--text-muted); }
    .empty-icon { font-size: 40px; margin-bottom: 12px; }
    .loading-state { display: flex; justify-content: center; padding: 60px; }
    .spinner { width: 24px; height: 24px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; animation: fadeIn 0.15s; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .modal { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 16px; padding: 28px; width: 100%; max-width: 480px; animation: slideUp 0.2s; }
    @keyframes slideUp { from { transform: translateY(16px); opacity: 0; } to { transform: none; opacity: 1; } }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .modal-title { font-family: var(--font-display); font-size: 18px; font-weight: 700; color: var(--text-primary); margin: 0; }
    .modal-close { background: none; border: none; font-size: 22px; color: var(--text-muted); cursor: pointer; padding: 0; line-height: 1; &:hover { color: var(--text-primary); } }
    .modal-form { display: flex; flex-direction: column; gap: 16px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field-row.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .field-label { font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted); }
    .field-input { background: var(--bg-input); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; color: var(--text-primary); font-size: 14px; outline: none; font-family: inherit; transition: border-color 0.15s; &:focus { border-color: var(--accent); } &::placeholder { color: var(--text-muted); } }
    select.field-input { appearance: none; cursor: pointer; }
    .api-error { background: var(--danger-subtle); color: var(--danger); padding: 10px 12px; border-radius: 8px; font-size: 13px; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
  `]
})
export class CompaniesListComponent implements OnInit, OnDestroy {
  companies = signal<Company[]>([]);
  total     = signal(0);
  loading   = signal(false);
  showForm  = signal(false);
  editingCompany = signal<Company | null>(null);
  formLoading    = signal(false);
  formError      = signal('');

  formData: Partial<Company> = {};

  searchCtrl = new FormControl('');
  private industryFilter = '';
  private destroy$ = new Subject<void>();

  industries: Industry[] = ['tech', 'healthcare', 'finance', 'retail', 'other'];

  constructor(private companySvc: CompanyService) {}

  ngOnInit() {
    this.searchCtrl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(() => this.load());

    this.load();
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  setIndustry(industry: string) {
    this.industryFilter = industry;
    this.load();
  }

  openForm(company?: Company) {
    this.editingCompany.set(company ?? null);
    this.formData = company ? { ...company } : {};
    this.formError.set('');
    this.showForm.set(true);
  }

  editCompany(c: Company) { this.openForm(c); }

  closeForm() { this.showForm.set(false); this.editingCompany.set(null); }

  saveCompany() {
    if (!this.formData.name || !this.formData.industry) return;
    this.formLoading.set(true);
    this.formError.set('');

    const req$ = this.editingCompany()
      ? this.companySvc.update(this.editingCompany()!.id, this.formData)
      : this.companySvc.create(this.formData);

    req$.subscribe({
      next: () => { this.closeForm(); this.load(); this.formLoading.set(false); },
      error: err => {
        this.formError.set(err.error?.message ?? 'Failed to save.');
        this.formLoading.set(false);
      },
    });
  }

  deleteCompany(c: Company) {
    if (!confirm(`Delete "${c.name}"? This will fail if it has active leads.`)) return;
    this.companySvc.delete(c.id).subscribe({
      next: () => this.companies.set(this.companies().filter(x => x.id !== c.id)),
      error: err => alert(err.error?.message ?? 'Could not delete.'),
    });
  }

  private load() {
    this.loading.set(true);
    this.companySvc.list(this.searchCtrl.value ?? '', this.industryFilter).subscribe({
      next: r => { this.companies.set(r.data); this.total.set(r.total); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
