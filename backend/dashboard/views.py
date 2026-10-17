from decimal import Decimal
from django.db.models import Sum, Count, Q
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from loans.models import Loan, RepaymentSchedule
from collections_app.models import CashCollection, AgentCashSubmission
from deposits.models import BankDeposit
from customers.models import Customer


class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Base querysets with role-based filtering
        loans_qs = Loan.objects.all()
        collections_qs = CashCollection.objects.all()
        submissions_qs = AgentCashSubmission.objects.all()
        deposits_qs = BankDeposit.objects.all()

        if user.role == 'COLLECTION_AGENT':
            loans_qs = loans_qs.filter(assigned_agent=user)
            collections_qs = collections_qs.filter(agent=user)
            submissions_qs = submissions_qs.filter(agent=user)
            deposits_qs = deposits_qs.filter(submission__agent=user)
        elif user.role == 'BRANCH_MANAGER':
            loans_qs = loans_qs.filter(branch=user.branch)
            collections_qs = collections_qs.filter(branch=user.branch)
            submissions_qs = submissions_qs.filter(branch=user.branch)
            deposits_qs = deposits_qs.filter(branch=user.branch)

        # Apply filters
        branch_id = request.query_params.get('branch')
        if branch_id and user.role == 'ADMIN':
            loans_qs = loans_qs.filter(branch_id=branch_id)
            collections_qs = collections_qs.filter(branch_id=branch_id)
            submissions_qs = submissions_qs.filter(branch_id=branch_id)
            deposits_qs = deposits_qs.filter(branch_id=branch_id)

        agent_id = request.query_params.get('agent')
        if agent_id:
            loans_qs = loans_qs.filter(assigned_agent_id=agent_id)
            collections_qs = collections_qs.filter(agent_id=agent_id)

        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        if date_from:
            collections_qs = collections_qs.filter(collection_date__gte=date_from)
        if date_to:
            collections_qs = collections_qs.filter(collection_date__lte=date_to)

        # Summary calculations
        total_loan_amount = loans_qs.aggregate(t=Sum('principal_amount'))['t'] or Decimal('0')
        total_outstanding = loans_qs.aggregate(t=Sum('outstanding_amount'))['t'] or Decimal('0')
        total_collected = collections_qs.aggregate(t=Sum('amount'))['t'] or Decimal('0')

        # Cash with agents (collected but not submitted)
        cash_with_agents = collections_qs.filter(status='COLLECTED').aggregate(
            t=Sum('amount'))['t'] or Decimal('0')

        # Cash submitted but not verified
        cash_submitted = collections_qs.filter(status='SUBMITTED').aggregate(
            t=Sum('amount'))['t'] or Decimal('0')

        # Branch verified cash
        cash_verified = collections_qs.filter(status='VERIFIED').aggregate(
            t=Sum('amount'))['t'] or Decimal('0')

        # Bank deposits
        total_deposits = deposits_qs.aggregate(t=Sum('amount'))['t'] or Decimal('0')
        pending_deposits = deposits_qs.filter(status='PENDING').aggregate(
            t=Sum('amount'))['t'] or Decimal('0')
        settled_deposits = deposits_qs.filter(status='SETTLED').aggregate(
            t=Sum('amount'))['t'] or Decimal('0')
        total_settled = deposits_qs.filter(status='SETTLED').aggregate(
            t=Sum('settled_amount'))['t'] or Decimal('0')

        # Reconciliation discrepancies
        discrepant_submissions = submissions_qs.filter(
            status='APPROVED_WITH_DISCREPANCY'
        )
        total_discrepancy = discrepant_submissions.aggregate(
            t=Sum('difference'))['t'] or Decimal('0')

        # Counts
        active_loans = loans_qs.filter(status='ACTIVE').count()
        total_customers = Customer.objects.count()
        if user.role == 'BRANCH_MANAGER':
            total_customers = Customer.objects.filter(branch=user.branch).count()

        return Response({
            'total_loan_amount': str(total_loan_amount),
            'total_outstanding': str(total_outstanding),
            'total_collected': str(total_collected),
            'cash_with_agents': str(cash_with_agents),
            'cash_submitted': str(cash_submitted),
            'cash_verified': str(cash_verified),
            'total_deposits': str(total_deposits),
            'pending_deposits': str(pending_deposits),
            'settled_deposits': str(settled_deposits),
            'total_settled_amount': str(total_settled),
            'total_discrepancy': str(total_discrepancy),
            'active_loans': active_loans,
            'total_customers': total_customers,
            'collection_count': collections_qs.count(),
            'pending_submissions': submissions_qs.filter(status='PENDING').count(),
            'discrepant_submissions_count': discrepant_submissions.count(),
        })


class DashboardRecentActivityView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        collections_qs = CashCollection.objects.select_related('loan__customer', 'agent')
        submissions_qs = AgentCashSubmission.objects.select_related('agent', 'branch')
        deposits_qs = BankDeposit.objects.select_related('branch')

        if user.role == 'COLLECTION_AGENT':
            collections_qs = collections_qs.filter(agent=user)
            submissions_qs = submissions_qs.filter(agent=user)
            deposits_qs = deposits_qs.filter(submission__agent=user)
        elif user.role == 'BRANCH_MANAGER':
            collections_qs = collections_qs.filter(branch=user.branch)
            submissions_qs = submissions_qs.filter(branch=user.branch)
            deposits_qs = deposits_qs.filter(branch=user.branch)

        # Slice only AFTER filtering — filtering a sliced queryset raises an error
        collections_qs = collections_qs.order_by('-created_at')[:10]
        submissions_qs = submissions_qs.order_by('-created_at')[:10]
        deposits_qs = deposits_qs.order_by('-created_at')[:10]

        recent_collections = [{
            'id': c.id,
            'receipt_number': c.receipt_number,
            'customer': c.loan.customer.full_name,
            'amount': str(c.amount),
            'status': c.status,
            'agent': c.agent.get_full_name() or c.agent.username,
            'date': str(c.collection_date),
        } for c in collections_qs]

        recent_submissions = [{
            'id': s.id,
            'agent': s.agent.get_full_name() or s.agent.username,
            'branch': s.branch.name,
            'expected': str(s.expected_amount),
            'actual': str(s.actual_amount) if s.actual_amount else None,
            'status': s.status,
            'date': str(s.submission_date),
        } for s in submissions_qs]

        recent_deposits = [{
            'id': d.id,
            'bank': d.bank_name,
            'reference': d.bank_reference,
            'amount': str(d.amount),
            'status': d.status,
            'date': str(d.deposit_date),
        } for d in deposits_qs]

        return Response({
            'recent_collections': recent_collections,
            'recent_submissions': recent_submissions,
            'recent_deposits': recent_deposits,
        })
