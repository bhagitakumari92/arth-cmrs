# ARTH CMRS — Cash Management & Reconciliation System

A full-stack demonstration of cash lifecycle management for microfinance/lending operations. Tracks cash from field collection through branch reconciliation to bank settlement.

## LIVE DEMO

**Public URL:** https://unopened-lend-wriggly.ngrok-free.dev/

Click 'Visit Site' if you see an ngrok warning page.

### Demo Credentials

| Role | Username | Password | Branch |
|------|----------|----------|--------|
| Admin | admin | admin123 | System-wide |
| Branch Manager | manager1 | manager123 | North Branch |
| Branch Manager | manager2 | manager123 | South Branch |
| Collection Agent | agent1 | agent123 | North Branch |
| Collection Agent | agent2 | agent123 | North Branch |
| Collection Agent | agent3 | agent123 | South Branch |

> Note: These credentials are for demo purposes only. Do not use in production.

## Problem Overview

Field agents collect cash repayments from borrowers. This cash must be tracked through:
**Agent Collection → Branch Verification → Bank Deposit → Settlement**

CMRS provides role-based access, financial integrity controls, and complete audit trail for each stage.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11, Django 5, Django REST Framework |
| Frontend | React 18, Vite, Tailwind CSS |
| Database | PostgreSQL (production) / SQLite (demo) |
| Auth | JWT (djangorestframework-simplejwt) |
| API | REST, JSON |

## Quick Start (Local Development)

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git

### Backend Setup

``bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate
# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Seed demo data
python manage.py seed_demo

# Start server
python manage.py runserver 8000
``

### Frontend Setup

``bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
``

The app is available at **http://localhost:5173**

## Environment Variables

Copy .env.example to .env in the ackend/ directory:

``env
SECRET_KEY=your-secret-key
DEBUG=True
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3

# For PostgreSQL:
# DB_ENGINE=django.db.backends.postgresql
# DB_NAME=cmrs_db
# DB_USER=postgres
# DB_PASSWORD=yourpassword
# DB_HOST=localhost
# DB_PORT=5432
``

## Running Tests

``bash
cd backend
python manage.py test tests
``

29 tests across 6 test classes covering:
- Role-based access control
- Financial integrity (no double-counting, unique constraints)
- Collection recording (partial payments, overpayment rejection)
- Cash submission (duplicate prevention)
- Reconciliation (approve/reject workflows)
- Bank deposits (unique references, no duplicate deposits)
- Settlement mismatch calculation

## Financial Business Rules

1. **All monetary values** use DecimalField(12,2) — never floats
2. **Loan balance** is reduced ONLY during collection recording, never during reconciliation or settlement
3. **Overpayment** is rejected — collections cannot exceed outstanding balance
4. **One collection = one submission** — enforced by unique constraint
5. **One approved submission = one deposit** — enforced by OneToOne relationship
6. **Bank references** are globally unique
7. **Rejected submissions** return collections to agent for resubmission
8. **Discrepancy = actual - expected** at reconciliation
9. **Settlement mismatch = settled - deposited** amount
10. **Idempotency keys** prevent duplicate financial effects from network retries

## Project Structure

``
backend/
  config/           — Django settings, URLs
  accounts/         — Users, branches, JWT auth, permissions
  customers/        — Customer CRUD
  loans/            — Loans, repayment schedules
  collections_app/  — Cash collections, agent submissions
  reconciliation/   — Reconciliation views
  deposits/         — Bank deposits, settlement
  dashboard/        — Summary metrics
  tests/            — Critical test scenarios
  manage.py

frontend/
  src/
    api/            — Axios + service layer
    components/     — Reusable UI components
    hooks/          — useAuth
    layouts/        — MainLayout with sidebar
    pages/          — Route-level pages

docs/
  REQUIREMENTS.md   — Requirements traceability
  ARCHITECTURE.md   — System design decisions
  DATABASE.md       — Schema and relationships
  API.md            — Endpoint documentation
  ASSUMPTIONS.md    — Simplifications and limitations
  DEMO_SCRIPT.md    — 5-minute walkthrough
``

## API Overview

See [docs/API.md](docs/API.md) for complete endpoint documentation.

Key endpoints:
- POST /api/auth/token/ — Login
- GET /api/dashboard/summary/ — Dashboard metrics
- POST /api/collections/ — Record collection
- POST /api/collections/submissions/ — Submit cash to branch
- POST /api/collections/submissions/{id}/reconcile/ — Approve/reject
- POST /api/deposits/ — Create bank deposit
- POST /api/deposits/{id}/settle/ — Confirm settlement

## Deployment

**Live Demo:** https://unopened-lend-wriggly.ngrok-free.dev/

The application is deployed on a VPS with:
- PostgreSQL database
- Gunicorn WSGI server
- Nginx reverse proxy
- Ngrok tunnel for public HTTPS access

For deployment instructions, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
For recording your 5-minute explanation video, see [docs/VIDEO_GUIDE.md](docs/VIDEO_GUIDE.md).

## Known Limitations

- Settlement is simulated (no real bank API)
- No CSV/PDF export
- No real-time notifications
- Ngrok free tier URL is temporary
- See [docs/ASSUMPTIONS.md](docs/ASSUMPTIONS.md) for complete list

## Documentation

- [API Documentation](docs/API.md) — All endpoints with examples
- [Database Schema](docs/DATABASE.md) — Table structures and relationships
- [Architecture](docs/ARCHITECTURE.md) — System design and decisions
- [Requirements](docs/REQUIREMENTS.md) — Full requirements traceability
- [Deployment Guide](docs/DEPLOYMENT.md) — Production deployment
- [Demo Script](docs/DEMO_SCRIPT.md) — 5-minute demo walkthrough
- [Video Guide](docs/VIDEO_GUIDE.md) — Recording instructions

## Assignment Deliverables

- [x] GitHub repository
- [x] Live demo URL: https://unopened-lend-wriggly.ngrok-free.dev/
- [x] Demo credentials: admin/admin123
- [x] README with setup instructions
- [x] API documentation
- [x] Database schema diagram
- [x] Requirements traceability
- [ ] 5-minute explanation video (to be recorded)

## License

This is an educational project for demonstration purposes.
