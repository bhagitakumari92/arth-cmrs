# Database Design

## Entity Relationship

```
Branch 1──N User (agents, managers)
Branch 1──N Customer
Branch 1──N Loan
Branch 1──N CashCollection
Branch 1──N AgentCashSubmission
Branch 1──N BankDeposit

Customer 1──N Loan
User (agent) 1──N Loan (assigned_agent)
Loan 1──N RepaymentSchedule
Loan 1──N CashCollection

User (agent) 1──N CashCollection
User (agent) 1──N AgentCashSubmission

AgentCashSubmission 1──N SubmissionCollectionMapping
CashCollection 1──1 SubmissionCollectionMapping (unique constraint)
AgentCashSubmission 1──1 BankDeposit (OneToOne)
```

## Tables

### accounts_branch
| Column | Type | Notes |
|--------|------|-------|
| id | PK | |
| name | VARCHAR(100) | UNIQUE |
| code | VARCHAR(20) | UNIQUE |
| address | TEXT | |

### accounts_user
| Column | Type | Notes |
|--------|------|-------|
| id | PK | |
| username | VARCHAR(150) | UNIQUE |
| role | VARCHAR(20) | ADMIN / COLLECTION_AGENT / BRANCH_MANAGER |
| branch_id | FK → Branch | NULL for admin |
| phone | VARCHAR(15) | |

### customers_customer
| Column | Type | Notes |
|--------|------|-------|
| id | PK | |
| first_name | VARCHAR(100) | |
| last_name | VARCHAR(100) | |
| phone | VARCHAR(15) | UNIQUE |
| branch_id | FK → Branch | PROTECT |

### loans_loan
| Column | Type | Notes |
|--------|------|-------|
| id | PK | |
| customer_id | FK → Customer | PROTECT |
| branch_id | FK → Branch | PROTECT |
| assigned_agent_id | FK → User | PROTECT |
| principal_amount | DECIMAL(12,2) | |
| outstanding_amount | DECIMAL(12,2) | Reduced ONLY by collections |
| tenure_months | INT | |
| monthly_installment | DECIMAL(12,2) | |
| disbursement_date | DATE | |
| status | VARCHAR(10) | ACTIVE / CLOSED |

### loans_repaymentschedule
| Column | Type | Notes |
|--------|------|-------|
| id | PK | |
| loan_id | FK → Loan | CASCADE |
| installment_number | INT | UNIQUE with loan_id |
| due_date | DATE | |
| amount | DECIMAL(12,2) | |
| paid_amount | DECIMAL(12,2) | |
| status | VARCHAR(15) | PENDING / PAID / PARTIALLY_PAID / OVERDUE |

### collections_app_cashcollection
| Column | Type | Notes |
|--------|------|-------|
| id | PK | |
| receipt_number | VARCHAR(50) | UNIQUE, auto-generated |
| loan_id | FK → Loan | PROTECT |
| agent_id | FK → User | PROTECT |
| branch_id | FK → Branch | PROTECT |
| amount | DECIMAL(12,2) | > 0 |
| collection_date | DATE | |
| status | VARCHAR(15) | COLLECTED→SUBMITTED→VERIFIED→DEPOSITED→SETTLED |
| idempotency_key | VARCHAR(100) | UNIQUE, nullable |

### collections_app_agentcashsubmission
| Column | Type | Notes |
|--------|------|-------|
| id | PK | |
| agent_id | FK → User | PROTECT |
| branch_id | FK → Branch | PROTECT |
| expected_amount | DECIMAL(12,2) | Sum of collections |
| actual_amount | DECIMAL(12,2) | NULL until reconciled |
| difference | DECIMAL(12,2) | actual - expected |
| status | VARCHAR(30) | PENDING / APPROVED / APPROVED_WITH_DISCREPANCY / REJECTED |
| discrepancy_notes | TEXT | |
| verified_by_id | FK → User | NULL until reconciled |
| verified_at | DATETIME | NULL until reconciled |

### collections_app_submissioncollectionmapping
| Column | Type | Notes |
|--------|------|-------|
| id | PK | |
| submission_id | FK → Submission | CASCADE |
| collection_id | FK → Collection | PROTECT, UNIQUE (one submission per collection) |

### deposits_bankdeposit
| Column | Type | Notes |
|--------|------|-------|
| id | PK | |
| bank_name | VARCHAR(200) | |
| deposit_date | DATE | |
| amount | DECIMAL(12,2) | |
| bank_reference | VARCHAR(100) | UNIQUE |
| branch_id | FK → Branch | PROTECT |
| submission_id | OneToOne → Submission | PROTECT, prevents duplicate deposits |
| status | VARCHAR(10) | PENDING / SETTLED / FAILED / DELAYED |
| settled_amount | DECIMAL(12,2) | NULL until settled |
| settlement_mismatch | DECIMAL(12,2) | settled - amount |
