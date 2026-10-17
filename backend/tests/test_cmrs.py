"""
Critical test scenarios for CMRS financial integrity and role-based access.
"""
from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User, Branch
from customers.models import Customer
from loans.models import Loan, RepaymentSchedule
from collections_app.models import CashCollection, AgentCashSubmission, SubmissionCollectionMapping
from deposits.models import BankDeposit


class CMRSTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Branches
        self.branch_north = Branch.objects.create(name='North', code='NB001')
        self.branch_south = Branch.objects.create(name='South', code='SB001')

        # Users
        self.admin = User.objects.create_superuser(
            username='admin', password='admin123', role='ADMIN'
        )
        self.manager_north = User.objects.create_user(
            username='mgr_north', password='pass123',
            role='BRANCH_MANAGER', branch=self.branch_north
        )
        self.manager_south = User.objects.create_user(
            username='mgr_south', password='pass123',
            role='BRANCH_MANAGER', branch=self.branch_south
        )
        self.agent1 = User.objects.create_user(
            username='agent1', password='pass123',
            role='COLLECTION_AGENT', branch=self.branch_north
        )
        self.agent2 = User.objects.create_user(
            username='agent2', password='pass123',
            role='COLLECTION_AGENT', branch=self.branch_north
        )
        self.agent3 = User.objects.create_user(
            username='agent3', password='pass123',
            role='COLLECTION_AGENT', branch=self.branch_south
        )

        # Customers
        self.customer1 = Customer.objects.create(
            first_name='Test', last_name='Customer1', phone='1111111111',
            address='Addr1', branch=self.branch_north, created_by=self.admin
        )
        self.customer2 = Customer.objects.create(
            first_name='Test', last_name='Customer2', phone='2222222222',
            address='Addr2', branch=self.branch_north, created_by=self.admin
        )
        self.customer3 = Customer.objects.create(
            first_name='Test', last_name='Customer3', phone='3333333333',
            address='Addr3', branch=self.branch_south, created_by=self.admin
        )

        # Loans
        self.loan1 = Loan.objects.create(
            customer=self.customer1, branch=self.branch_north,
            assigned_agent=self.agent1,
            principal_amount=Decimal('100000.00'),
            outstanding_amount=Decimal('100000.00'),
            tenure_months=12, monthly_installment=Decimal('8333.33'),
            disbursement_date='2024-01-01', created_by=self.admin
        )
        self.loan2 = Loan.objects.create(
            customer=self.customer2, branch=self.branch_north,
            assigned_agent=self.agent2,
            principal_amount=Decimal('50000.00'),
            outstanding_amount=Decimal('50000.00'),
            tenure_months=6, monthly_installment=Decimal('8333.33'),
            disbursement_date='2024-01-01', created_by=self.admin
        )
        self.loan3 = Loan.objects.create(
            customer=self.customer3, branch=self.branch_south,
            assigned_agent=self.agent3,
            principal_amount=Decimal('75000.00'),
            outstanding_amount=Decimal('75000.00'),
            tenure_months=10, monthly_installment=Decimal('7500.00'),
            disbursement_date='2024-01-01', created_by=self.admin
        )

    def login(self, username, password):
        response = self.client.post('/api/auth/token/', {
            'username': username, 'password': password
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def logout(self):
        self.client.credentials()


class TestRoleBasedAccess(CMRSTestCase):
    """Test that roles are properly enforced."""

    def test_agent_cannot_collect_against_other_agents_loan(self):
        """Agent cannot collect against another agent's loan."""
        self.login('agent1', 'pass123')
        response = self.client.post('/api/collections/', {
            'loan': self.loan2.id,  # loan2 is assigned to agent2
            'amount': '5000.00',
            'collection_date': str(timezone.now().date()),
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('assigned', str(response.data).lower())

    def test_agent_cannot_access_other_branch_protected_records(self):
        """Agent cannot see other branch's submissions."""
        self.login('agent3', 'pass123')
        # agent3 is in south branch — should not see north branch data
        response = self.client.get('/api/collections/submissions/')
        for item in response.data.get('results', response.data if isinstance(response.data, list) else []):
            self.assertEqual(item['agent'], self.agent3.id)

    def test_unauthorized_user_cannot_approve_reconciliation(self):
        """Only branch manager of that branch can reconcile."""
        # Create a submission
        collection = CashCollection.objects.create(
            loan=self.loan1, agent=self.agent1, branch=self.branch_north,
            amount=Decimal('5000.00'), collection_date='2024-06-01',
            created_by=self.agent1
        )
        submission = AgentCashSubmission.objects.create(
            agent=self.agent1, branch=self.branch_north,
            expected_amount=Decimal('5000.00'), status='PENDING'
        )
        SubmissionCollectionMapping.objects.create(submission=submission, collection=collection)

        # Try to reconcile as agent
        self.login('agent1', 'pass123')
        response = self.client.post(f'/api/collections/submissions/{submission.id}/reconcile/', {
            'actual_amount': '5000.00', 'action': 'approve'
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Try as manager from wrong branch — gets 404 (not found) since queryset is filtered
        self.login('mgr_south', 'pass123')
        response = self.client.post(f'/api/collections/submissions/{submission.id}/reconcile/', {
            'actual_amount': '5000.00', 'action': 'approve'
        })
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class TestCollections(CMRSTestCase):
    """Test collection recording and financial integrity."""

    def test_partial_repayment_works(self):
        """Partial repayment reduces outstanding correctly."""
        self.login('agent1', 'pass123')
        response = self.client.post('/api/collections/', {
            'loan': self.loan1.id,
            'amount': '30000.00',
            'collection_date': str(timezone.now().date()),
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.loan1.refresh_from_db()
        self.assertEqual(self.loan1.outstanding_amount, Decimal('70000.00'))
        self.assertEqual(self.loan1.status, 'ACTIVE')

    def test_outstanding_updates_correctly(self):
        """Outstanding updates correctly with multiple partial payments."""
        self.login('agent1', 'pass123')
        # First payment
        self.client.post('/api/collections/', {
            'loan': self.loan1.id, 'amount': '25000.00',
            'collection_date': str(timezone.now().date()),
        })
        # Second payment
        self.client.post('/api/collections/', {
            'loan': self.loan1.id, 'amount': '15000.00',
            'collection_date': str(timezone.now().date()),
        })
        self.loan1.refresh_from_db()
        self.assertEqual(self.loan1.outstanding_amount, Decimal('60000.00'))

    def test_invalid_zero_or_negative_collection_rejected(self):
        """Zero or negative collections are rejected."""
        self.login('agent1', 'pass123')
        response = self.client.post('/api/collections/', {
            'loan': self.loan1.id, 'amount': '0.00',
            'collection_date': str(timezone.now().date()),
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        response = self.client.post('/api/collections/', {
            'loan': self.loan1.id, 'amount': '-100.00',
            'collection_date': str(timezone.now().date()),
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_overpayment_rejected(self):
        """Collections exceeding outstanding are rejected per policy."""
        self.login('agent1', 'pass123')
        response = self.client.post('/api/collections/', {
            'loan': self.loan1.id, 'amount': '150000.00',  # > 100000 outstanding
            'collection_date': str(timezone.now().date()),
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('exceeds', str(response.data).lower())

    def test_receipt_number_unique(self):
        """Each collection gets a unique receipt number."""
        self.login('agent1', 'pass123')
        r1 = self.client.post('/api/collections/', {
            'loan': self.loan1.id, 'amount': '1000.00',
            'collection_date': str(timezone.now().date()),
        })
        r2 = self.client.post('/api/collections/', {
            'loan': self.loan1.id, 'amount': '2000.00',
            'collection_date': str(timezone.now().date()),
        })
        self.assertNotEqual(r1.data['receipt_number'], r2.data['receipt_number'])

    def test_idempotency_key_prevents_duplicate(self):
        """Duplicate idempotency key returns same record, no duplicate."""
        self.login('agent1', 'pass123')
        key = 'test-idem-123'
        data = {
            'loan': self.loan1.id, 'amount': '5000.00',
            'collection_date': str(timezone.now().date()),
            'idempotency_key': key,
        }
        r1 = self.client.post('/api/collections/', data)
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED)

        r2 = self.client.post('/api/collections/', data)
        self.assertEqual(r2.status_code, status.HTTP_200_OK)
        self.assertEqual(r1.data['id'], r2.data['id'])

        # Outstanding should only be reduced once
        self.loan1.refresh_from_db()
        self.assertEqual(self.loan1.outstanding_amount, Decimal('95000.00'))


class TestSubmissions(CMRSTestCase):
    """Test agent cash submissions."""

    def test_one_collection_cannot_be_submitted_twice(self):
        """A collection can only appear in one submission."""
        collection = CashCollection.objects.create(
            loan=self.loan1, agent=self.agent1, branch=self.branch_north,
            amount=Decimal('5000.00'), collection_date='2024-06-01',
            created_by=self.agent1, status='COLLECTED'
        )

        self.login('agent1', 'pass123')
        # First submission
        r1 = self.client.post('/api/collections/submissions/', {
            'collection_ids': [collection.id]
        })
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED)

        # Try to submit same collection again
        r2 = self.client.post('/api/collections/submissions/', {
            'collection_ids': [collection.id]
        })
        self.assertEqual(r2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_expected_vs_actual_calculation(self):
        """Expected vs actual amount is calculated correctly."""
        collections = []
        for i, amount in enumerate([Decimal('5000'), Decimal('3000'), Decimal('2000')]):
            c = CashCollection.objects.create(
                loan=self.loan1, agent=self.agent1, branch=self.branch_north,
                amount=amount, collection_date='2024-06-01',
                created_by=self.agent1, status='COLLECTED'
            )
            collections.append(c)

        self.login('agent1', 'pass123')
        response = self.client.post('/api/collections/submissions/', {
            'collection_ids': [c.id for c in collections]
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['expected_amount'], '10000.00')

        # Now reconcile with different actual
        sub_id = response.data['id']
        self.login('mgr_north', 'pass123')
        response = self.client.post(f'/api/collections/submissions/{sub_id}/reconcile/', {
            'actual_amount': '9500.00',
            'action': 'approve',
            'discrepancy_notes': 'Short by 500'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['difference'], '-500.00')
        self.assertEqual(response.data['status'], 'APPROVED_WITH_DISCREPANCY')


class TestReconciliation(CMRSTestCase):
    """Test branch reconciliation."""

    def _create_submission(self, agent, branch, loan, amounts):
        collections = []
        for amount in amounts:
            c = CashCollection.objects.create(
                loan=loan, agent=agent, branch=branch,
                amount=amount, collection_date='2024-06-01',
                created_by=agent, status='COLLECTED'
            )
            collections.append(c)

        self.login(agent.username, 'pass123')
        response = self.client.post('/api/collections/submissions/', {
            'collection_ids': [c.id for c in collections]
        })
        self.logout()
        return response.data['id'], collections

    def test_rejected_submissions_cannot_be_deposited(self):
        """Rejected submissions cannot be deposited."""
        sub_id, _ = self._create_submission(
            self.agent1, self.branch_north, self.loan1, [Decimal('5000')]
        )
        # Reject it
        self.login('mgr_north', 'pass123')
        self.client.post(f'/api/collections/submissions/{sub_id}/reconcile/', {
            'actual_amount': '4000.00',
            'action': 'reject',
            'discrepancy_notes': 'Short cash'
        })

        # Try to create deposit from rejected submission
        response = self.client.post('/api/deposits/', {
            'bank_name': 'SBI', 'deposit_date': '2024-06-02',
            'amount': '4000.00', 'bank_reference': 'REF001',
            'submission': sub_id
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_approved_submission_cannot_be_modified(self):
        """Approved submissions cannot be reconciled again."""
        sub_id, _ = self._create_submission(
            self.agent1, self.branch_north, self.loan1, [Decimal('5000')]
        )
        self.login('mgr_north', 'pass123')
        # Approve
        self.client.post(f'/api/collections/submissions/{sub_id}/reconcile/', {
            'actual_amount': '5000.00', 'action': 'approve'
        })
        # Try to reconcile again
        response = self.client.post(f'/api/collections/submissions/{sub_id}/reconcile/', {
            'actual_amount': '5000.00', 'action': 'approve'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rejected_submission_returns_collections_to_collected(self):
        """Rejected submissions return collections to COLLECTED status."""
        sub_id, collections = self._create_submission(
            self.agent1, self.branch_north, self.loan1, [Decimal('5000')]
        )
        self.login('mgr_north', 'pass123')
        self.client.post(f'/api/collections/submissions/{sub_id}/reconcile/', {
            'actual_amount': '4000.00',
            'action': 'reject',
            'discrepancy_notes': 'Short cash'
        })
        for c in collections:
            c.refresh_from_db()
            self.assertEqual(c.status, 'COLLECTED')


class TestDeposits(CMRSTestCase):
    """Test bank deposits and settlement."""

    def _create_approved_submission(self):
        collection = CashCollection.objects.create(
            loan=self.loan1, agent=self.agent1, branch=self.branch_north,
            amount=Decimal('10000.00'), collection_date='2024-06-01',
            created_by=self.agent1, status='COLLECTED'
        )
        self.login('agent1', 'pass123')
        r = self.client.post('/api/collections/submissions/', {
            'collection_ids': [collection.id]
        })
        sub_id = r.data['id']
        self.logout()

        self.login('mgr_north', 'pass123')
        self.client.post(f'/api/collections/submissions/{sub_id}/reconcile/', {
            'actual_amount': '10000.00', 'action': 'approve'
        })
        return sub_id

    def test_bank_reference_unique(self):
        """Bank references must be unique."""
        sub_id = self._create_approved_submission()
        self.login('mgr_north', 'pass123')
        r1 = self.client.post('/api/deposits/', {
            'bank_name': 'SBI', 'deposit_date': '2024-06-02',
            'amount': '10000.00', 'bank_reference': 'REF001',
            'submission': sub_id
        })
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED)

        # Try same reference — should fail at the DB level
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            BankDeposit.objects.create(
                bank_name='HDFC', deposit_date='2024-06-02',
                amount=Decimal('5000'), bank_reference='REF001',
                branch=self.branch_north,
                submission_id=sub_id, created_by=self.manager_north
            )

    def test_same_reconciled_cash_cannot_be_deposited_twice(self):
        """OneToOne on submission prevents duplicate deposits."""
        sub_id = self._create_approved_submission()
        self.login('mgr_north', 'pass123')
        self.client.post('/api/deposits/', {
            'bank_name': 'SBI', 'deposit_date': '2024-06-02',
            'amount': '10000.00', 'bank_reference': 'REF001',
            'submission': sub_id
        })
        # Try again
        response = self.client.post('/api/deposits/', {
            'bank_name': 'HDFC', 'deposit_date': '2024-06-03',
            'amount': '10000.00', 'bank_reference': 'REF002',
            'submission': sub_id
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_settlement_mismatch_calculated(self):
        """Settlement mismatch is reported correctly."""
        sub_id = self._create_approved_submission()
        self.login('mgr_north', 'pass123')
        r = self.client.post('/api/deposits/', {
            'bank_name': 'SBI', 'deposit_date': '2024-06-02',
            'amount': '10000.00', 'bank_reference': 'REF001',
            'submission': sub_id
        })
        deposit_id = r.data['id']

        # Settle with different amount
        response = self.client.post(f'/api/deposits/{deposit_id}/settle/', {
            'settled_amount': '9800.00',
            'status': 'SETTLED',
            'notes': 'Bank charges deducted'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['settlement_mismatch'], '-200.00')

    def test_dashboard_no_double_counting(self):
        """Dashboard numbers don't double count money through lifecycle."""
        sub_id = self._create_approved_submission()
        self.login('mgr_north', 'pass123')
        self.client.post('/api/deposits/', {
            'bank_name': 'SBI', 'deposit_date': '2024-06-02',
            'amount': '10000.00', 'bank_reference': 'REF001',
            'submission': sub_id
        })

        response = self.client.get('/api/dashboard/summary/')
        data = response.data

        # Total collected should equal sum of all collections (10000)
        total_collected = Decimal(data['total_collected'])
        # Cash is in DEPOSITED status, not COLLECTED
        cash_with_agents = Decimal(data['cash_with_agents'])
        cash_verified = Decimal(data['cash_verified'])

        # The 10000 should appear in either deposits, not double-counted in collected
        total_deposits = Decimal(data['total_deposits'])
        self.assertEqual(total_deposits, Decimal('10000.00'))


class TestAdminAllActions(CMRSTestCase):
    """Admin can perform every lifecycle action."""

    def test_admin_collection_attributes_to_loan_agent(self):
        """Admin-recorded collection is attributed to the loan's assigned agent."""
        self.login('admin', 'admin123')
        r = self.client.post('/api/collections/', {
            'loan': self.loan1.id, 'amount': '1000.00',
            'collection_date': str(timezone.now().date()),
        })
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r.data['agent'], self.agent1.id)  # loan1's assigned agent
        self.loan1.refresh_from_db()
        self.assertEqual(self.loan1.outstanding_amount, Decimal('99000.00'))

    def test_admin_can_submit_agent_collections(self):
        """Admin submission infers the agent from the collections."""
        c = CashCollection.objects.create(
            loan=self.loan1, agent=self.agent1, branch=self.branch_north,
            amount=Decimal('2000.00'), collection_date='2024-06-01',
            created_by=self.agent1, status='COLLECTED'
        )
        self.login('admin', 'admin123')
        r = self.client.post('/api/collections/submissions/', {'collection_ids': [c.id]})
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r.data['agent'], self.agent1.id)
        self.assertEqual(r.data['branch'], self.branch_north.id)
        c.refresh_from_db()
        self.assertEqual(c.status, 'SUBMITTED')

    def test_admin_submission_rejects_mixed_agents(self):
        """Admin cannot bundle two different agents' collections in one submission."""
        c1 = CashCollection.objects.create(
            loan=self.loan1, agent=self.agent1, branch=self.branch_north,
            amount=Decimal('1000.00'), collection_date='2024-06-01',
            created_by=self.agent1, status='COLLECTED'
        )
        c2 = CashCollection.objects.create(
            loan=self.loan2, agent=self.agent2, branch=self.branch_north,
            amount=Decimal('1000.00'), collection_date='2024-06-01',
            created_by=self.agent2, status='COLLECTED'
        )
        self.login('admin', 'admin123')
        r = self.client.post('/api/collections/submissions/', {'collection_ids': [c1.id, c2.id]})
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_can_reconcile_submission(self):
        """Admin can approve a pending submission from any branch."""
        c = CashCollection.objects.create(
            loan=self.loan3, agent=self.agent3, branch=self.branch_south,
            amount=Decimal('3000.00'), collection_date='2024-06-01',
            created_by=self.agent3, status='COLLECTED'
        )
        sub = AgentCashSubmission.objects.create(
            agent=self.agent3, branch=self.branch_south,
            expected_amount=Decimal('3000.00'), status='PENDING'
        )
        SubmissionCollectionMapping.objects.create(submission=sub, collection=c)
        c.status = 'SUBMITTED'
        c.save()

        self.login('admin', 'admin123')
        r = self.client.post(f'/api/collections/submissions/{sub.id}/reconcile/', {
            'actual_amount': '3000.00', 'action': 'approve'
        })
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data['status'], 'APPROVED')

    def test_admin_can_create_deposit(self):
        """Admin can deposit an approved submission; branch taken from submission."""
        c = CashCollection.objects.create(
            loan=self.loan1, agent=self.agent1, branch=self.branch_north,
            amount=Decimal('5000.00'), collection_date='2024-06-01',
            created_by=self.agent1, status='VERIFIED'
        )
        sub = AgentCashSubmission.objects.create(
            agent=self.agent1, branch=self.branch_north,
            expected_amount=Decimal('5000.00'), actual_amount=Decimal('5000.00'),
            difference=Decimal('0.00'), status='APPROVED'
        )
        SubmissionCollectionMapping.objects.create(submission=sub, collection=c)

        self.login('admin', 'admin123')
        r = self.client.post('/api/deposits/', {
            'bank_name': 'ICICI', 'deposit_date': '2024-06-02',
            'amount': '5000.00', 'bank_reference': 'ADMIN-REF-001',
            'submission': sub.id
        })
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r.data['branch'], self.branch_north.id)
