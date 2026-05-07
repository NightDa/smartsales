import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, TitleCasePipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { LeadService } from '../../../core/services/lead.service';
import { Lead, ActivityType } from '../../../core/models';
import { AiReplyModalComponent } from '../../ai/ai-reply-modal.component';

type Tab = 'details' | 'timeline' | 'ai' | 'attachments';

@Component({
  selector: 'app-lead-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, TitleCasePipe, DatePipe, ReactiveFormsModule, AiReplyModalComponent],
  template: `
    <div class="page" *ngIf="lead() as l; else loadingTpl">
      <!-- Header -->
      <header class="page-header">
        <a routerLink="/leads" class="back-link">← Leads</a>
        <div class="header-row">
          <div class="header-left">
            <h1 class="page-title">{{ l.title }}</h1>
            <div class="header-meta">
              <span class="status-chip" [class]="'status-' + l.status">{{ l.status | titlecase }}</span>
              <span class="priority-dot" [class]="'p-' + l.priority">{{ l.priority | titlecase }} priority</span>
              <span class="muted">{{ l.company?.name }}</span>
            </div>
          </div>
          <div class="header-actions">
            <!-- AI Reply button -->
            <button class="btn-ai" (click)="showReplyModal.set(true)">
              ✦ AI Reply
            </button>
            <a [routerLink]="['/leads', l.id, 'edit']" class="btn-secondary">Edit</a>
            <button class="btn-danger" (click)="deleteLead()">Delete</button>
          </div>
        </div>
      </header>

      <!-- Tabs -->
      <div class="tabs">
        <button *ngFor="let t of tabs" class="tab" [class.active]="activeTab() === t.key" (click)="activeTab.set(t.key)">
          {{ t.label }}
          <span class="tab-badge" *ngIf="t.key === 'timeline' && l.activities?.length">{{ l.activities?.length }}</span>
        </button>
      </div>

      <!-- Tab: Details -->
      <div class="tab-content" *ngIf="activeTab() === 'details'">
        <div class="detail-grid">
          <div class="detail-section">
            <h3 class="section-title">Contact</h3>
            <div class="field-row"><span class="field-label">Name</span><span class="field-value">{{ l.contact_name }}</span></div>
            <div class="field-row" *ngIf="l.contact_email"><span class="field-label">Email</span><a [href]="'mailto:' + l.contact_email" class="field-link">{{ l.contact_email }}</a></div>
            <div class="field-row" *ngIf="l.contact_phone"><span class="field-label">Phone</span><a [href]="'tel:' + l.contact_phone" class="field-link">{{ l.contact_phone }}</a></div>
          </div>
          <div class="detail-section">
            <h3 class="section-title">Deal</h3>
            <div class="field-row"><span class="field-label">Value</span><span class="field-value accent">{{ l.value / 100 | currency }}</span></div>
            <div class="field-row"><span class="field-label">Status</span><span class="status-chip" [class]="'status-' + l.status">{{ l.status | titlecase }}</span></div>
            <div class="field-row" *ngIf="l.last_contact_date"><span class="field-label">Last Contact</span><span class="field-value">{{ l.last_contact_date | date:'mediumDate' }}</span></div>
            <div class="field-row" *ngIf="l.next_followup_date">
              <span class="field-label">Follow-up</span>
              <span class="field-value" [class.overdue]="isOverdue(l.next_followup_date)">
                {{ l.next_followup_date | date:'mediumDate' }}
                <span *ngIf="isOverdue(l.next_followup_date)" class="overdue-tag">Overdue</span>
              </span>
            </div>
          </div>
          <div class="detail-section full-width" *ngIf="l.notes">
            <h3 class="section-title">Notes</h3>
            <p class="notes-text">{{ l.notes }}</p>
          </div>
        </div>
        <div class="quick-actions">
          <h3 class="section-title">Quick Status Update</h3>
          <div class="status-buttons">
            <button *ngFor="let s of statuses" class="status-btn" [class]="'status-' + s"
                    [class.active]="l.status === s" (click)="updateStatus(s)">{{ s | titlecase }}</button>
          </div>
        </div>
      </div>

      <!-- Tab: Timeline -->
      <div class="tab-content" *ngIf="activeTab() === 'timeline'">
        <div class="add-activity">
          <div class="activity-type-row">
            <button *ngFor="let t of activityTypes" class="type-btn"
                    [class.active]="selectedType() === t.value" (click)="selectedType.set(t.value)">
              {{ t.icon }} {{ t.label }}
            </button>
          </div>
          <div class="activity-input-row">
            <textarea class="activity-input" placeholder="Add a note, log a call…"
                      [formControl]="activityContent" rows="3"></textarea>
            <button class="btn-primary" [disabled]="!activityContent.value?.trim()" (click)="addActivity()">Log</button>
          </div>
        </div>
        <div class="timeline">
          <div class="timeline-item" *ngFor="let a of l.activities">
            <div class="timeline-dot" [class]="'dot-' + a.type"></div>
            <div class="timeline-body">
              <div class="timeline-header">
                <span class="activity-type-badge" [class]="'type-' + a.type">{{ a.type | titlecase }}</span>
                <span class="timeline-meta">{{ a.user?.name }} · {{ a.created_at | date:'MMM d, y · h:mm a' }}</span>
              </div>
              <div class="timeline-content">{{ a.content }}</div>
            </div>
          </div>
          <div class="empty-timeline" *ngIf="!l.activities?.length">No activity yet.</div>
        </div>
      </div>

      <!-- Tab: AI Insights -->
      <div class="tab-content ai-tab" *ngIf="activeTab() === 'ai'">
        <div class="ai-score-card" *ngIf="l.ai_score !== null">
          <div class="ai-score-ring" [class]="'ring-' + l.ai_badge">
            <span class="score-num">{{ l.ai_score }}</span>
            <span class="score-label">/100</span>
          </div>
          <div class="ai-score-info">
            <div class="ai-badge-large" [class]="'badge-' + l.ai_badge">
              {{ l.ai_badge === 'hot' ? '🔥 Hot' : l.ai_badge === 'warm' ? '👀 Warm' : '❄️ Cold' }}
            </div>
            <p class="ai-reason">{{ l.ai_reason }}</p>
            <p class="ai-hint">Score updates automatically when lead data changes.</p>
            <button class="btn-ai mt" (click)="showReplyModal.set(true)">✦ Generate AI Reply Email</button>
          </div>
        </div>
        <div class="unscored" *ngIf="l.ai_score === null">
          <div class="unscored-icon">🤖</div>
          <div>AI scoring is pending. The score will appear after the background job processes this lead.</div>
        </div>
      </div>

      <!-- Tab: Attachments -->
      <div class="tab-content" *ngIf="activeTab() === 'attachments'">
        <div class="upload-zone" (dragover)="$event.preventDefault()" (drop)="onDrop($event)">
          <input type="file" #fileInput (change)="onFileChange($event)" hidden />
          <div class="upload-text">Drop files here or <button class="upload-link" (click)="fileInput.click()">browse</button></div>
          <div class="upload-hint">PDF, DOC, DOCX, XLS, XLSX, PNG, JPG — max 10 MB</div>
        </div>
        <div class="attachment-list" *ngIf="l.attachments?.length">
          <div class="attachment-row" *ngFor="let att of l.attachments">
            <span class="att-icon">📄</span>
            <span class="att-name">{{ att.filename }}</span>
            <span class="att-size">{{ formatSize(att.size) }}</span>
            <a [href]="att.url" target="_blank" class="att-download">Download</a>
            <button class="att-delete" (click)="deleteAttachment(att.id)">×</button>
          </div>
        </div>
        <div class="empty-att" *ngIf="!l.attachments?.length">No attachments yet.</div>
      </div>

      <!-- AI Reply Modal -->
      <app-ai-reply-modal *ngIf="showReplyModal() && lead()"
        [lead]="lead()!" (closed)="showReplyModal.set(false)">
      </app-ai-reply-modal>

    </div>

    <ng-template #loadingTpl>
      <div class="loading-page"><div class="spinner"></div></div>
    </ng-template>
  `,
  styles: [`
    .page { padding: 28px 32px; max-width: 1000px; }
    .back-link { color: var(--text-muted); font-size: 13px; text-decoration: none; display: block; margin-bottom: 12px; &:hover { color: var(--accent); } }
    .page-header { margin-bottom: 24px; }
    .header-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
    .page-title { font-family: var(--font-display); font-size: 22px; font-weight: 700; color: var(--text-primary); margin: 0 0 8px; }
    .header-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .muted { font-size: 13px; color: var(--text-muted); }
    .header-actions { display: flex; gap: 8px; flex-shrink: 0; }
    .btn-ai { background: linear-gradient(135deg, var(--accent), #00a88a); color: var(--bg-base); border: none; border-radius: 8px; padding: 8px 14px; font-size: 13px; font-weight: 700; cursor: pointer; transition: opacity 0.15s; display: flex; align-items: center; gap: 4px; &:hover { opacity: 0.85; } }
    .btn-ai.mt { margin-top: 12px; }
    .btn-secondary { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 8px; padding: 8px 14px; font-size: 13px; color: var(--text-secondary); cursor: pointer; text-decoration: none; transition: all 0.15s; &:hover { border-color: var(--accent); color: var(--accent); } }
    .btn-danger { background: var(--danger-subtle); border: 1px solid var(--danger); border-radius: 8px; padding: 8px 14px; font-size: 13px; color: var(--danger); cursor: pointer; transition: opacity 0.15s; &:hover { opacity: 0.8; } }
    .btn-primary { background: var(--accent); color: var(--bg-base); border: none; border-radius: 8px; padding: 9px 16px; font-size: 13px; font-weight: 600; cursor: pointer; transition: opacity 0.15s; &:hover:not(:disabled) { opacity: 0.88; } &:disabled { opacity: 0.4; cursor: not-allowed; } }

    .tabs { display: flex; gap: 2px; border-bottom: 1px solid var(--border); margin-bottom: 24px; }
    .tab { background: none; border: none; padding: 10px 16px; font-size: 13.5px; color: var(--text-muted); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; display: flex; align-items: center; gap: 6px; transition: all 0.15s; &:hover { color: var(--text-primary); } &.active { color: var(--accent); border-bottom-color: var(--accent); font-weight: 600; } }
    .tab-badge { background: var(--accent); color: var(--bg-base); border-radius: 10px; padding: 1px 6px; font-size: 10px; font-weight: 700; }

    .tab-content { animation: fadeIn 0.15s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }

    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .detail-section { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 12px; padding: 18px; }
    .detail-section.full-width { grid-column: 1 / -1; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin: 0 0 14px; }
    .field-row { display: flex; justify-content: space-between; align-items: center; padding: 7px 0; border-bottom: 1px solid var(--border); font-size: 13.5px; &:last-child { border-bottom: none; } }
    .field-label { color: var(--text-muted); font-size: 12.5px; }
    .field-value { color: var(--text-primary); font-weight: 500; }
    .field-value.accent { color: var(--accent); font-weight: 700; }
    .field-link { color: var(--accent); text-decoration: none; &:hover { text-decoration: underline; } }
    .overdue { color: var(--danger) !important; }
    .overdue-tag { background: var(--danger-subtle); color: var(--danger); font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; margin-left: 6px; }
    .notes-text { color: var(--text-secondary); font-size: 14px; line-height: 1.6; margin: 0; }
    .quick-actions { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 12px; padding: 18px; }
    .status-buttons { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
    .status-btn { background: var(--bg-hover); border: 1px solid var(--border); border-radius: 8px; padding: 7px 12px; font-size: 12.5px; font-weight: 500; cursor: pointer; color: var(--text-muted); transition: all 0.15s; }
    .status-new.active, .status-new:hover { color: var(--text-secondary); border-color: var(--text-muted); }
    .status-contacted.active, .status-contacted:hover { color: #60a5fa; border-color: #60a5fa; }
    .status-qualified.active, .status-qualified:hover { color: #a78bfa; border-color: #a78bfa; }
    .status-proposal.active, .status-proposal:hover { color: #f59e0b; border-color: #f59e0b; }
    .status-negotiation.active, .status-negotiation:hover { color: #f97316; border-color: #f97316; }
    .status-closed_won.active, .status-closed_won:hover { color: var(--success); border-color: var(--success); }
    .status-closed_lost.active, .status-closed_lost:hover { color: var(--danger); border-color: var(--danger); }

    .add-activity { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 12px; padding: 18px; margin-bottom: 20px; }
    .activity-type-row { display: flex; gap: 6px; margin-bottom: 12px; flex-wrap: wrap; }
    .type-btn { background: var(--bg-hover); border: 1px solid var(--border); border-radius: 20px; padding: 5px 12px; font-size: 12px; cursor: pointer; color: var(--text-muted); transition: all 0.15s; &.active { background: var(--accent-subtle); border-color: var(--accent); color: var(--accent); } }
    .activity-input-row { display: flex; gap: 10px; align-items: flex-start; }
    .activity-input { flex: 1; background: var(--bg-input); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; color: var(--text-primary); font-size: 13.5px; resize: vertical; outline: none; font-family: inherit; &:focus { border-color: var(--accent); } &::placeholder { color: var(--text-muted); } }
    .timeline { display: flex; flex-direction: column; position: relative; padding-left: 24px; }
    .timeline::before { content: ''; position: absolute; left: 6px; top: 8px; bottom: 8px; width: 1px; background: var(--border); }
    .timeline-item { display: flex; gap: 14px; padding: 12px 0; position: relative; }
    .timeline-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; position: absolute; left: -21px; border: 2px solid var(--bg-base); }
    .dot-email_sent { background: #60a5fa; } .dot-call_made { background: var(--success); } .dot-meeting_scheduled { background: #a78bfa; } .dot-note_added { background: var(--text-muted); } .dot-status_changed { background: var(--accent); }
    .timeline-body { flex: 1; }
    .timeline-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .activity-type-badge { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 2px 7px; border-radius: 4px; background: var(--bg-hover); color: var(--text-muted); }
    .type-status_changed { background: var(--accent-subtle) !important; color: var(--accent) !important; }
    .timeline-meta { font-size: 12px; color: var(--text-muted); }
    .timeline-content { font-size: 13.5px; color: var(--text-secondary); line-height: 1.5; }
    .empty-timeline { color: var(--text-muted); font-size: 13px; padding: 20px 0; }

    .ai-tab { }
    .ai-score-card { display: flex; gap: 28px; background: var(--bg-surface); border: 1px solid var(--border); border-radius: 16px; padding: 28px; align-items: flex-start; }
    .ai-score-ring { width: 100px; height: 100px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; border: 4px solid; }
    .ring-hot { border-color: #ef4444; background: rgba(239,68,68,0.08); }
    .ring-warm { border-color: #f59e0b; background: rgba(245,158,11,0.08); }
    .ring-cold { border-color: #60a5fa; background: rgba(96,165,250,0.08); }
    .score-num { font-family: var(--font-display); font-size: 32px; font-weight: 800; color: var(--text-primary); line-height: 1; }
    .score-label { font-size: 11px; color: var(--text-muted); }
    .ai-badge-large { font-size: 16px; font-weight: 700; margin-bottom: 10px; }
    .badge-hot { color: #ef4444; } .badge-warm { color: #f59e0b; } .badge-cold { color: #60a5fa; }
    .ai-reason { color: var(--text-secondary); font-size: 14px; line-height: 1.6; margin: 0 0 8px; }
    .ai-hint { color: var(--text-muted); font-size: 12px; margin: 0; }
    .unscored { display: flex; align-items: center; gap: 16px; padding: 28px; background: var(--bg-surface); border: 1px solid var(--border); border-radius: 12px; color: var(--text-muted); font-size: 14px; }
    .unscored-icon { font-size: 32px; }

    .upload-zone { border: 2px dashed var(--border); border-radius: 12px; padding: 28px; text-align: center; margin-bottom: 16px; transition: border-color 0.15s; &:hover { border-color: var(--accent); } }
    .upload-text { font-size: 14px; color: var(--text-secondary); }
    .upload-link { background: none; border: none; color: var(--accent); cursor: pointer; font-size: 14px; font-weight: 600; text-decoration: underline; }
    .upload-hint { font-size: 12px; color: var(--text-muted); margin-top: 6px; }
    .attachment-list { display: flex; flex-direction: column; gap: 8px; }
    .attachment-row { display: flex; align-items: center; gap: 10px; background: var(--bg-surface); border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; font-size: 13px; }
    .att-icon { font-size: 18px; } .att-name { flex: 1; font-weight: 500; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .att-size { color: var(--text-muted); font-size: 12px; } .att-download { color: var(--accent); text-decoration: none; font-size: 12px; font-weight: 600; } .att-delete { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 18px; &:hover { color: var(--danger); } }
    .empty-att { color: var(--text-muted); font-size: 13px; padding: 12px 0; }

    .status-chip { font-size: 11px; font-weight: 600; text-transform: uppercase; padding: 3px 7px; border-radius: 5px; white-space: nowrap; }
    .status-new { background: var(--bg-hover); color: var(--text-muted); } .status-contacted { background: rgba(96,165,250,0.15); color: #60a5fa; } .status-qualified { background: rgba(167,139,250,0.15); color: #a78bfa; } .status-proposal { background: rgba(245,158,11,0.15); color: #f59e0b; } .status-negotiation { background: rgba(249,115,22,0.15); color: #f97316; } .status-closed_won { background: var(--success-subtle); color: var(--success); } .status-closed_lost { background: var(--danger-subtle); color: var(--danger); }
    .priority-dot { font-size: 12.5px; font-weight: 600; }
    .p-high { color: var(--danger); } .p-medium { color: #f59e0b; } .p-low { color: var(--text-muted); }
    .loading-page { display: flex; align-items: center; justify-content: height: 60vh; }
    .spinner { width: 32px; height: 32px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class LeadDetailComponent implements OnInit {
  lead = signal<Lead | null>(null);
  activeTab = signal<Tab>('details');
  selectedType = signal<ActivityType>('note_added');
  activityContent = new FormControl('', Validators.required);
  showReplyModal = signal(false);

  tabs = [
    { key: 'details' as Tab, label: 'Details' },
    { key: 'timeline' as Tab, label: 'Timeline' },
    { key: 'ai' as Tab, label: '🤖 AI Score' },
    { key: 'attachments' as Tab, label: 'Attachments' },
  ];

  activityTypes = [
    { value: 'note_added' as ActivityType, label: 'Note', icon: '📝' },
    { value: 'call_made' as ActivityType, label: 'Call', icon: '📞' },
    { value: 'email_sent' as ActivityType, label: 'Email', icon: '✉️' },
    { value: 'meeting_scheduled' as ActivityType, label: 'Meeting', icon: '📅' },
  ];

  statuses = ['new','contacted','qualified','proposal','negotiation','closed_won','closed_lost'] as const;

  constructor(private route: ActivatedRoute, private router: Router, private leadSvc: LeadService) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.leadSvc.get(id).subscribe(l => this.lead.set(l));
  }

  updateStatus(status: string) {
    this.leadSvc.update(this.lead()!.id, { status: status as any }).subscribe(u =>
      this.lead.set({ ...this.lead()!, ...u })
    );
  }

  addActivity() {
    const l = this.lead();
    if (!l || !this.activityContent.value?.trim()) return;
    this.leadSvc.addActivity(l.id, this.selectedType(), this.activityContent.value!).subscribe(act => {
      this.lead.set({ ...l, activities: [act, ...(l.activities ?? [])] });
      this.activityContent.reset();
    });
  }

  deleteLead() {
    if (!confirm('Delete this lead?')) return;
    this.leadSvc.delete(this.lead()!.id).subscribe(() => this.router.navigate(['/leads']));
  }

  onFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.uploadFile(file);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) this.uploadFile(file);
  }

  uploadFile(file: File) {
    const l = this.lead()!;
    this.leadSvc.uploadAttachment(l.id, file).subscribe(att =>
      this.lead.set({ ...l, attachments: [...(l.attachments ?? []), att] })
    );
  }

  deleteAttachment(id: number) {
    const l = this.lead()!;
    this.leadSvc.deleteAttachment(l.id, id).subscribe(() =>
      this.lead.set({ ...l, attachments: l.attachments?.filter(a => a.id !== id) })
    );
  }

  isOverdue(d: string | null) { return d ? new Date(d) < new Date() : false; }
  formatSize(b: number) { return b < 1024 ? `${b} B` : b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`; }
}
