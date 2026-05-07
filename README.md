# SmartSales AI

AI-powered CRM — Laravel 11 backend + Angular 17 frontend.

---

## ⚠️ Windows Users — Fix Permission Error First

If you see this error during `composer install`:
```
Failed to open stream: Permission denied
```

**The cause:** Your project is inside `Documents\GitHub\` — Windows + GitHub Desktop + antivirus blocks Composer writing temp zip files there.

**The fix — choose one:**

### Option A (Easiest): Move to a short path
1. Extract the zip to **`C:\smartsales\`** instead of your GitHub folder
2. Open VS Code at `C:\smartsales\`
3. Run `composer install` — it will work

### Option B: Run the setup script as Administrator
1. Right-click `setup-windows.bat` in the project root
2. Click **"Run as administrator"**
3. It copies the project to `C:\smartsales\`, fixes permissions, and runs the full setup automatically

### Option C: Manual permission fix
Open PowerShell **as Administrator** and run:
```powershell
icacls "C:\Users\SiMo\Documents\GitHub\smartsales" /grant "%USERNAME%":(OI)(CI)F /T
```
Then retry `composer install`.

---

## Prerequisites

| Tool | Where |
|------|-------|
| PHP 8.2+ | https://www.php.net — or **[Laragon](https://laragon.org)** (Windows all-in-one) |
| Composer | https://getcomposer.org |
| Node.js 18+ | https://nodejs.org |
| VS Code | https://code.visualstudio.com |

> **Windows tip**: [Laragon](https://laragon.org) installs PHP, MySQL, and Composer in one click. After installing, open Laragon terminal for all commands.

---

## Setup (after fixing permissions above)

Open VS Code at your project folder. Press **Ctrl+`** to open the terminal, then open **3 tabs** with the `+` button:

### Tab 1 — Backend
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan jwt:secret
php artisan migrate --seed
php artisan serve
```
> Uses SQLite by default — no database setup needed.  
> You'll see: `✅ Demo seeded. Login: admin@smartsales.dev / Password1`  
> Keep this running at **http://localhost:8000**

### Tab 2 — Queue Worker
```bash
cd backend
php artisan queue:work --queue=ai,default
```
> Processes background AI scoring. Keep running.

### Tab 3 — Frontend
```bash
npm install -g @angular/cli@17
cd frontend
npm install
ng serve
```
> App at **http://localhost:4200**. Keep running.

---

## Log In

Go to **http://localhost:4200**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@smartsales.dev | Password1 |
| Manager | sarah@smartsales.dev | Password1 |
| Agent | john@smartsales.dev | Password1 |

---

## Add OpenAI Key (for AI features)

Get a key at https://platform.openai.com/api-keys, add it to `backend/.env`:
```
OPENAI_API_KEY=sk-your-key-here
```
Restart `php artisan serve`. Without a key the app still works with heuristic scores.

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `Permission denied` during composer | Move project to `C:\smartsales\` or run as Admin |
| `php: command not found` | Install PHP or Laragon |
| `composer: command not found` | Install from getcomposer.org |
| `Class Tymon\JWTAuth not found` | Run `composer install` first |
| `unable to open database file` | Run `touch backend/database/database.sqlite` |
| `ng: command not found` | Run `npm install -g @angular/cli@17` |
| CORS error in browser | Check `FRONTEND_URL=http://localhost:4200` in `backend/.env` |
| AI returns "key not configured" | Add `OPENAI_API_KEY=sk-...` to `backend/.env` |
| `php artisan jwt:secret` not found | Run `composer install` first |
