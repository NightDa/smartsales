import { Component, signal, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="shell">
      <!-- Sidebar -->
      <aside class="sidebar" [class.collapsed]="collapsed()">
        <div class="sidebar-header">
          <div class="logo">
            <span class="logo-mark">S</span>
            <span class="logo-text" *ngIf="!collapsed()">SmartSales</span>
          </div>
          <button class="collapse-btn" (click)="collapsed.set(!collapsed())" aria-label="Toggle sidebar">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path *ngIf="!collapsed()" d="M11 2L5 8l6 6" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
              <path *ngIf="collapsed()" d="M5 2l6 6-6 6" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <nav class="nav">
          <a *ngFor="let item of navItems"
             [routerLink]="item.path"
             routerLinkActive="active"
             [routerLinkActiveOptions]="{ exact: item.path === '/' }"
             class="nav-item"
             [title]="collapsed() ? item.label : ''">
            <span class="nav-icon" [innerHTML]="item.icon"></span>
            <span class="nav-label" *ngIf="!collapsed()">{{ item.label }}</span>
          </a>
        </nav>

        <div class="sidebar-footer" *ngIf="!collapsed()">
          <div class="user-card">
            <div class="user-avatar">{{ initials() }}</div>
            <div class="user-info">
              <div class="user-name">{{ user()?.name }}</div>
              <div class="user-role">{{ user()?.role | titlecase }}</div>
            </div>
          </div>
          <button class="logout-btn" (click)="logout()">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      <!-- Main content -->
      <main class="main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .shell {
      display: flex;
      height: 100vh;
      background: var(--bg-base);
      overflow: hidden;
    }

    .sidebar {
      width: 220px;
      background: var(--bg-surface);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      transition: width 0.2s ease;
      flex-shrink: 0;
    }
    .sidebar.collapsed { width: 60px; }

    .sidebar-header {
      height: 60px;
      padding: 0 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      overflow: hidden;
    }
    .logo-mark {
      width: 28px;
      height: 28px;
      background: var(--accent);
      color: var(--bg-base);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-display);
      font-size: 14px;
      font-weight: 700;
      flex-shrink: 0;
    }
    .logo-text {
      font-family: var(--font-display);
      font-size: 15px;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
    }

    .collapse-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      flex-shrink: 0;
      &:hover { color: var(--text-primary); background: var(--bg-hover); }
    }

    .nav {
      flex: 1;
      padding: 12px 8px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border-radius: 8px;
      color: var(--text-muted);
      text-decoration: none;
      font-size: 13.5px;
      font-weight: 500;
      transition: all 0.15s;
      white-space: nowrap;
      overflow: hidden;
      &:hover {
        background: var(--bg-hover);
        color: var(--text-primary);
      }
      &.active {
        background: var(--accent-subtle);
        color: var(--accent);
      }
    }
    .nav-icon { flex-shrink: 0; display: flex; align-items: center; }

    .sidebar-footer {
      padding: 12px 10px;
      border-top: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .user-card {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .user-avatar {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: var(--accent);
      color: var(--bg-base);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      flex-shrink: 0;
    }
    .user-info { overflow: hidden; }
    .user-name { font-size: 12px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-role { font-size: 11px; color: var(--text-muted); }

    .logout-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 12.5px;
      cursor: pointer;
      padding: 6px 8px;
      border-radius: 6px;
      width: 100%;
      transition: all 0.15s;
      &:hover { background: var(--danger-subtle); color: var(--danger); }
    }

    .main {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
    }
  `]
})
export class ShellComponent {
  collapsed = signal(false);

  constructor(private auth: AuthService) {}

  user    = this.auth.currentUser;
  initials = computed(() => {
    const name = this.user()?.name ?? '';
    return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  });

  navItems: NavItem[] = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
               <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/>
               <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/>
               <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/>
               <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/>
             </svg>`,
    },
    {
      label: 'Leads',
      path: '/leads',
      icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
               <path d="M8 1a4 4 0 1 1 0 8A4 4 0 0 1 8 1zm0 9c-4 0-7 2-7 3v1h14v-1c0-1-3-3-7-3z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
             </svg>`,
    },
    {
      label: 'Companies',
      path: '/companies',
      icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
               <path d="M2 14V5l6-4 6 4v9H2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
               <rect x="6" y="9" width="4" height="5" stroke="currentColor" stroke-width="1.5"/>
             </svg>`,
    },
  ];

  logout() { this.auth.logout(); }
}
