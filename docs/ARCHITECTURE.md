# Architecture Overview

## System Design

CMRS follows a **modular monolith** architecture with clear separation between backend (Django REST API) and frontend (React SPA).

```
┌─────────────┐      REST API (JSON)      ┌──────────────┐
│  React SPA   │  ◄────────────────────►  │  Django API  │
│  (Vite)      │      JWT Auth            │  (DRF)       │
└─────────────┘                           └──────┬───────┘
                                                  │
                                           ┌──────▼───────┐
                                           │  Database     │
                                           │  (SQLite/PG)  │
                                           └──────────────┘
```

## Backend Apps

| App | Purpose |
|-----|---------|
| `accounts` | User model (3 roles), Branch model, JWT auth, permissions |
| `customers` | Customer CRUD, branch-linked |
| `loans` | Loan creation, repayment schedules, outstanding tracking |
| `collections_app` | Cash collection, agent submissions, submission mappings |
| `reconciliation` | Read-only reconciliation views |
| `deposits` | Bank deposits, settlement handling |
| `dashboard` | Aggregated summary and recent activity |

## Frontend Structure

```
src/
  api/          — Axios instance + service layer
  components/   — Reusable UI (DataTable, StatusBadge, FormInput, etc.)
  hooks/        — useAuth
  layouts/      — MainLayout with sidebar navigation
  pages/        — Route-level page components
```

## Cash Lifecycle

```
COLLECTED → SUBMITTED → VERIFIED → DEPOSITED → SETTLED
                │
                └→ (REJECTED) → back to COLLECTED
```

## Key Design Decisions

1. **Modular monolith over microservices** — Single deployable, simpler for an assignment.
2. **SQLite for demo, PostgreSQL-ready** — Django ORM abstracts the DB layer.
3. **No double-entry ledger** — CashCollection status tracks cash through the lifecycle.
4. **Idempotency via client keys** — Prevents duplicate financial effects.
5. **OneToOne deposit-submission** — Database-level prevention of duplicate deposits.
6. **Role-based queryset filtering** — Data isolation enforced at the ORM level, not just UI.
