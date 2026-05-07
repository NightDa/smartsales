import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, throwError } from 'rxjs';
import { AuthResponse, User } from '../models';
import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'ss_token';
const USER_KEY  = 'ss_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = environment.apiUrl;

  // Reactive state — components read these signals directly
  private _user   = signal<User | null>(this.loadUser());
  private _token  = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  readonly currentUser  = this._user.asReadonly();
  readonly token        = this._token.asReadonly();
  readonly isLoggedIn   = computed(() => !!this._token());
  readonly isAdmin      = computed(() => this._user()?.role === 'admin');
  readonly canManageAll = computed(() =>
    ['admin', 'sales_manager'].includes(this._user()?.role ?? '')
  );

  constructor(private http: HttpClient, private router: Router) {}

  // ── Auth actions ──────────────────────────────────────────────────────────

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${this.api}/auth/login`, { email, password })
      .pipe(tap(res => this.persist(res)));
  }

  register(name: string, email: string, password: string, passwordConfirmation: string) {
    return this.http.post<AuthResponse>(`${this.api}/auth/register`, {
      name, email,
      password,
      password_confirmation: passwordConfirmation,
    }).pipe(tap(res => this.persist(res)));
  }

  logout() {
    this.http.post(`${this.api}/auth/logout`, {}).subscribe();
    this.clear();
    this.router.navigate(['/login']);
  }

  refreshToken() {
    return this.http.post<AuthResponse>(`${this.api}/auth/refresh`, {})
      .pipe(
        tap(res => this.persist(res)),
        catchError(err => {
          this.clear();
          this.router.navigate(['/login']);
          return throwError(() => err);
        })
      );
  }

  // ── Persistence helpers ───────────────────────────────────────────────────

  private persist(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this._token.set(res.access_token);
    this._user.set(res.user);
  }

  private clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._user.set(null);
  }

  private loadUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
