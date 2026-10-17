# CMRS Requirements Traceability

## Source
ARTH Full Stack Engineering Assignment — Cash Management & Reconciliation System.

## Requirements Checklist

| # | Requirement | Status | Implementation |
|---|------------|--------|----------------|
| 1 | Python 3.11+, Django, DRF | ✅ | backend/ |
| 2 | PostgreSQL (SQLite for demo) | ✅ | settings.py — env-switchable |
| 3 | React.js with Vite | ✅ | frontend/ |
| 4 | REST APIs | ✅ | DRF ViewSets |
| 5 | JWT Authentication | ✅ | djangorestframework-simplejwt |
| 6 | Role-based access control | ✅ | 3 roles, queryset-level filtering |
| 7 | DecimalField for money | ✅ | All monetary fields |
| 8 | Database transactions | ✅ | Reconciliation, deposits, settlements |
| 9 | Customer CRUD | ✅ | customers/ app |
| 10 | Loan creation and listing | ✅ | loans/ app |
| 11 | Loan assignment to agent/branch | ✅ | Loan.assigned_agent, Loan.branch |
| 12 | Repayment schedule records | ✅ | RepaymentSchedule model |
| 13 | Outstanding principal tracking | ✅ | Loan.outstanding_amount |
| 14 | Repayment history | ✅ | CashCollection model |
| 15 | Agent cash collection | ✅ | collections_app/ |
| 16 | Unique receipt numbers | ✅ | Auto-generated UUID |
| 17 | Daily collection totals | ✅ | /api/collections/daily_total/ |
| 18 | Partial repayments | ✅ | Supported via amount field |
| 19 | Overpayment policy | ✅ | Rejected (amount > outstanding) |
| 20 | Idempotency for collections | ✅ | idempotency_key field |
| 21 | Agent cash submission | ✅ | AgentCashSubmission model |
| 22 | Expected amount calculation | ✅ | Sum of mapped collections |
| 23 | Actual cash received | ✅ | Branch manager enters |
| 24 | Difference calculation | ✅ | actual - expected |
| 25 | Approve/reject submissions | ✅ | reconcile action |
| 26 | Discrepancy notes | ✅ | Required for reject |
| 27 | Rejected submissions auditable | ✅ | Status REJECTED, not deleted |
| 28 | Bank deposits | ✅ | deposits/ app |
| 29 | Unique bank references | ✅ | unique=True on bank_reference |
| 30 | Prevent duplicate deposits | ✅ | OneToOne on submission |
| 31 | Settlement status tracking | ✅ | SETTLED/FAILED/DELAYED |
| 32 | Settlement mismatch | ✅ | settled_amount - deposit amount |
| 33 | Dashboard with summaries | ✅ | dashboard/ app |
| 34 | Filters (date, branch, agent, status) | ✅ | Query params on all endpoints |
| 35 | Seed demo data | ✅ | python manage.py seed_demo |
| 36 | Critical tests | ✅ | 18 tests covering key scenarios |
| 37 | Row-level locking | ✅ | select_for_update in transactions |
| 38 | Loan balance reduced only once | ✅ | Only in CashCollection.create |
| 39 | No silent overwrites | ✅ | Read-only after status changes |
| 40 | Responsive frontend | ✅ | Tailwind CSS |
