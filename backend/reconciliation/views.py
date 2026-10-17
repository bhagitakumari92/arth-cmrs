from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from collections_app.models import AgentCashSubmission
from collections_app.serializers import AgentCashSubmissionSerializer


class ReconciliationViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only view of all submissions for reconciliation purposes."""
    serializer_class = AgentCashSubmissionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = AgentCashSubmission.objects.select_related(
            'agent', 'branch', 'verified_by'
        ).prefetch_related('collection_mappings', 'collection_mappings__collection').all()
        user = self.request.user

        if user.role == 'COLLECTION_AGENT':
            qs = qs.filter(agent=user)
        elif user.role == 'BRANCH_MANAGER':
            qs = qs.filter(branch=user.branch)

        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        return qs
