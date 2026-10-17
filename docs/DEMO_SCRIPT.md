# 5-Minute Demo Script

Use this script to record a comprehensive demonstration of the CMRS application.

## Pre-Recording Setup (5 minutes before)

### Browser Preparation
1. Open **Incognito/Private window** (Ctrl+Shift+N)
2. Navigate to: https://unopened-lend-wriggly.ngrok-free.dev/
3. Click 'Visit Site' on ngrok warning
4. Keep browser window clean (close other tabs)

### Recording Setup
- Use OBS Studio, Loom, or screen recorder
- Resolution: 1920x1080 or 1280x720
- Microphone: Test audio quality
- Prepare to explain clearly

---

## Video Structure (5 minutes)

### OPENING (30 seconds)

**Say:**
""This is ARTH CMRS - a Cash Management & Reconciliation System for microfinance operations. It tracks cash from field collection through branch verification to bank settlement with complete financial integrity.""

**Show:**
- Login page with branding
- Demo credentials displayed

---

### LOGIN & DASHBOARD (45 seconds)

**Action:**
1. Click 'Admin' credential button
2. Login with admin/admin123
3. Show dashboard loading

**Say:**
""I'll login as admin to demonstrate system-wide visibility. The dashboard shows real-time metrics: 13 customers, 12 loans, and collection activity across both branches.""

**Show:**
- Dashboard metrics
- Branch comparison charts
- Collection status

---

### COLLECTION WORKFLOW (90 seconds)

**Action:**
1. Navigate to Collections
2. Show existing collections
3. Click 'Record Collection'
4. Fill form:
   - Customer: Select from dropdown
   - Amount: 5000
   - Collection agent: agent1
5. Submit collection

**Say:**
""Field agents record collections from borrowers. Each collection must match an active loan. The system prevents overpayments - you can't collect more than the outstanding balance. Let me record a new collection...""

**Show:**
- Collection form validation
- Amount verification against loan balance
- Success message

---

### CASH SUBMISSION (60 seconds)

**Action:**
1. Navigate to Submissions
2. Select collection just created
3. Click 'Submit to Branch'
4. Show submission details

**Say:**
""Agents submit cash to branch managers for verification. Each collection can only be submitted once - this prevents double-counting. The branch manager must approve or reject the submission.""

**Show:**
- Submission form
- Duplicate prevention
- Submission status

---

### MANAGER RECONCILIATION (90 seconds)

**Action:**
1. Logout
2. Login as manager1/manager123
3. Show pending submissions
4. Approve one submission
5. Show reconciliation

**Say:**
""Now I'll switch to a branch manager role. Managers see only their branch's data. They approve or reject cash submissions after physical verification. Let me approve this submission...""

**Show:**
- Manager dashboard (branch-specific)
- Pending submissions
- Approve/reject workflow
- Financial integrity rules

---

### BANK DEPOSIT & SETTLEMENT (45 seconds)

**Action:**
1. Navigate to Deposits
2. Create new deposit
3. Add approved submission
4. Show settlement

**Say:**
""Approved cash is deposited to the bank. Each deposit gets a unique reference number. Finally, when the bank confirms the amount, we mark it as settled. Any discrepancy between deposit and settlement is flagged.""

**Show:**
- Deposit creation
- Bank reference uniqueness
- Settlement matching

---

### ROLE-BASED ACCESS (30 seconds)

**Action:**
1. Show different user roles in dropdown
2. Briefly mention permissions

**Say:**
""The system enforces role-based permissions: agents can only record and submit, managers approve for their branch only, and admins have system-wide visibility. This prevents unauthorized actions.""

---

### TECHNICAL HIGHLIGHTS (30 seconds)

**Say:**
""Key technical features: PostgreSQL database for data integrity, JWT authentication, React frontend with Tailwind CSS, Django REST Framework backend, and comprehensive test coverage - 29 tests ensuring financial accuracy.""

---

### CLOSING (15 seconds)

**Say:**
""CMRS demonstrates complete cash lifecycle tracking with audit trail, financial integrity controls, and role-based security. The application is deployed and accessible at the public URL shown. Thank you.""

**Show:**
- Public URL
- Contact information in README

---

## Post-Recording Checklist

- [ ] Video quality is clear
- [ ] Audio is understandable
- [ ] All workflows demonstrated
- [ ] No sensitive information visible
- [ ] Video duration: 4-5 minutes
- [ ] Upload to YouTube/Vimeo
- [ ] Update README with video link

---

## Recording Tips

### Do's:
- Speak clearly and at moderate pace
- Use mouse movements to guide viewer attention
- Show error messages to demonstrate validation
- Explain business rules, not just UI
- Highlight security features

### Don'ts:
- Don't show passwords being typed (use credential buttons)
- Don't explain every field in detail
- Don't spend too long on any one screen
- Don't use jargon without explanation

---

## Backup Plan

If something goes wrong during recording:
- Pause recording
- Fix the issue
- Resume from last successful step
- Edit later if needed

---

**Estimated Time:** 5 minutes  
**File Size Target:** 50-100 MB (MP4, 720p or 1080p)
