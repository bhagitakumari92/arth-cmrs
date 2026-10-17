from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import BankDeposit
from .serializers import BankDepositSerializer, SettlementSerializer


class BankDepositViewSet(viewsets.ModelViewSet):
    serializer_class = BankDepositSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        qs = BankDeposit.objects.select_related('branch', 'submission', 'submission__agent').all()
        user = self.request.user

        if user.role == 'BRANCH_MANAGER':
            qs = qs.filter(branch=user.branch)
        elif user.role == 'COLLECTION_AGENT':
            qs = qs.filter(submission__agent=user)

        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        branch_id = self.request.query_params.get('branch')
        if branch_id and user.role == 'ADMIN':
            qs = qs.filter(branch_id=branch_id)

        return qs

    @action(detail=True, methods=['post'])
    def settle(self, request, pk=None):
        """Mark a deposit as settled/failed/delayed. Only branch managers."""
        deposit = self.get_object()
        user = request.user

        if user.role not in ('ADMIN', 'BRANCH_MANAGER'):
            return Response(
                {'error': 'Only admins and branch managers can update settlement status.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if deposit.status == 'SETTLED':
            return Response(
                {'error': 'This deposit has already been settled.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = SettlementSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        with transaction.atomic():
            deposit = BankDeposit.objects.select_for_update().get(pk=pk)
            deposit.status = data['status']
            deposit.settled_amount = data['settled_amount']
            deposit.calculate_settlement_mismatch()
            deposit.settled_at = timezone.now()
            deposit.settled_by = user
            deposit.notes = data.get('notes', deposit.notes)
            deposit.save()

            if deposit.status == 'SETTLED':
                # Update collections to SETTLED
                for mapping in deposit.submission.collection_mappings.all():
                    mapping.collection.status = 'SETTLED'
                    mapping.collection.save()

        response_serializer = BankDepositSerializer(deposit)
        return Response(response_serializer.data)

    @action(detail=False, methods=['get'])
    def approved_submissions(self, request):
        """Get approved submissions available for deposit."""
        user = request.user
        from collections_app.models import AgentCashSubmission
        qs = AgentCashSubmission.objects.filter(
            status__in=['APPROVED', 'APPROVED_WITH_DISCREPANCY']
        ).exclude(bank_deposit__isnull=False)

        if user.role == 'BRANCH_MANAGER':
            qs = qs.filter(branch=user.branch)

        from collections_app.serializers import AgentCashSubmissionSerializer
        serializer = AgentCashSubmissionSerializer(qs, many=True)
        return Response(serializer.data)
