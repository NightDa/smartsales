import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LeadService } from '../../../core/services/lead.service';
import { CompanyService } from '../../../core/services/api.services';
import { Company, LeadStatus, LeadPriority } from '../../../core/models';

@Component({
  selector: 'app-lead-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TitleCasePipe],
  template: `
    <div class="page">
      <header class="page-header">
        <a [routerLink]="isEdit() ? ['/leads', leadId()] : '/leads'" class="back-link">
          ← {{ isEdit() ? 'Back to lead' : 'Back to leads' }}
        </a>
        <h1 class="page-title">{{ isEdit() ? 'Edit Lead' : 'New Lead' }}</h1>
      </header>

      <form [formGroup]="form" (ngSubmit)="submit()" class="form-card">

        <!-- Section: Deal Info -->
        <div class="form-section">
          <h2 class="section-title">Deal Information</h2>

          <div class="field-row">
            <div class="field">
              <label class="field-label">Lead Title *</label>
              <input class="field-input" formControlName="title" placeholder="e.g. Enterprise Software Deal"
                     [class.error]="invalid('title')" />
              <span class="field-error" *ngIf="invalid('title')">Title is required</span>
            </div>
          </div>

          <div class="field-row two-col">
            <div class="field">
              <label class="field-label">Company *</label>
              <select class="field-input" formControlName="company_id" [class.error]="invalid('company_id')">
                <option value="">Select company…</option>
                <option *ngFor="let c of companies()" [value]="c.id">{{ c.name }}</option>
              </select>
              <span class="field-error" *ngIf="invalid('company_id')">Company is required</span>
            </div>

            <div class="field">
              <label class="field-label">Deal Value (USD)</label>
              <div class="input-prefix-wrap">
                <span class="input-prefix">$</span>
                <input class="field-input prefixed" formControlName="value_display"
                       type="number" min="0" step="1" placeholder="0" />
              </div>
            </div>
          </div>

          <div class="field-row two-col">
            <div class="field">
              <label class="field-label">Status</label>
              <select class="field-input" formControlName="status">
                <option *ngFor="let s of statuses" [value]="s">{{ s | titlecase }}</option>
              </select>
            </div>

            <div class="field">
              <label class="field-label">Priority</label>
              <select class="field-input" formControlName="priority">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Section: Contact -->
        <div class="form-section">
          <h2 class="section-title">Contact Person</h2>

          <div class="field-row two-col">
            <div class="field">
              <label class="field-label">Contact Name *</label>
              <input class="field-input" formControlName="contact_name" placeholder="Jane Smith"
                     [class.error]="invalid('contact_name')" />
              <span class="field-error" *ngIf="invalid('contact_name')">Name is required</span>
            </div>

            <div class="field">
              <label class="field-label">Email</label>
              <input class="field-input" formControlName="contact_email" type="email" placeholder="jane@company.com"
                     [class.error]="invalid('contact_email')" />
              <span class="field-error" *ngIf="invalid('contact_email')">Valid email required</span>
            </div>
          </div>

          <div class="field-row two-col">
            <div class="field">
              <label class="field-label">Phone</label>
              <input class="field-input" formControlName="contact_phone" placeholder="+1 555 000 0000" />
            </div>
          </div>
        </div>

        <!-- Section: Follow-up -->
        <div class="form-section">
          <h2 class="section-title">Scheduling</h2>

          <div class="field-row two-col">
            <div class="field">
              <label class="field-label">Last Contact Date</label>
              <input class="field-input" formControlName="last_contact_date" type="date" />
            </div>

            <div class="field">
              <label class="field-label">Next Follow-up Date</label>
              <input class="field-input" formControlName="next_followup_date" type="date" />
            </div>
          </div>

          <div class="field">
            <label class="field-label">Notes</label>
            <textarea class="field-input" formControlName="notes" rows="4"
                      placeholder="Context, talking points, key concerns…"></textarea>
          </div>
        </div>

        <!-- Error banner -->
        <div class="api-error" *ngIf="apiError()">{{ apiError() }}</div>

        <!-- Actions -->
        <div class="form-actions">
          <a [routerLink]="isEdit() ? ['/leads', leadId()] : '/leads'" class="btn-secondary">Cancel</a>
          <button type="submit" class="btn-primary" [disabled]="loading()">
            <span *ngIf="!loading()">{{ isEdit() ? 'Save Changes' : 'Create Lead' }}</span>
            <span *ngIf="loading()" class="spinner"></span>
          </button>
        </div>

      </form>
    </div>
  `,
  styles: [`
    .page { padding: 28px 32px; max-width: 760px; }
    .page-header { margin-bottom: 24px; }
    .back-link { color: var(--text-muted); font-size: 13px; text-decoration: none; display: block; margin-bottom: 10px; &:hover { color: var(--accent); } }
    .page-title { font-family: var(--font-display); font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0; }

    .form-card { display: flex; flex-direction: column; gap: 0; }
    .form-section { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 12px; padding: 24px; margin-bottom: 16px; display: flex; flex-direction: column; gap: 16px; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin: 0 0 4px; }

    .field-row { display: flex; flex-direction: column; gap: 16px; }
    .field-row.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 600px) { .field-row.two-col { grid-template-columns: 1fr; } }

    .field { display: flex; flex-direction: column; gap: 6px; }
    .field-label { font-size: 12px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.04em; }
    .field-input {
      background: var(--bg-input);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px 12px;
      color: var(--text-primary);
      font-size: 14px;
      outline: none;
      font-family: inherit;
      transition: border-color 0.15s;
      width: 100%;
      box-sizing: border-box;
      &::placeholder { color: var(--text-muted); }
      &:focus { border-color: var(--accent); }
      &.error { border-color: var(--danger); }
      &.prefixed { padding-left: 28px; }
    }
    textarea.field-input { resize: vertical; min-height: 96px; }
    select.field-input { appearance: none; background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236b7280' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px; cursor: pointer; }

    .input-prefix-wrap { position: relative; }
    .input-prefix { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 14px; pointer-events: none; }

    .field-error { color: var(--danger); font-size: 12px; }
    .api-error { background: var(--danger-subtle); color: var(--danger); padding: 12px 16px; border-radius: 8px; font-size: 13.5px; margin-bottom: 4px; }

    .form-actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 4px; }
    .btn-primary { background: var(--accent); color: var(--bg-base); border: none; border-radius: 8px; padding: 10px 22px; font-size: 14px; font-weight: 600; cursor: pointer; transition: opacity 0.15s; min-width: 140px; display: flex; align-items: center; justify-content: center; &:hover:not(:disabled) { opacity: 0.88; } &:disabled { opacity: 0.5; cursor: not-allowed; } }
    .btn-secondary { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 8px; padding: 10px 18px; font-size: 14px; color: var(--text-secondary); cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; transition: all 0.15s; &:hover { border-color: var(--accent); color: var(--accent); } }
    .spinner { width: 16px; height: 16px; border: 2px solid rgba(0,0,0,0.2); border-top-color: var(--bg-base); border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class LeadFormComponent implements OnInit {
  isEdit  = signal(false);
  leadId  = signal<number | null>(null);
  loading = signal(false);
  apiError = signal('');
  companies = signal<Company[]>([]);

  form = this.fb.group({
    title:             ['', Validators.required],
    company_id:        ['', Validators.required],
    contact_name:      ['', Validators.required],
    contact_email:     ['', Validators.email],
    contact_phone:     [''],
    value_display:     [0],   // dollars — converted to cents on submit
    status:            ['new'],
    priority:          ['medium'],
    last_contact_date: [''],
    next_followup_date:[''],
    notes:             [''],
  });

  statuses: LeadStatus[] = [
    'new','contacted','qualified','proposal','negotiation','closed_won','closed_lost'
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private leadSvc: LeadService,
    private companySvc: CompanyService,
  ) {}

  ngOnInit() {
    // Load companies for dropdown
    this.companySvc.list().subscribe(r => this.companies.set(r.data));

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.leadId.set(Number(id));
      this.leadSvc.get(Number(id)).subscribe(lead => {
        this.form.patchValue({
          ...lead,
          company_id:    String(lead.company_id),
          value_display: lead.value / 100,
        });
      });
    }
  }

  invalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c.touched);
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.apiError.set('');

    const raw = this.form.value;
    const payload = {
      title:              raw.title!,
      company_id:         Number(raw.company_id),
      contact_name:       raw.contact_name!,
      contact_email:      raw.contact_email || null,
      contact_phone:      raw.contact_phone || null,
      value:              Math.round((raw.value_display ?? 0) * 100), // dollars → cents
      status:             raw.status as LeadStatus,
      priority:           raw.priority as LeadPriority,
      last_contact_date:  raw.last_contact_date || null,
      next_followup_date: raw.next_followup_date || null,
      notes:              raw.notes || null,
    };

    const req$ = this.isEdit()
      ? this.leadSvc.update(this.leadId()!, payload)
      : this.leadSvc.create(payload);

    req$.subscribe({
      next: lead => this.router.navigate(['/leads', lead.id]),
      error: err => {
        const msg = err.error?.message ?? 'Something went wrong.';
        const errs = err.error?.errors;
        this.apiError.set(errs ? Object.values(errs).flat().join(' ') : msg);
        this.loading.set(false);
      },
    });
  }
}
