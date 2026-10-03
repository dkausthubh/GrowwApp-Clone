# Groww Clone

A paper-trading investment platform inspired by Groww, built to learn full-stack development with a real-world financial application domain: secure auth, live market data simulation, watchlists, order execution, portfolio P&L tracking, price alerts, historical charts, and security hardening.

> ⚠️ This is a learning project. All trading uses virtual money — no real money, broker, or market data is involved.

## Tech stack

**Backend:** .NET 9, ASP.NET Core Web API, Entity Framework Core (code-first), SQL Server, JWT authentication with refresh token rotation

**Frontend:** Angular (standalone components, signals, reactive forms), Angular Material, RxJS, Chart.js

**Architecture:** Modular monolith — `Api` (controllers) → `Application` (DTOs/interfaces) → `Infrastructure` (EF Core, services, background jobs) → `Domain` (entities)

## Features

### Core trading

- Register/login with hashed passwords
- Virtual wallet (₹1,00,000 starting balance)
- Live-feel market data: 8 seeded stocks with a background price simulator
- Search and browse instruments; per-instrument detail page
- Watchlist (star/unstar stocks)
- Buy/Sell orders with real wallet debit/credit and weighted-average holding price
- Portfolio dashboard: invested value, current value, P&L (overall and per-holding)
- Order history

### Price alerts & notifications

- Set "notify me when X rises above/falls below ₹Y" on any stock
- Background service checks active alerts against live prices every 5 seconds
- In-app notification bell with unread badge

### Historical charts

- Price history recorded every 5 seconds alongside the live price simulator
- Instrument detail page shows a line chart with selectable time ranges (5m/30m/1h/1d)

### Security hardening

- **Refresh tokens** — short-lived (15 min) JWT access tokens + 7-day refresh tokens, stored hashed, with rotation and reuse detection (a reused/stolen refresh token revokes the entire session family)
- **Email OTP (MFA)** — login is two-step: password, then a 6-digit code (dev builds log the code to the console and echo it in the response, since no email provider is wired up yet)
- **Rate limiting** — 5 requests/minute per IP on auth endpoints, 100/minute global fallback elsewhere, returns 429 when exceeded
- **Audit logging** — security-relevant events (login attempts, OTP checks, token refresh/reuse, orders placed/rejected, logout) recorded per user and viewable via `/api/audit-logs`

## Project structure

```text
GrowwApp-Clone/
├── src/
│   ├── GrowwClone.Api/                 # Controllers, Program.cs, JWT, rate limiting, Swagger
│   ├── GrowwClone.Application/         # DTOs, service interfaces
│   ├── GrowwClone.Domain/              # Entities, enums
│   └── GrowwClone.Infrastructure/      # EF Core DbContext, migrations, services, background jobs
├── client/
│   └── src/
│       └── app/
│           ├── core/                   # Services, guards, interceptor
│           ├── shared/                 # Layout shell, notification bell
│           └── features/               # auth, explore, instrument-detail, watchlist,
│                                         # portfolio, orders, alerts
├── README.md
└── .gitignore
```

## Running locally

### Prerequisites

- .NET 9 SDK
- Node.js (LTS)
- SQL Server (local instance, Express, or LocalDB)

### Backend

```bash
cd src
dotnet user-secrets --project GrowwClone.Api init
dotnet user-secrets --project GrowwClone.Api set "Jwt:Key" "<your own random 32+ char secret>"

dotnet ef database update -p GrowwClone.Infrastructure -s GrowwClone.Api
dotnet run --project GrowwClone.Api
```

API runs at `http://localhost:5101` (Swagger at `/swagger`).

Update the connection string in `GrowwClone.Api/appsettings.json` to match your SQL Server instance first.

> Note on login: login now returns an MFA challenge, not a token directly. Check the terminal output for `[DEV] OTP for ...` and submit that code to `POST /api/auth/verify-otp` to complete login (in dev builds, the code is also echoed back in the login response for convenience).

### Frontend

```bash
cd client
npm install
ng serve
```

App runs at `http://localhost:4200`.

## API overview

| Area | Endpoints |
| --- | --- |
| Auth | `POST /api/auth/register`, `login`, `verify-otp`, `refresh`, `logout`, `GET /me` |
| Market | `GET /api/instruments`, `GET /api/instruments/{id}`, `GET /api/instruments/{id}/history` |
| Watchlist | `GET/POST/DELETE /api/watchlist` |
| Trading | `POST /api/orders`, `GET /api/orders`, `GET /api/portfolio`, `GET /api/wallet` |
| Alerts | `POST/GET/DELETE /api/alerts`, `GET /api/notifications`, `POST /api/notifications/mark-read` |
| Audit | `GET /api/audit-logs` |

## Roadmap

- [x] Auth, market data, watchlist, trading, portfolio
- [x] Price alerts
- [x] Historical charts
- [x] Security hardening (refresh tokens, MFA, rate limiting, audit logs)
- [ ] Angular updates for two-step (password + OTP) login flow
- [ ] SIP / recurring investments
- [ ] Admin panel
- [ ] Deployment (live demo)

## Security notes (learning project caveats)

- SHA-256 is used to hash refresh tokens and OTP codes (appropriate since these are already high-entropy random values); passwords use BCrypt (appropriate for human-chosen secrets, which need slow/salted hashing to resist brute-forcing)
- OTP delivery is console-logged in development; a real email provider (SendGrid, Azure Communication Services, etc.) would replace this before any real deployment
- Rate limiting is IP-based; behind a reverse proxy this would need `X-Forwarded-For` handling to see the real client IP

## Disclaimer

Built for learning purposes. Not affiliated with Groww. No real financial transactions occur.
