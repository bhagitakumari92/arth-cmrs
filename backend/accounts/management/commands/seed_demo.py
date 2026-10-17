from decimal import Decimal
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from accounts.models import User, Branch
from customers.models import Customer
from loans.models import Loan, RepaymentSchedule
from collections_app.models import CashCollection, AgentCashSubmission, SubmissionCollectionMapping
from deposits.models import BankDeposit


class Command(BaseCommand):
    help = 'Seed demo data for CMRS'

    def handle(self, *args, **options):
        self.stdout.write('Seeding demo data...')

        with transaction.atomic():
            # Clear existing data (in reverse dependency order)
            BankDeposit.objects.all().delete()
            SubmissionCollectionMapping.objects.all().delete()
            AgentCashSubmission.objects.all().delete()
            CashCollection.objects.all().delete()
            RepaymentSchedule.objects.all().delete()
            Loan.objects.all().delete()
            Customer.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()
            Branch.objects.all().delete()

            # === BRANCHES ===
            branch_north = Branch.objects.create(
                name='North Branch', code='NB001', address='123 Main St, Delhi'
            )
            branch_south = Branch.objects.create(
                name='South Branch', code='SB001', address='456 Park Ave, Mumbai'
            )

            # === USERS ===
            admin = User.objects.create_superuser(
                username='admin', password='admin123',
                email='admin@arth.com', role='ADMIN',
                first_name='System', last_name='Admin'
            )

            manager1 = User.objects.create_user(
                username='manager1', password='manager123',
                email='manager1@arth.com', role='BRANCH_MANAGER',
                branch=branch_north, first_name='Raj', last_name='Sharma',
                phone='9876543210'
            )
            manager2 = User.objects.create_user(
                username='manager2', password='manager123',
                email='manager2@arth.com', role='BRANCH_MANAGER',
                branch=branch_south, first_name='Priya', last_name='Patel',
                phone='9876543211'
            )

            agent1 = User.objects.create_user(
                username='agent1', password='agent123',
                email='agent1@arth.com', role='COLLECTION_AGENT',
                branch=branch_north, first_name='Amit', last_name='Kumar',
                phone='9876543220'
            )
            agent2 = User.objects.create_user(
                username='agent2', password='agent123',
                email='agent2@arth.com', role='COLLECTION_AGENT',
                branch=branch_north, first_name='Suresh', last_name='Yadav',
                phone='9876543221'
            )
            agent3 = User.objects.create_user(
                username='agent3', password='agent123',
                email='agent3@arth.com', role='COLLECTION_AGENT',
                branch=branch_south, first_name='Vikram', last_name='Singh',
                phone='9876543222'
            )

            # === CUSTOMERS ===
            customers_data = [
                # North Branch
                ('Ramesh', 'Gupta', '9000000001', branch_north),
                ('Sunita', 'Devi', '9000000002', branch_north),
                ('Mohan', 'Lal', '9000000003', branch_north),
                ('Geeta', 'Sharma', '9000000004', branch_north),
                ('Ravi', 'Prakash', '9000000005', branch_north),
                ('Anita', 'Verma', '9000000006', branch_north),
                ('Deepak', 'Joshi', '9000000007', branch_north),
                # South Branch
                ('Lakshmi', 'Iyer', '9000000008', branch_south),
                ('Venkat', 'Rao', '9000000009', branch_south),
                ('Meena', 'Nair', '9000000010', branch_south),
                ('Arun', 'Menon', '9000000011', branch_south),
                ('Divya', 'Krishnan', '9000000012', branch_south),
                ('Kiran', 'Reddy', '9000000013', branch_south),
            ]

            customers = []
            for first, last, phone, branch in customers_data:
                c = Customer.objects.create(
                    first_name=first, last_name=last, phone=phone,
                    address=f'{first} {last} Address',
                    branch=branch, created_by=admin
                )
                customers.append(c)

            # === LOANS ===
            today = date.today()
            loans_data = [
                # (customer, agent, principal, tenure, months_ago)
                (customers[0], agent1, Decimal('100000.00'), 12, 3),   # North - agent1
                (customers[1], agent1, Decimal('50000.00'), 6, 2),      # North - agent1
                (customers[2], agent2, Decimal('75000.00'), 10, 4),     # North - agent2
                (customers[3], agent2, Decimal('200000.00'), 24, 6),    # North - agent2
                (customers[4], agent1, Decimal('30000.00'), 6, 1),      # North - agent1
                (customers[5], agent2, Decimal('150000.00'), 18, 2),    # North - agent2
                (customers[6], agent1, Decimal('80000.00'), 12, 0),     # North - agent1 (new)
                (customers[7], agent3, Decimal('120000.00'), 12, 5),    # South - agent3
                (customers[8], agent3, Decimal('60000.00'), 8, 3),      # South - agent3
                (customers[9], agent3, Decimal('90000.00'), 12, 2),     # South - agent3
                (customers[10], agent3, Decimal('45000.00'), 6, 1),     # South - agent3
                (customers[11], agent3, Decimal('200000.00'), 24, 8),   # South - agent3
            ]

            loans = []
            for customer, agent, principal, tenure, months_ago in loans_data:
                monthly = (principal / tenure).quantize(Decimal('0.01'))
                disb_date = today - timedelta(days=months_ago * 30)
                loan = Loan.objects.create(
                    customer=customer, branch=customer.branch,
                    assigned_agent=agent,
                    principal_amount=principal,
                    outstanding_amount=principal,
                    tenure_months=tenure,
                    monthly_installment=monthly,
                    disbursement_date=disb_date,
                    created_by=admin
                )
                # Generate schedule
                for i in range(1, tenure + 1):
                    due = disb_date + timedelta(days=i * 30)
                    RepaymentSchedule.objects.create(
                        loan=loan, installment_number=i,
                        due_date=due, amount=monthly
                    )
                loans.append(loan)

            # === COLLECTIONS (some partial payments) ===
            collections_data = [
                # Agent 1 collections (North)
                (loans[0], agent1, Decimal('8000.00'), today - timedelta(days=10)),
                (loans[0], agent1, Decimal('5000.00'), today - timedelta(days=5)),
                (loans[1], agent1, Decimal('8000.00'), today - timedelta(days=8)),
                (loans[4], agent1, Decimal('5000.00'), today - timedelta(days=3)),
                (loans[6], agent1, Decimal('6500.00'), today - timedelta(days=1)),
                # Agent 2 collections (North)
                (loans[2], agent2, Decimal('7500.00'), today - timedelta(days=7)),
                (loans[3], agent2, Decimal('8000.00'), today - timedelta(days=4)),
                (loans[5], agent2, Decimal('8000.00'), today - timedelta(days=2)),
                # Agent 3 collections (South)
                (loans[7], agent3, Decimal('10000.00'), today - timedelta(days=6)),
                (loans[8], agent3, Decimal('7500.00'), today - timedelta(days=3)),
                (loans[9], agent3, Decimal('7500.00'), today - timedelta(days=1)),
            ]

            all_collections = []
            for loan, agent, amount, coll_date in collections_data:
                c = CashCollection.objects.create(
                    loan=loan, agent=agent, branch=loan.branch,
                    amount=amount, collection_date=coll_date,
                    created_by=agent
                )
                # Update loan outstanding
                loan.outstanding_amount -= amount
                if loan.outstanding_amount <= 0:
                    loan.outstanding_amount = Decimal('0.00')
                    loan.status = 'CLOSED'
                loan.save()
                all_collections.append(c)

            # === AGENT CASH SUBMISSIONS ===

            # 1. Approved submission (agent1, North) - exact match
            sub1_collections = [all_collections[0], all_collections[1], all_collections[2]]
            sub1_expected = sum(c.amount for c in sub1_collections)
            sub1 = AgentCashSubmission.objects.create(
                agent=agent1, branch=branch_north,
                expected_amount=sub1_expected,
                actual_amount=sub1_expected,
                difference=Decimal('0.00'),
                status='APPROVED',
                verified_by=manager1,
                verified_at=timezone.now() - timedelta(days=4)
            )
            for c in sub1_collections:
                c.status = 'VERIFIED'
                c.save()
                SubmissionCollectionMapping.objects.create(submission=sub1, collection=c)

            # 2. Approved with discrepancy (agent2, North) - short by 500
            sub2_collections = [all_collections[5], all_collections[6]]
            sub2_expected = sum(c.amount for c in sub2_collections)
            sub2_actual = sub2_expected - Decimal('500.00')
            sub2 = AgentCashSubmission.objects.create(
                agent=agent2, branch=branch_north,
                expected_amount=sub2_expected,
                actual_amount=sub2_actual,
                difference=sub2_actual - sub2_expected,
                status='APPROVED_WITH_DISCREPANCY',
                discrepancy_notes='Agent short by ₹500. Agent confirmed personal expense deduction.',
                verified_by=manager1,
                verified_at=timezone.now() - timedelta(days=2)
            )
            for c in sub2_collections:
                c.status = 'VERIFIED'
                c.save()
                SubmissionCollectionMapping.objects.create(submission=sub2, collection=c)

            # 3. Rejected submission (agent3, South) - agent resubmitted later
            sub3_collections = [all_collections[8]]
            sub3_expected = sum(c.amount for c in sub3_collections)
            sub3 = AgentCashSubmission.objects.create(
                agent=agent3, branch=branch_south,
                expected_amount=sub3_expected,
                actual_amount=sub3_expected - Decimal('2000.00'),
                difference=Decimal('-2000.00'),
                status='REJECTED',
                discrepancy_notes='Cash short by ₹2000. Agent could not explain. Rejected.',
                verified_by=manager2,
                verified_at=timezone.now() - timedelta(days=3)
            )
            # Rejected: collections go back to COLLECTED
            for c in sub3_collections:
                c.status = 'COLLECTED'
                c.save()
                SubmissionCollectionMapping.objects.create(submission=sub3, collection=c)

            # 4. Pending submission (agent3, South) - waiting for verification
            sub4_collections = [all_collections[9]]
            sub4_expected = sum(c.amount for c in sub4_collections)
            sub4 = AgentCashSubmission.objects.create(
                agent=agent3, branch=branch_south,
                expected_amount=sub4_expected,
                status='PENDING',
            )
            for c in sub4_collections:
                c.status = 'SUBMITTED'
                c.save()
                SubmissionCollectionMapping.objects.create(submission=sub4, collection=c)

            # === BANK DEPOSITS ===

            # 1. Settled deposit (from sub1)
            dep1 = BankDeposit.objects.create(
                bank_name='State Bank of India',
                deposit_date=today - timedelta(days=3),
                amount=sub1.actual_amount,
                bank_reference='SBI-DEP-20241001-001',
                branch=branch_north,
                submission=sub1,
                status='SETTLED',
                settled_amount=sub1.actual_amount,
                settlement_mismatch=Decimal('0.00'),
                settled_at=timezone.now() - timedelta(days=2),
                settled_by=manager1,
                created_by=manager1
            )
            for c in sub1_collections:
                c.status = 'SETTLED'
                c.save()

            # 2. Pending deposit (from sub2)
            dep2 = BankDeposit.objects.create(
                bank_name='HDFC Bank',
                deposit_date=today - timedelta(days=1),
                amount=sub2.actual_amount,
                bank_reference='HDFC-DEP-20241003-001',
                branch=branch_north,
                submission=sub2,
                status='PENDING',
                created_by=manager1
            )
            for c in sub2_collections:
                c.status = 'DEPOSITED'
                c.save()

            self.stdout.write(self.style.SUCCESS('Demo data seeded successfully!'))
            self.stdout.write('')
            self.stdout.write('=== Demo Credentials ===')
            self.stdout.write(f'  Admin:           admin / admin123')
            self.stdout.write(f'  Branch Manager 1 (North): manager1 / manager123')
            self.stdout.write(f'  Branch Manager 2 (South): manager2 / manager123')
            self.stdout.write(f'  Agent 1 (North): agent1 / agent123')
            self.stdout.write(f'  Agent 2 (North): agent2 / agent123')
            self.stdout.write(f'  Agent 3 (South): agent3 / agent123')
