import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService, AnomalyService } from '../../../core/services/api.services';
import { DashboardStats, Anomaly, LeadStatus } from '../../../core/models';

const STATUS_ORDER: LeadStatus[] = [
  'new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'
];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, TitleCasePipe],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-sub">Sales pipeline at a glance</p>
        </div>
        <a routerLink="/leads/new" class="btn-primary">+ New Lead</a>
      </header>

      <!-- Loading state -->
      <div class="loading-grid" *ngIf="loading()">
        <div class="skeleton" *ngFor="let i of [1,2,3,4]"></div>
      </div>

      <ng-container *ngIf="stats() as s">
        <!-- Summary cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Total Leads</div>
            <div class="stat-value">{{ s.summary.total_leads }}</div>
          </div>
          <div class="stat-card accent">
            <div class="stat-label">Pipeline Value</div>
            <div class="stat-value">{{ s.summary.total_pipeline / 100 | currency }}</div>
          </div>
          <div class="stat-card success">
            <div class="stat-label">Won This Month</div>
            <div class="stat-value">{{ s.summary.won_this_month / 100 | currency }}</div>
          </div>
          <div class="stat-card" [class.warning]="s.summary.overdue_followups > 0">
            <div class="stat-label">Overdue Follow-ups</div>
            <div class="stat-value">{{ s.summary.overdue_followups }}</div>
          </div>
        </div>

        <!-- Pipeline funnel -->
        <div class="section">
          <h2 class="section-title">Pipeline</h2>
          <div class="pipeline">
            <ng-container *ngFor="let status of statusOrder">
              <ng-container *ngIf="s.pipeline_by_status[status] as p">
                <div class="pipeline-stage" *ngIf="p.count > 0">
                  <div class="stage-bar-wrap">
                    <div class="stage-bar" [class]="'stage-' + status"
                         [style.width.%]="barWidth(p.count, s.summary.total_leads)"></div>
                  </div>
                  <div class="stage-info">
                    <span class="stage-label">{{ status | titlecase }}</span>
                    <span class="stage-count">{{ p.count }} · {{ p.total_value / 100 | currency:'USD':'symbol':'1.0-0' }}</span>
                  </div>
                </div>
              </ng-container>
            </ng-container>
          </div>
        </div>

        <!-- Hot leads + Anomalies row -->
        <div class="two-col">

          <!-- Hot leads -->
          <div class="section">
            <h2 class="section-title">🔥 Hot Leads</h2>
            <div class="lead-list" *ngIf="s.hot_leads.length; else noHot">
              <a *ngFor="let lead of s.hot_leads"
                 [routerLink]="['/leads', lead.id]"
                 class="lead-row">
                <div class="lead-score" [class]="'badge-' + lead.ai_badge">
                  {{ lead.ai_score }}
                </div>
                <div class="lead-info">
                  <div class="lead-title">{{ lead.title }}</div>
                  <div class="lead-meta">{{ lead.company?.name }} · {{ lead.value / 100 | currency:'USD':'symbol':'1.0-0' }}</div>
                </div>
                <div class="status-chip" [class]="'status-' + lead.status">{{ lead.status | titlecase }}</div>
              </a>
            </div>
            <ng-template #noHot>
              <p class="empty-note">No hot leads right now. Keep following up!</p>
            </ng-template>
          </div>

          <!-- Anomalies -->
          <div class="section">
            <h2 class="section-title">⚠️ At Risk</h2>
            <div class="anomaly-list" *ngIf="anomalies().length; else noAnomalies">
              <div *ngFor="let a of anomalies()" class="anomaly-card" [class]="'risk-' + a.risk_level">
                <div class="anomaly-header">
                  <span class="risk-badge" [class]="'risk-' + a.risk_level">{{ a.risk_level | titlecase }}</span>
                  <span class="anomaly-days">{{ a.days_stalled }}d stalled</span>
                </div>
                <div class="anomaly-title">{{ a.lead_title }}</div>
                <div class="anomaly-company">{{ a.company }}</div>
                <div class="anomaly-suggestion">💡 {{ a.suggestion }}</div>
              </div>
            </div>
            <ng-template #noAnomalies>
              <p class="empty-note">No at-risk deals detected. 🎉</p>
            </ng-template>
          </div>

        </div>

        <!-- Leaderboard -->
        <div class="section" *ngIf="s.leaderboard">
          <h2 class="section-title">Leaderboard</h2>
          <table class="leaderboard">
            <thead>
              <tr>
                <th>#</th>
                <th>Agent</th>
                <th>Deals Won</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let agent of s.leaderboard; let i = index" [class.top]="i === 0">
                <td class="rank">{{ i + 1 }}</td>
                <td>{{ agent.name }}</td>
                <td>{{ agent.won_count }}</td>
                <td>{{ (agent.won_value ?? 0) / 100 | currency:'USD':'symbol':'1.0-0' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

      </ng-container>
    </div>
  `,
  styles: [`
    .page { padding: 28px 32px; max-width: 1200px; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; }
    .page-title { font-family: var(--font-display); font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0 0 4px; }
    .page-sub { color: var(--text-muted); font-size: 14px; margin: 0; }
    .btn-primary {
      background: var(--accent); color: var(--bg-base); border: none; border-radius: 8px;
      padding: 9px 18px; font-size: 13.5px; font-weight: 600; cursor: pointer; text-decoration: none;
      display: inline-flex; align-items: center; transition: opacity 0.15s;
      &:hover { opacity: 0.88; }
    }

    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
    @media (max-width: 900px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }

    .stat-card {
      background: var(--bg-surface); border: 1px solid var(--border); border-radius: 12px;
      padding: 20px; transition: border-color 0.15s;
      &.accent { border-color: var(--accent); background: var(--accent-subtle); }
      &.success { border-color: var(--success); background: var(--success-subtle); }
      &.warning { border-color: var(--warning); background: var(--warning-subtle); }
    }
    .stat-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 8px; }
    .stat-value { font-family: var(--font-display); font-size: 26px; font-weight: 700; color: var(--text-primary); }

    .section { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px; margin-bottom: 20px; }
    .section-title { font-size: 14px; font-weight: 700; color: var(--text-primary); margin: 0 0 16px; text-transform: uppercase; letter-spacing: 0.04em; }

    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    @media (max-width: 800px) { .two-col { grid-template-columns: 1fr; } }

    /* Pipeline bars */
    .pipeline { display: flex; flex-direction: column; gap: 10px; }
    .pipeline-stage { display: grid; grid-template-columns: 1fr auto; gap: 12px; align-items: center; }
    .stage-bar-wrap { background: var(--bg-hover); border-radius: 4px; height: 8px; overflow: hidden; }
    .stage-bar { height: 100%; border-radius: 4px; transition: width 0.6s ease; min-width: 4px; }
    .stage-new        { background: var(--text-muted); }
    .stage-contacted  { background: #60a5fa; }
    .stage-qualified  { background: #a78bfa; }
    .stage-proposal   { background: #f59e0b; }
    .stage-negotiation{ background: #f97316; }
    .stage-closed_won { background: var(--success); }
    .stage-closed_lost{ background: var(--danger); }
    .stage-info { display: flex; justify-content: space-between; gap: 8px; min-width: 200px; }
    .stage-label { font-size: 12.5px; font-weight: 500; color: var(--text-secondary); }
    .stage-count { font-size: 12px; color: var(--text-muted); }

    /* Hot leads */
    .lead-list { display: flex; flex-direction: column; gap: 4px; }
    .lead-row {
      display: flex; align-items: center; gap: 12px; padding: 10px 8px; border-radius: 8px;
      text-decoration: none; color: inherit; transition: background 0.15s;
      &:hover { background: var(--bg-hover); }
    }
    .lead-score {
      width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center;
      justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0;
    }
    .badge-hot  { background: rgba(239,68,68,0.15); color: #ef4444; }
    .badge-warm { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .badge-cold { background: rgba(96,165,250,0.15); color: #60a5fa; }
    .lead-info { flex: 1; min-width: 0; }
    .lead-title { font-size: 13.5px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .lead-meta { font-size: 12px; color: var(--text-muted); }

    .status-chip { font-size: 11px; font-weight: 600; text-transform: uppercase; padding: 3px 7px; border-radius: 5px; white-space: nowrap; letter-spacing: 0.03em; }
    .status-new         { background: var(--bg-hover); color: var(--text-muted); }
    .status-contacted   { background: rgba(96,165,250,0.15); color: #60a5fa; }
    .status-qualified   { background: rgba(167,139,250,0.15); color: #a78bfa; }
    .status-proposal    { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .status-negotiation { background: rgba(249,115,22,0.15); color: #f97316; }
    .status-closed_won  { background: var(--success-subtle); color: var(--success); }
    .status-closed_lost { background: var(--danger-subtle); color: var(--danger); }

    /* Anomalies */
    .anomaly-list { display: flex; flex-direction: column; gap: 10px; }
    .anomaly-card { padding: 14px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-hover); }
    .anomaly-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
    .risk-badge { font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 7px; border-radius: 4px; letter-spacing: 0.05em; }
    .risk-high   .risk-badge { background: var(--danger-subtle); color: var(--danger); }
    .risk-medium .risk-badge { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .risk-low    .risk-badge { background: var(--success-subtle); color: var(--success); }
    .anomaly-days { font-size: 11px; color: var(--text-muted); }
    .anomaly-title { font-size: 13.5px; font-weight: 600; color: var(--text-primary); margin-bottom: 2px; }
    .anomaly-company { font-size: 12px; color: var(--text-muted); margin-bottom: 8px; }
    .anomaly-suggestion { font-size: 12.5px; color: var(--text-secondary); line-height: 1.5; }

    /* Leaderboard */
    .leaderboard { width: 100%; border-collapse: collapse; }
    .leaderboard th { text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); padding: 0 12px 10px 0; border-bottom: 1px solid var(--border); }
    .leaderboard td { padding: 10px 12px 10px 0; font-size: 13.5px; color: var(--text-secondary); border-bottom: 1px solid var(--border); }
    .leaderboard tr.top td { color: var(--text-primary); font-weight: 600; }
    .rank { font-family: var(--font-display); font-weight: 700; color: var(--accent) !important; }

    .loading-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
    .skeleton { height: 88px; background: var(--bg-surface); border-radius: 12px; animation: pulse 1.5s ease-in-out infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    .empty-note { color: var(--text-muted); font-size: 13px; padding: 8px 0; margin: 0; }
  `]
})
export class DashboardComponent implements OnInit {
  stats     = signal<DashboardStats | null>(null);
  anomalies = signal<Anomaly[]>([]);
  loading   = signal(true);
  statusOrder = STATUS_ORDER;

  constructor(
    private dashSvc: DashboardService,
    private anomalySvc: AnomalyService,
  ) {}

  ngOnInit() {
    this.dashSvc.stats().subscribe({
      next:  s => { this.stats.set(s); this.loading.set(false); },
      error: () => this.loading.set(false),
    });

    this.anomalySvc.list().subscribe({
      next: r => this.anomalies.set(r.anomalies),
    });
  }

  barWidth(count: number, total: number): number {
    if (!total) return 0;
    return Math.max(2, Math.round((count / total) * 100));
  }
}
