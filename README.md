# Groww Clone

A paper-trading investment platform inspired by Groww, built to learn full-stack
development with a real-world financial application domain: user auth, live
market data simulation, watchlists, order execution, and portfolio P&L tracking.

> This is a learning project. All trading uses virtual money — no real
> money, broker, or market data is involved.

## Tech stack

**Backend:** .NET 9, ASP.NET Core Web API, Entity Framework Core (code-first),
SQL Server, JWT authentication

**Frontend:** Angular (standalone components, signals, reactive forms),
Angular Material, RxJS

**Architecture:** Modular monolith — `Api` (controllers) → `Application`
(DTOs/interfaces) → `Infrastructure` (EF Core, services) → `Domain` (entities)

## Features

- Register/login with JWT auth, hashed passwords
- Virtual wallet (₹1,00,000 starting balance)
- Live-feel market data: 8 seeded stocks with a background price simulator
- Search and browse instruments
- Watchlist (star/unstar stocks)
- Buy/Sell orders with real wallet debit/credit and weighted-average holding price
- Portfolio dashboard: invested value, current value, P&L (overall and per-holding)
- Order history
- Price alerts: set a target price (above/below) on any stock; a background
  service checks live prices and notifies you when it's hit
- In-app notifications with unread badge

## Project structure
GrowwApp-Clone/
├── src/
│ ├── GrowwClone.Api/ # Controllers, Program.cs, JWT, Swagger
│ ├── GrowwClone.Application/ # DTOs, service interfaces
│ ├── GrowwClone.Domain/ # Entities, enums
│ └── GrowwClone.Infrastructure/  # EF Core DbContext, migrations, services, background jobsservices
└── client/ # Angular app
└── src/app/
├── core/ # Services, guards, interceptor
├── shared/ # Layout shell
└── features/ # auth, explore, watchlist, portfolio, orders


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

Update the connection string in `GrowwClone.Api/appsettings.json` to match your
SQL Server instance first.

### Frontend

```bash
cd client
npm install
ng serve
```
App runs at `http://localhost:4200`.

## Roadmap

- [x] Auth, market data, watchlist, trading, portfolio
- [x] Price alerts
- [ ] Historical charts
- [ ] SIP / recurring investments
- [ ] Refresh tokens + security hardening
- [ ] Admin panel
- [ ] Deployment (live demo)

## Disclaimer

Built for learning purposes. Not affiliated with Groww. No real financial
transactions occur.
