from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import CashCollection, AgentCashSubmission, SubmissionCollectionMapping
from .serializers import (
    CashCollectionSerializer, AgentCashSubmissionSerializer,
    ReconciliationActionSerializer
)


class CashCollectionViewSet(viewsets.ModelViewSet):
    serializer_class = CashCollectionSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'head', 'options']  # No PUT/PATCH/DELETE

    def get_queryset(self):
        qs = CashCollection.objects.select_related('loan', 'loan__customer', 'agent', 'branch').all()
        user = self.request.user

        if user.role == 'COLLECTION_AGENT':
            qs = qs.filter(agent=user)
        elif user.role == 'BRANCH_MANAGER':
            qs = qs.filter(branch=user.branch)

        # Filters
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        branch_id = self.request.query_params.get('branch')
        if branch_id and user.role == 'ADMIN':
            qs = qs.filter(branch_id=branch_id)

        agent_id = self.request.query_params.get('agent')
        if agent_id and user.role in ('ADMIN', 'BRANCH_MANAGER'):
            qs = qs.filter(agent_id=agent_id)

        date_from = self.request.query_params.get('date_from')
        if date_from:
            qs = qs.filter(collection_date__gte=date_from)

        date_to = self.request.query_params.get('date_to')
        if date_to:
            qs = qs.filter(collection_date__lte=date_to)

        loan_id = self.request.query_params.get('loan')
        if loan_id:
            qs = qs.filter(loan_id=loan_id)

        return qs

    def create(self, request, *args, **kwargs):
        # Handle idempotency
        idempotency_key = request.data.get('idempotency_key')
        if idempotency_key:
            existing = CashCollection.objects.filter(idempotency_key=idempotency_key).first()
            if existing:
                serializer = self.get_serializer(existing)
                return Response(serializer.data, status=status.HTTP_200_OK)

        return super().create(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def daily_total(self, request):
        """Get agent's daily collection total."""
        user = request.user
        date = request.query_params.get('date', timezone.now().date())
        qs = CashCollection.objects.filter(agent=user, collection_date=date)
        total = sum(c.amount for c in qs) or Decimal('0.00')
        count = qs.count()
        return Response({'date': date, 'total': str(total), 'count': count})

    @action(detail=False, methods=['get'])
    def eligible_for_submission(self, request):
        """Get collections eligible for submission to branch.

        Agents see their own. Admin/manager can pass ?agent=<id> to act on
        behalf of an agent (managers are limited to their own branch).
        """
        user = request.user
        qs = CashCollection.objects.filter(status='COLLECTED')

        if user.role == 'COLLECTION_AGENT':
            qs = qs.filter(agent=user)
        else:
            agent_id = request.query_params.get('agent')
            if agent_id:
                qs = qs.filter(agent_id=agent_id)
            if user.role == 'BRANCH_MANAGER':
                qs = qs.filter(branch=user.branch)

        serializer = self.get_serializer(qs, many=True)
        total = sum(c.amount for c in qs) or Decimal('0.00')
        return Response({'collections': serializer.data, 'total': str(total)})


class AgentCashSubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = AgentCashSubmissionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = AgentCashSubmission.objects.select_related('agent', 'branch', 'verified_by').all()
        user = self.request.user

        if user.role == 'COLLECTION_AGENT':
            qs = qs.filter(agent=user)
        elif user.role == 'BRANCH_MANAGER':
            qs = qs.filter(branch=user.branch)

        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        return qs

    @action(detail=True, methods=['post'])
    def reconcile(self, request, pk=None):
        """Branch manager approves or rejects a submission."""
        submission = self.get_object()
        user = request.user

        # Admin can reconcile anything; branch managers only their own branch
        is_branch_manager = user.role == 'BRANCH_MANAGER' and submission.branch == user.branch
        if user.role != 'ADMIN' and not is_branch_manager:
            return Response(
                {'error': 'Only an admin or the branch manager of this branch can reconcile submissions.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if submission.status != 'PENDING':
            return Response(
                {'error': f'This submission has already been {submission.status.lower()}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ReconciliationActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        with transaction.atomic():
            submission = AgentCashSubmission.objects.select_for_update().get(pk=pk)

            submission.actual_amount = data['actual_amount']
            submission.calculate_difference()
            submission.verified_by = user
            submission.verified_at = timezone.now()
            submission.discrepancy_notes = data.get('discrepancy_notes', '')

            if data['action'] == 'approve':
                if submission.difference == 0:
                    submission.status = 'APPROVED'
                else:
                    submission.status = 'APPROVED_WITH_DISCREPANCY'

                # Update all collections to VERIFIED
                for mapping in submission.collection_mappings.all():
                    mapping.collection.status = 'VERIFIED'
                    mapping.collection.save()
            else:
                submission.status = 'REJECTED'
                # Rejected collections go back to COLLECTED status so agent can resubmit
                for mapping in submission.collection_mappings.all():
                    mapping.collection.status = 'COLLECTED'
                    mapping.collection.save()

            submission.save()

        response_serializer = AgentCashSubmissionSerializer(submission)
        return Response(response_serializer.data)
