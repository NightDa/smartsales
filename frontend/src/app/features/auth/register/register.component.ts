import { Component, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

function passwordMatch(ctrl: AbstractControl): ValidationErrors | null {
  const pw  = ctrl.get('password')?.value;
  const cfg = ctrl.get('password_confirmation')?.value;
  return pw && cfg && pw !== cfg ? { mismatch: true } : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-brand">
          <div class="brand-mark">S</div>
          <div class="brand-name">SmartSales AI</div>
        </div>
        <h1 class="auth-title">Create account</h1>
        <p class="auth-sub">The first account becomes admin</p>

        <form [formGroup]="form" (ngSubmit)="submit()" class="auth-form">
          <div class="field">
            <label class="field-label">Name</label>
            <input class="field-input" formControlName="name" placeholder="Your name"
                   [class.error]="invalid('name')" />
          </div>
          <div class="field">
            <label class="field-label">Email</label>
            <input class="field-input" type="email" formControlName="email" placeholder="you@company.com"
                   [class.error]="invalid('email')" />
          </div>
          <div class="field">
            <label class="field-label">Password</label>
            <input class="field-input" type="password" formControlName="password"
                   placeholder="Min 8 chars, mixed case + number"
                   [class.error]="invalid('password')" />
          </div>
          <div class="field">
            <label class="field-label">Confirm Password</label>
            <input class="field-input" type="password" formControlName="password_confirmation"
                   [class.error]="form.errors?.['mismatch'] && form.get('password_confirmation')?.touched" />
            <span class="field-error" *ngIf="form.errors?.['mismatch'] && form.get('password_confirmation')?.touched">
              Passwords don't match
            </span>
          </div>
          <div class="api-error" *ngIf="error()">{{ error() }}</div>
          <button type="submit" class="btn-primary" [disabled]="loading()">
            <span *ngIf="!loading()">Create account</span>
            <span *ngIf="loading()" class="spinner"></span>
          </button>
        </form>

        <p class="auth-footer">Already have an account? <a routerLink="/login">Sign in</a></p>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height: 100vh; background: var(--bg-base); display: flex; align-items: center; justify-content: center; padding: 24px; }
    .auth-card { width: 100%; max-width: 380px; background: var(--bg-surface); border: 1px solid var(--border); border-radius: 16px; padding: 36px 32px; }
    .auth-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 28px; }
    .brand-mark { width: 32px; height: 32px; background: var(--accent); color: var(--bg-base); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-weight: 700; font-size: 15px; }
    .brand-name { font-family: var(--font-display); font-weight: 600; font-size: 15px; color: var(--text-primary); }
    .auth-title { font-size: 22px; font-family: var(--font-display); font-weight: 700; color: var(--text-primary); margin: 0 0 6px; }
    .auth-sub { color: var(--text-muted); font-size: 13px; margin: 0 0 28px; }
    .auth-form { display: flex; flex-direction: column; gap: 16px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field-label { font-size: 12px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.04em; }
    .field-input { background: var(--bg-input); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; color: var(--text-primary); font-size: 14px; outline: none; transition: border-color 0.15s; &::placeholder { color: var(--text-muted); } &:focus { border-color: var(--accent); } &.error { border-color: var(--danger); } }
    .field-error { color: var(--danger); font-size: 12px; }
    .api-error { background: var(--danger-subtle); color: var(--danger); padding: 10px 12px; border-radius: 8px; font-size: 13px; }
    .btn-primary { background: var(--accent); color: var(--bg-base); border: none; border-radius: 8px; padding: 11px; font-size: 14px; font-weight: 600; cursor: pointer; transition: opacity 0.15s; display: flex; align-items: center; justify-content: center; min-height: 42px; &:hover:not(:disabled) { opacity: 0.88; } &:disabled { opacity: 0.5; cursor: not-allowed; } }
    .spinner { width: 16px; height: 16px; border: 2px solid rgba(0,0,0,0.2); border-top-color: var(--bg-base); border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .auth-footer { text-align: center; font-size: 13px; color: var(--text-muted); margin: 20px 0 0; a { color: var(--accent); text-decoration: none; font-weight: 500; } }
  `]
})
export class RegisterComponent {
  form = this.fb.group({
    name:                  ['', Validators.required],
    email:                 ['', [Validators.required, Validators.email]],
    password:              ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation: ['', Validators.required],
  }, { validators: passwordMatch });

  loading = signal(false);
  error   = signal('');

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  invalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c.touched);
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    const { name, email, password, password_confirmation } = this.form.value;
    this.auth.register(name!, email!, password!, password_confirmation!).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: err => { this.error.set(err.error?.message ?? 'Registration failed.'); this.loading.set(false); },
    });
  }
}
