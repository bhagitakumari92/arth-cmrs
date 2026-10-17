from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from accounts.permissions import IsAdminOrBranchManager, IsAdmin
from .models import Customer
from .serializers import CustomerSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    serializer_class = CustomerSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update'):
            return [IsAdminOrBranchManager()]
        if self.action == 'destroy':
            return [IsAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = Customer.objects.select_related('branch', 'created_by').all()
        user = self.request.user

        # Role-based filtering
        if user.role == 'COLLECTION_AGENT':
            qs = qs.filter(branch=user.branch)
        elif user.role == 'BRANCH_MANAGER':
            qs = qs.filter(branch=user.branch)
        # Admin sees all

        # Optional filters
        branch_id = self.request.query_params.get('branch')
        if branch_id and user.role == 'ADMIN':
            qs = qs.filter(branch_id=branch_id)

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(first_name__icontains=search) | qs.filter(last_name__icontains=search) | qs.filter(phone__icontains=search)

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        # Branch managers can only create customers in their own branch
        if user.role == 'BRANCH_MANAGER':
            serializer.save(branch=user.branch, created_by=user)
        else:
            serializer.save(created_by=user)

    def perform_update(self, serializer):
        user = self.request.user
        if user.role == 'BRANCH_MANAGER':
            serializer.save(branch=user.branch)
        else:
            serializer.save()

    def destroy(self, request, *args, **kwargs):
        customer = self.get_object()
        if customer.loans.exists():
            return Response(
                {'error': 'Cannot delete this customer — they have loans on record.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)
