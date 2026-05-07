import { Component, Input, Output, EventEmitter, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService } from '../../core/services/ai.service';
import { Lead } from '../../core/models';

@Component({
  selector: 'app-ai-reply-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop" (click)="close()">
      <div class="modal" (click)="$event.stopPropagation()">

        <div class="modal-header">
          <div class="modal-title">
            <span class="ai-spark">✦</span>
            AI Reply Generator
          </div>
          <button class="modal-close" (click)="close()">×</button>
        </div>

        <div class="modal-meta">
          To: <strong>{{ lead.contact_name }}</strong> at <strong>{{ lead.company?.name }}</strong>
        </div>

        <!-- Subject suggestions -->
        <div class="subject-section" *ngIf="!loadingSubjects() && subjects().length">
          <div class="section-label">Suggested subjects — click to use</div>
          <div class="subject-chips">
            <button *ngFor="let s of subjects()" class="subject-chip"
                    [class.selected]="selectedSubject() === s"
                    (click)="selectedSubject.set(s)">
              {{ s }}
            </button>
          </div>
          <div class="selected-subject" *ngIf="selectedSubject()">
            <span class="field-label">Subject:</span>
            <input class="subject-input" [(ngModel)]="editableSubject" />
          </div>
        </div>
        <div class="loading-subjects" *ngIf="loadingSubjects()">
          <span class="spinner-sm"></span> Generating subject lines…
        </div>

        <!-- Reply body -->
        <div class="reply-section">
          <div class="section-label">Email body</div>
          <div class="loading-reply" *ngIf="loadingReply()">
            <span class="spinner-sm"></span> Writing your email…
          </div>
          <textarea *ngIf="!loadingReply()" class="reply-textarea"
                    [(ngModel)]="replyText" rows="12"></textarea>
        </div>

        <!-- Actions -->
        <div class="modal-actions">
          <button class="btn-regenerate" (click)="generate()" [disabled]="loadingReply()">
            ↺ Regenerate
          </button>
          <div class="right-actions">
            <button class="btn-copy" (click)="copyToClipboard()" [disabled]="!replyText">
              {{ copied() ? '✓ Copied!' : 'Copy' }}
            </button>
            <a *ngIf="selectedSubject()"
               [href]="mailtoLink()" target="_blank"
               class="btn-mail">
              Open in Mail ↗
            </a>
            <button *ngIf="!selectedSubject()"
                    class="btn-mail disabled" disabled>
              Open in Mail ↗
            </button>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.65); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 20px; animation: fadeIn 0.15s; }
    @keyframes fadeIn { from { opacity: 0; } }
    .modal { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 16px; width: 100%; max-width: 620px; max-height: 90vh; display: flex; flex-direction: column; animation: slideUp 0.2s; overflow: hidden; }
    @keyframes slideUp { from { transform: translateY(16px); opacity: 0; } }

    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 0; }
    .modal-title { display: flex; align-items: center; gap: 8px; font-family: var(--font-display); font-size: 17px; font-weight: 700; color: var(--text-primary); }
    .ai-spark { color: var(--accent); font-size: 18px; animation: pulse 2s ease-in-out infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    .modal-close { background: none; border: none; font-size: 24px; color: var(--text-muted); cursor: pointer; padding: 0; line-height: 1; &:hover { color: var(--text-primary); } }

    .modal-meta { padding: 8px 24px 16px; font-size: 13px; color: var(--text-muted); border-bottom: 1px solid var(--border); }

    .subject-section { padding: 16px 24px; border-bottom: 1px solid var(--border); }
    .section-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 10px; }
    .subject-chips { display: flex; flex-direction: column; gap: 6px; }
    .subject-chip { background: var(--bg-hover); border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; font-size: 13px; color: var(--text-secondary); cursor: pointer; text-align: left; transition: all 0.15s; &:hover { border-color: var(--accent); color: var(--text-primary); } &.selected { border-color: var(--accent); background: var(--accent-subtle); color: var(--accent); } }
    .selected-subject { margin-top: 10px; display: flex; align-items: center; gap: 10px; }
    .field-label { font-size: 12px; font-weight: 600; color: var(--text-muted); white-space: nowrap; }
    .subject-input { flex: 1; background: var(--bg-input); border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; color: var(--text-primary); font-size: 13px; outline: none; &:focus { border-color: var(--accent); } }

    .loading-subjects { padding: 16px 24px; display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-muted); }

    .reply-section { flex: 1; overflow: hidden; display: flex; flex-direction: column; padding: 16px 24px; gap: 10px; min-height: 0; }
    .loading-reply { display: flex; align-items: center; gap: 10px; color: var(--text-muted); font-size: 13px; padding: 40px 0; justify-content: center; }
    .reply-textarea { flex: 1; background: var(--bg-input); border: 1px solid var(--border); border-radius: 10px; padding: 14px; color: var(--text-primary); font-size: 13.5px; font-family: var(--font-body); line-height: 1.65; resize: none; outline: none; &:focus { border-color: var(--accent); } }

    .modal-actions { display: flex; align-items: center; justify-content: space-between; padding: 14px 24px; border-top: 1px solid var(--border); gap: 10px; }
    .right-actions { display: flex; gap: 8px; }

    .btn-regenerate { background: var(--bg-hover); border: 1px solid var(--border); border-radius: 8px; padding: 8px 14px; font-size: 13px; color: var(--text-secondary); cursor: pointer; transition: all 0.15s; &:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); } &:disabled { opacity: 0.4; } }
    .btn-copy { background: var(--bg-hover); border: 1px solid var(--border); border-radius: 8px; padding: 8px 16px; font-size: 13px; font-weight: 600; color: var(--text-secondary); cursor: pointer; transition: all 0.15s; &:hover:not(:disabled) { border-color: var(--success); color: var(--success); } }
    .btn-mail { background: var(--accent); color: var(--bg-base); border: none; border-radius: 8px; padding: 8px 16px; font-size: 13px; font-weight: 700; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; transition: opacity 0.15s; &:hover { opacity: 0.85; } &.disabled { opacity: 0.4; cursor: not-allowed; } }

    .spinner-sm { display: inline-block; width: 14px; height: 14px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class AiReplyModalComponent implements OnInit {
  @Input({ required: true }) lead!: Lead;
  @Output() closed = new EventEmitter<void>();

  replyText      = signal('');
  subjects       = signal<string[]>([]);
  selectedSubject = signal('');
  editableSubject = '';
  loadingReply   = signal(false);
  loadingSubjects = signal(false);
  copied         = signal(false);

  constructor(private aiSvc: AiService) {}

  ngOnInit() {
    this.generate();
    this.loadSubjects();
  }

  generate() {
    this.loadingReply.set(true);
    this.aiSvc.generateReply(this.lead.id).subscribe({
      next: r => { this.replyText.set(r.reply); this.loadingReply.set(false); },
      error: () => { this.replyText.set('Failed to generate reply. Please check your OpenAI API key.'); this.loadingReply.set(false); }
    });
  }

  loadSubjects() {
    this.loadingSubjects.set(true);
    this.aiSvc.suggestSubjects(this.lead.id).subscribe({
      next: r => { this.subjects.set(r.subjects); this.loadingSubjects.set(false); },
      error: () => this.loadingSubjects.set(false),
    });
  }

  selectSubject(s: string) {
    this.selectedSubject.set(s);
    this.editableSubject = s;
  }

  copyToClipboard() {
    const full = this.editableSubject
      ? `Subject: ${this.editableSubject}\n\n${this.replyText()}`
      : this.replyText();
    navigator.clipboard.writeText(full).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  mailtoLink(): string {
    const email = this.lead.contact_email ?? '';
    const subject = encodeURIComponent(this.editableSubject);
    const body = encodeURIComponent(this.replyText());
    return `mailto:${email}?subject=${subject}&body=${body}`;
  }

  close() { this.closed.emit(); }
}
