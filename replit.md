# LB Stay Cloud — Multi-Sector SaaS Platform

## Overview

Full-stack SaaS platform for African businesses (Cameroon context). Supports 8 business sectors with real PostgreSQL database, session-based auth, and a dark-mode UI with XAF currency formatting.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui + Framer Motion + Recharts
- **Auth**: Session-based (express-session) with SHA256+salt password hashing
- **Currency**: XAF (CFA Franc) — `formatXAF()` in `src/lib/utils.ts`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Architecture

### Packages
- `artifacts/lb-stay-cloud` — React + Vite frontend (served at `/`)
- `artifacts/api-server` — Express 5 API server (served at `/api`)
- `lib/db` — Drizzle ORM schema + database client
- `lib/api-spec` — OpenAPI spec (`openapi.yaml`)
- `lib/api-zod` — Generated Zod schemas from OpenAPI
- `lib/api-client-react` — Generated React Query hooks from OpenAPI

### Auth
- POST `/api/auth/login` — session cookie auth
- GET `/api/auth/me` — returns current user from session
- POST `/api/auth/logout` — destroys session
- Password hashed with SHA256 + salt "lb_stay_salt"
- `credentials: "include"` set on all API fetches

### Business Sectors (8 total)
1. **RESTAURANT** — products (menu), orders, POS, hourly stats
2. **HOTEL** — rooms, reservations, check-in/check-out, occupancy
3. **BEAUTY** — services, staff, appointments, scheduling
4. **GROCERY** — products (barcode), suppliers, low-stock alerts
5. **PHARMACY** — medications, prescriptions, expiry tracking
6. **GARAGE** — vehicles, diagnostic tracking, quotes, parts
7. **FITNESS** — members, subscriptions, classes, check-ins
8. **EDUCATION** — courses, students, enrollments, payment tracking

### Database Tables (15+)
users, businesses, branches, clients, payments, notifications,
restaurant_products, restaurant_orders,
hotel_rooms, hotel_reservations,
beauty_services, beauty_staff, beauty_appointments,
grocery_products, suppliers,
medications, prescriptions,
garage_vehicles, garage_quotes, garage_parts,
fitness_members, fitness_classes, fitness_checkins,
courses, students, enrollments

### Demo Accounts (all password: "password")
- `superadmin@lbstay.com` — Super Admin (all sectors view)
- `restaurant@lbstay.com` — Restaurant Chez Mama (businessId: 1)
- `hotel@lbstay.com` — Hôtel Le Prestige (businessId: 2)
- `beauty@lbstay.com` — Beauty Palace (businessId: 3)
- `grocery@lbstay.com` — Super Marché Central (businessId: 4)
- `pharmacy@lbstay.com` — Pharmacie Centrale Plus (businessId: 5)
- `garage@lbstay.com` — Garage Auto Excellence (businessId: 6)
- `fitness@lbstay.com` — FitZone Cameroun (businessId: 7)
- `education@lbstay.com` — Institut de Formation Excellence (businessId: 8)

### Payment Methods
CASH, MTN_MOBILE_MONEY, ORANGE_MONEY, CARD

### Cameroon Context
- Currency: XAF (CFA Franc), formatted as `formatXAF()` in `src/lib/utils.ts`
- Cities: Douala, Yaoundé, Bafoussam
- Phone format: +237 6XX XXX XXX
