import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService } from '../../../core/services/ai.service';
import { Lead } from '../../../core/models';

type Tone = 'professional' | 'friendly' | 'urgent';

@Component({
  selector: 'app-reply-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop" (click)="close.emit()">
      <div class="modal" (click)="$event.stopPropagation()">

        <div class="modal-header">
          <div class="modal-title">
            <span class="modal-icon">✦</span>
            AI Reply Generator
          </div>
          <button class="modal-close" (click)="close.emit()">×</button>
        </div>

        <div class="modal-meta">
          Generating reply for <strong>{{ lead.contact_name }}</strong> at <strong>{{ lead.company?.name }}</strong>
        </div>

        <!-- Tone selector -->
        <div class="tone-row">
          <span class="tone-label">Tone:</span>
          <button *ngFor="let t of tones"
                  class="tone-btn" [class.active]="selectedTone() === t.value"
                  (click)="selectedTone.set(t.value)">
            {{ t.icon }} {{ t.label }}
          </button>
        </div>

        <!-- Generate button -->
        <button class="generate-btn" (click)="generate()" [disabled]="loading()">
          <span *ngIf="!loading()">✦ Generate Email</span>
          <span *ngIf="loading()" class="generating">
            <span class="spinner"></span> Writing your email…
          </span>
        </button>

        <!-- Generated reply -->
        <div class="reply-section" *ngIf="reply()">
          <div class="reply-toolbar">
            <span class="reply-label">Generated Email</span>
            <div class="reply-actions">
              <button class="toolbar-btn" (click)="copyReply()" [class.copied]="copied()">
                {{ copied() ? '✓ Copied' : 'Copy' }}
              </button>
              <button class="toolbar-btn" (click)="generate()">Regenerate</button>
            </div>
          </div>
          <textarea
            class="reply-textarea"
            [(ngModel)]="editableReply"
            rows="14"
          ></textarea>
          <div class="reply-hint">You can edit the text above before sending.</div>
        </div>

        <div class="error-msg" *ngIf="error()">{{ error() }}</div>

      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 20px; animation: fadeIn 0.15s; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .modal { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 16px; padding: 28px; width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; animation: slideUp 0.2s; }
    @keyframes slideUp { from { transform: translateY(16px); opacity: 0; } to { transform: none; opacity: 1; } }

    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .modal-title { display: flex; align-items: center; gap: 8px; font-family: var(--font-display); font-size: 18px; font-weight: 700; color: var(--text-primary); }
    .modal-icon { color: var(--accent); }
    .modal-close { background: none; border: none; font-size: 22px; color: var(--text-muted); cursor: pointer; padding: 0; line-height: 1; &:hover { color: var(--text-primary); } }
    .modal-meta { font-size: 13px; color: var(--text-muted); margin-bottom: 18px; strong { color: var(--text-secondary); } }

    .tone-row { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
    .tone-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted); margin-right: 4px; }
    .tone-btn { background: var(--bg-hover); border: 1px solid var(--border); border-radius: 20px; padding: 6px 14px; font-size: 13px; cursor: pointer; color: var(--text-muted); font-family: var(--font-body); transition: all 0.15s; &.active { background: var(--accent-subtle); border-color: var(--accent); color: var(--accent); font-weight: 600; } &:hover:not(.active) { color: var(--text-primary); border-color: var(--text-muted); } }

    .generate-btn { width: 100%; background: var(--accent); color: var(--bg-base); border: none; border-radius: 10px; padding: 13px; font-size: 15px; font-weight: 700; cursor: pointer; font-family: var(--font-display); transition: opacity 0.15s; display: flex; align-items: center; justify-content: center; min-height: 50px; &:hover:not(:disabled) { opacity: 0.88; } &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .generating { display: flex; align-items: center; gap: 10px; }
    .spinner { width: 16px; height: 16px; border: 2px solid rgba(0,0,0,0.2); border-top-color: var(--bg-base); border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .reply-section { margin-top: 20px; }
    .reply-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .reply-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
    .reply-actions { display: flex; gap: 6px; }
    .toolbar-btn { background: var(--bg-hover); border: 1px solid var(--border); border-radius: 6px; padding: 5px 12px; font-size: 12px; cursor: pointer; color: var(--text-secondary); font-family: var(--font-body); transition: all 0.15s; &:hover { border-color: var(--accent); color: var(--accent); } &.copied { border-color: var(--success); color: var(--success); } }
    .reply-textarea { width: 100%; background: var(--bg-input); border: 1px solid var(--border); border-radius: 10px; padding: 14px; color: var(--text-primary); font-size: 13.5px; font-family: var(--font-body); line-height: 1.7; resize: vertical; outline: none; box-sizing: border-box; &:focus { border-color: var(--accent); } }
    .reply-hint { font-size: 11.5px; color: var(--text-muted); margin-top: 6px; }
    .error-msg { margin-top: 12px; background: var(--danger-subtle); color: var(--danger); padding: 10px 14px; border-radius: 8px; font-size: 13px; }
  `]
})
export class ReplyGeneratorComponent {
  @Input() lead!: Lead;
  @Output() close = new EventEmitter<void>();

  selectedTone = signal<Tone>('professional');
  loading  = signal(false);
  error    = signal('');
  reply    = signal('');
  copied   = signal(false);
  editableReply = '';

  tones = [
    { value: 'professional' as Tone, label: 'Professional', icon: '👔' },
    { value: 'friendly'     as Tone, label: 'Friendly',     icon: '😊' },
    { value: 'urgent'       as Tone, label: 'Urgent',       icon: '⚡' },
  ];

  constructor(private aiSvc: AiService) {}

  generate() {
    this.loading.set(true);
    this.error.set('');

    this.aiSvc.generateReply(this.lead.id, this.selectedTone()).subscribe({
      next: res => {
        this.reply.set(res.reply);
        this.editableReply = res.reply;
        this.loading.set(false);
      },
      error: err => {
        this.error.set(err.error?.message ?? 'Failed to generate reply. Check your OpenAI key.');
        this.loading.set(false);
      },
    });
  }

  copyReply() {
    navigator.clipboard.writeText(this.editableReply).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }
}
