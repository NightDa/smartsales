# SmartSales AI — Frontend (Phase 3)

Angular 17 SPA for the SmartSales CRM. Standalone components, signals-based state, JWT auth.

---

## Quick Start

### Prerequisites
- Node.js 18+
- Angular CLI 17: `npm install -g @angular/cli@17`

### Install & run
```bash
cd frontend
npm install
ng serve
# App runs at http://localhost:4200
```

### Point to your backend
Edit `src/environments/environment.ts`:
```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',
};
```

---

## Project Structure

```
src/app/
├── core/
│   ├── models/           # TypeScript interfaces for all API types
│   ├── services/
│   │   ├── auth.service.ts       # JWT login/register/logout/refresh + signals
│   │   ├── lead.service.ts       # Lead CRUD + activities + attachments
│   │   └── api.services.ts       # Company, Dashboard, Notification, Anomaly
│   ├── interceptors/
│   │   └── jwt.interceptor.ts    # Attaches Bearer token; handles 401 refresh
│   └── guards/
│       └── auth.guard.ts         # authGuard (protected) + guestGuard (login page)
│
├── layout/
│   └── shell/            # Sidebar + main content outlet
│
├── features/
│   ├── auth/
│   │   ├── login/        # Login form with demo credentials
│   │   └── register/     # Register (first user auto-admin)
│   ├── dashboard/        # Stats cards, pipeline funnel, hot leads, anomalies
│   ├── leads/
│   │   ├── leads-list/   # Table with search debounce, filters, sort, pagination
│   │   ├── lead-form/    # Create + edit form (shared component, route-driven)
│   │   └── lead-detail/  # Tabbed view: Details / Timeline / AI Score / Attachments
│   └── companies/
│       └── companies-list/ # Card grid with inline create/edit modal
│
└── app.routes.ts         # Lazy-loaded routes with guards
```

---

## Key Patterns

### Signals for state
All components use Angular 17 signals (`signal()`, `computed()`) rather than BehaviorSubjects, making state reads synchronous and change detection precise.

### JWT interceptor flow
```
Request → attach Bearer token
  ↓
401 response → call /auth/refresh → retry original request
  ↓
Refresh fails → clear storage → navigate to /login
```

### Lazy loading
Every feature component is loaded with `loadComponent()` — the initial bundle only contains auth screens. Route chunks are fetched on demand.

### Search debounce
Leads and companies search uses `debounceTime(300)` + `distinctUntilChanged()` so the API is only called after the user stops typing.

### Money handling
Values are stored as cents (integers) in the API. The frontend converts on display (`value / 100 | currency`) and on submission (`Math.round(dollars * 100)`).

---

## Design System

Dark theme with CSS variables defined in `src/styles.css`.

| Token | Value | Purpose |
|-------|-------|---------|
| `--accent` | `#00d4aa` | Primary actions, active states |
| `--bg-base` | `#0d0f12` | Page background |
| `--bg-surface` | `#13161b` | Cards, panels |
| `--font-display` | Syne | Headings, logos |
| `--font-body` | DM Sans | All body text |
| `--font-mono` | JetBrains Mono | Numbers, code |

---

## Build for Production

```bash
ng build --configuration production
# Output in dist/smartsales-frontend/
```

Deploy the `dist/` folder to Vercel or Netlify.
Set environment variable or update `environment.prod.ts` with your Railway API URL.

### Vercel (recommended)
```bash
npm install -g vercel
vercel --prod
```

---

## What's Next — Phase 4 (AI Features)
- `AiService` with natural language filter builder, reply generator
- AI search bar component in the shell header
- Reply generator modal in lead detail
- Real-time anomaly polling with badge in sidebar
