from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from accounts.permissions import IsAdminOrBranchManager
from .models import Loan, RepaymentSchedule
from .serializers import LoanSerializer, LoanListSerializer, LoanUpdateSerializer, RepaymentScheduleSerializer


class LoanViewSet(viewsets.ModelViewSet):
    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdminOrBranchManager()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'list':
            return LoanListSerializer
        if self.action in ('update', 'partial_update'):
            return LoanUpdateSerializer
        return LoanSerializer

    def get_queryset(self):
        qs = Loan.objects.select_related('customer', 'branch', 'assigned_agent').all()
        user = self.request.user

        if user.role == 'COLLECTION_AGENT':
            qs = qs.filter(assigned_agent=user)
        elif user.role == 'BRANCH_MANAGER':
            qs = qs.filter(branch=user.branch)
        # Admin sees all

        # Filters
        branch_id = self.request.query_params.get('branch')
        if branch_id:
            qs = qs.filter(branch_id=branch_id)

        agent_id = self.request.query_params.get('agent')
        if agent_id:
            qs = qs.filter(assigned_agent_id=agent_id)

        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        return qs

    def destroy(self, request, *args, **kwargs):
        loan = self.get_object()
        if loan.collections.exists():
            return Response(
                {'error': 'Cannot delete this loan — collections have been recorded against it. Close it instead.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Remove schedule entries first (CASCADE handles it, but be explicit)
        loan.repayment_schedules.all().delete()
        return super().destroy(request, *args, **kwargs)


class RepaymentScheduleViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = RepaymentScheduleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = RepaymentSchedule.objects.select_related('loan', 'loan__customer').all()
        loan_id = self.request.query_params.get('loan')
        if loan_id:
            qs = qs.filter(loan_id=loan_id)
        return qs
