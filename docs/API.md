# API Documentation

## Base URL
```
http://localhost:8000/api
```

## Authentication

All endpoints except `/auth/token/` require JWT Bearer token.

### Obtain Token
```
POST /api/auth/token/
Body: { "username": "admin", "password": "admin123" }
Response: { "access": "...", "refresh": "..." }
```

### Refresh Token
```
POST /api/auth/token/refresh/
Body: { "refresh": "..." }
```

## Endpoints

### Accounts
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | /accounts/users/me/ | Current user info | All |
| GET | /accounts/users/ | List users | Admin |
| POST | /accounts/users/ | Create user | Admin |
| GET | /accounts/users/agents/ | List agents | All |
| GET | /accounts/branches/ | List branches | All |
| POST | /accounts/branches/ | Create branch | Admin |

### Customers
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | /customers/ | List customers (role-filtered) | All |
| POST | /customers/ | Create customer | All (branch auto-set) |
| GET | /customers/{id}/ | Customer detail | All (role-filtered) |
| PUT | /customers/{id}/ | Update customer | Admin, Manager |

**Query params:** `?branch=1&search=name`

### Loans
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | /loans/ | List loans (role-filtered) | All |
| POST | /loans/ | Create loan | Admin, Manager |
| GET | /loans/{id}/ | Loan detail with schedule | All (role-filtered) |
| GET | /loans/schedules/ | Repayment schedules | All |

**Query params:** `?branch=1&agent=1&status=ACTIVE`

### Collections
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | /collections/ | List collections (role-filtered) | All |
| POST | /collections/ | Record collection | Agent |
| GET | /collections/daily_total/ | Agent daily total | Agent |
| GET | /collections/eligible_for_submission/ | Unsubmitted collections | Agent |

**Query params:** `?status=COLLECTED&branch=1&agent=1&date_from=2024-01-01&date_to=2024-12-31`

**Create body:**
```json
{
  "loan": 1,
  "amount": "5000.00",
  "collection_date": "2024-06-01",
  "notes": "Monthly installment",
  "idempotency_key": "unique-key-123"
}
```

### Submissions
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | /collections/submissions/ | List submissions (role-filtered) | All |
| POST | /collections/submissions/ | Create submission | Agent |
| GET | /collections/submissions/{id}/ | Submission detail | All (role-filtered) |
| POST | /collections/submissions/{id}/reconcile/ | Approve/reject | Branch Manager |

**Create submission body:**
```json
{
  "collection_ids": [1, 2, 3]
}
```

**Reconcile body:**
```json
{
  "actual_amount": "50000.00",
  "action": "approve",
  "discrepancy_notes": "Short by ₹500"
}
```

### Reconciliation (read-only)
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | /reconciliation/ | List all submissions | Manager, Admin |

### Deposits
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | /deposits/ | List deposits (role-filtered) | All |
| POST | /deposits/ | Create deposit | Manager |
| GET | /deposits/{id}/ | Deposit detail | All (role-filtered) |
| POST | /deposits/{id}/settle/ | Settle deposit | Manager, Admin |
| GET | /deposits/approved_submissions/ | Approved subs for deposit | Manager |

**Create deposit body:**
```json
{
  "bank_name": "State Bank of India",
  "deposit_date": "2024-06-05",
  "amount": "50000.00",
  "bank_reference": "SBI-REF-001",
  "submission": 1
}
```

**Settle body:**
```json
{
  "settled_amount": "49800.00",
  "status": "SETTLED",
  "notes": "Bank charges ₹200"
}
```

### Dashboard
| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | /dashboard/summary/ | Summary metrics | All (role-filtered) |
| GET | /dashboard/recent/ | Recent activity | All (role-filtered) |

**Query params:** `?branch=1&agent=1&date_from=...&date_to=...`
