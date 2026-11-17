import { Component, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-brand">
          <div class="brand-mark">S</div>
          <div class="brand-name">SmartSales AI</div>
        </div>

        <h1 class="auth-title">Welcome back</h1>
        <p class="auth-sub">Sign in to your workspace</p>

        <form [formGroup]="form" (ngSubmit)="submit()" class="auth-form">
          <div class="field">
            <label class="field-label">Email</label>
            <input
              type="email"
              class="field-input"
              formControlName="email"
              placeholder="you@company.com"
              [class.error]="f['email'].invalid && f['email'].touched"
              autocomplete="email"
            />
            <span class="field-error" *ngIf="f['email'].invalid && f['email'].touched">
              Valid email required
            </span>
          </div>

          <div class="field">
            <label class="field-label">Password</label>
            <input
              type="password"
              class="field-input"
              formControlName="password"
              placeholder="••••••••"
              [class.error]="f['password'].invalid && f['password'].touched"
              autocomplete="current-password"
            />
            <span class="field-error" *ngIf="f['password'].invalid && f['password'].touched">
              Password required
            </span>
          </div>

          <div class="api-error" *ngIf="error()">{{ error() }}</div>

          <button type="submit" class="btn-primary" [disabled]="loading()">
            <span *ngIf="!loading()">Sign in</span>
            <span *ngIf="loading()" class="spinner"></span>
          </button>
        </form>

        <p class="auth-footer">
          No account? <a routerLink="/register">Create one</a>
        </p>

        <div class="demo-creds">
          <div class="demo-title">Demo credentials</div>
          <div class="demo-row" (click)="fillDemo('admin@smartsales.dev')">
            <span class="demo-role admin">Admin</span>
            <span>admin&#64;smartsales.dev</span>
          </div>
          <div class="demo-row" (click)="fillDemo('john@smartsales.dev')">
            <span class="demo-role agent">Agent</span>
            <span>john&#64;smartsales.dev</span>
          </div>
          <div class="demo-note">Password: <code>Password1</code></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      background: var(--bg-base);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .auth-card {
      width: 100%;
      max-width: 380px;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 36px 32px;
    }
    .auth-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 28px;
    }
    .brand-mark {
      width: 32px;
      height: 32px;
      background: var(--accent);
      color: var(--bg-base);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 15px;
    }
    .brand-name {
      font-family: var(--font-display);
      font-weight: 600;
      font-size: 15px;
      color: var(--text-primary);
    }
    .auth-title {
      font-size: 22px;
      font-family: var(--font-display);
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 6px;
    }
    .auth-sub {
      color: var(--text-muted);
      font-size: 14px;
      margin: 0 0 28px;
    }
    .auth-form { display: flex; flex-direction: column; gap: 18px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field-label { font-size: 12.5px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.04em; }
    .field-input {
      background: var(--bg-input);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px 12px;
      color: var(--text-primary);
      font-size: 14px;
      outline: none;
      transition: border-color 0.15s;
      &::placeholder { color: var(--text-muted); }
      &:focus { border-color: var(--accent); }
      &.error { border-color: var(--danger); }
    }
    .field-error { color: var(--danger); font-size: 12px; }
    .api-error {
      background: var(--danger-subtle);
      color: var(--danger);
      padding: 10px 12px;
      border-radius: 8px;
      font-size: 13px;
    }
    .btn-primary {
      background: var(--accent);
      color: var(--bg-base);
      border: none;
      border-radius: 8px;
      padding: 11px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.15s;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 42px;
      &:hover:not(:disabled) { opacity: 0.88; }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
    .spinner {
      width: 16px; height: 16px;
      border: 2px solid rgba(0,0,0,0.2);
      border-top-color: var(--bg-base);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .auth-footer {
      text-align: center;
      font-size: 13px;
      color: var(--text-muted);
      margin: 20px 0 0;
      a { color: var(--accent); text-decoration: none; font-weight: 500; }
    }
    .demo-creds {
      margin-top: 24px;
      background: var(--bg-hover);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 14px;
      font-size: 12.5px;
    }
    .demo-title { font-weight: 600; color: var(--text-muted); margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.04em; font-size: 11px; }
    .demo-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 5px 0;
      color: var(--text-secondary);
      cursor: pointer;
      border-radius: 4px;
      &:hover { color: var(--accent); }
    }
    .demo-role {
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      &.admin { background: var(--accent-subtle); color: var(--accent); }
      &.agent { background: var(--success-subtle); color: var(--success); }
    }
    .demo-note { color: var(--text-muted); margin-top: 8px; font-size: 12px; code { color: var(--text-primary); } }
  `]
})
export class LoginComponent {
  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  loading = signal(false);
  error   = signal('');

  get f() { return this.form.controls; }

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
  ) {}

  fillDemo(email: string) {
    this.form.patchValue({ email, password: 'Password1' });
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');

    const { email, password } = this.form.value;
    this.auth.login(email!, password!).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: err => {
        this.error.set(err.error?.message ?? 'Login failed. Please try again.');
        this.loading.set(false);
      },
    });
  }
}
