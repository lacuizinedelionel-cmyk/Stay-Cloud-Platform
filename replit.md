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

**Module Sécurité & Audit Trail** (`/audit`) :
- Table `activity_logs` créée via SQL direct (drizzle-kit push interactif contourné)
- Route `artifacts/api-server/src/routes/audit.ts` — GET /audit/logs, /audit/actions, /audit/team, PATCH /audit/team/:id/role
- Page `artifacts/lb-stay-cloud/src/pages/audit.tsx` — Journal d'activité + Permissions & Équipe
- Hook `usePermissions()` dans `src/hooks/usePermissions.ts` — niveaux SUPER_ADMIN/OWNER/MANAGER/STAFF
- `permission-guard.tsx` — composant AccessDeniedPage pour les rôles insuffisants
- Users démo MANAGER/STAFF ajoutés pour businessId=2 (hotel): manager.hotel@lbstay.com, staff.hotel@lbstay.com

**Internationalisation FR/EN** :
- `src/i18n/translations.ts` — dictionnaire complet FR/EN (nav, actions, statuts, analytics, settings, rôles, secteurs, auth)
- `src/context/LanguageContext.tsx` — Provider + hook `useLanguage()`, persisté en localStorage
- Toggle langue dans la sidebar (bas de page), wrappé dans App.tsx
- Navigation sidebar traduite dynamiquement via `t.nav.*`

**Export Excel/CSV** (`/analytics`) :
- `src/lib/exportExcel.ts` — `exportAnalyticsToExcel()` (3 feuilles: Résumé, Transactions, Évolution CA) + `exportTransactionsToCsv()` (UTF-8 BOM)
- Lib xlsx installée dans `@workspace/lb-stay-cloud`
- Bouton dropdown "Exporter le rapport" dans le header analytics

**Logo Upload** (`/settings`) :
- Section logo dans la page Paramètres avec drag & drop ou file input
- Stocké en base64 (dataURL) via l'API billing/settings (champ `logoUrl`)
- Preview immédiate avant sauvegarde, bouton supprimer
- Taille max 2 Mo, formats PNG/JPG/SVG
