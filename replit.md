# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## LB Stay Cloud — Architecture SaaS

**Secteurs** : Restaurant, Hôtel, Beauté, Épicerie, Pharmacie, Garage, Fitness, Éducation

**Auth démo** : `superadmin@lbstay.com` / `pharmacy@lbstay.com` (businessId=3) / garage (businessId=6) — mot de passe : `password`

**Design** : dark navy exclusivement, or `hsl(38 90% 56%)` / `#F5A623`, Police : Plus Jakarta Sans, currency : `formatXAF()` dans `artifacts/lb-stay-cloud/src/lib/utils.ts`

**Schémas DB** (Drizzle ORM, `lib/db/src/schema/`) :
- Secteurs : `restaurant`, `hotel`, `beauty`, `grocery`, `pharmacy`, `garage`, `fitness`, `education`
- Transversal : `inventory_movements` (mouvements stock multi-secteur), `suppliers` (fournisseurs), `customer_credits` + `credit_transactions` (L'Ardoise), `billing_settings` (paramètres facture)

**Routes API** (`artifacts/api-server/src/routes/`) :
- `inventory.ts` — GET/POST `/inventory/movements`, DELETE `/inventory/movements/:id`, GET `/inventory/stats`
- `suppliers.ts` — CRUD `/suppliers`, `/suppliers/:id`
- `credits.ts` — CRUD `/credits`, `/credits/stats`, POST/GET `/credits/:id/transactions`
- `billing.ts` — GET/PUT `/billing/settings`, POST `/billing/settings/increment-invoice`

**Hooks Orval générés** (`lib/api-client-react/src/generated/api.ts`) :
- `useListInventoryMovements`, `useCreateInventoryMovement`, `useGetInventoryStats`
- `useListSuppliers`, `useCreateSupplier`, `useUpdateSupplier`, `useDeleteSupplier`
- `useListCustomerCredits`, `useCreateCustomerCredit`, `useGetCreditsStats`, `useAddCreditTransaction`, `useListCreditTransactions`
- `useGetBillingSettings`, `useUpsertBillingSettings`, `useIncrementInvoiceNumber`

**Note TypeScript** : Les erreurs TS2308 dans `lib/api-zod/src/index.ts` sont pré-existantes (doublon `generated/api` + `generated/types`) et ignorées — les fichiers sont générés correctement.
