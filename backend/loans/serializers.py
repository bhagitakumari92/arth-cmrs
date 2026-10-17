from rest_framework import serializers
from .models import Loan, RepaymentSchedule


class RepaymentScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = RepaymentSchedule
        fields = ['id', 'loan', 'installment_number', 'due_date', 'amount',
                  'paid_amount', 'status', 'created_at']
        read_only_fields = ['id', 'created_at']


class LoanSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    agent_name = serializers.CharField(source='assigned_agent.get_full_name', read_only=True)
    repayment_schedules = RepaymentScheduleSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Loan
        fields = ['id', 'customer', 'customer_name', 'branch', 'branch_name',
                  'assigned_agent', 'agent_name', 'principal_amount', 'outstanding_amount',
                  'tenure_months', 'monthly_installment', 'disbursement_date',
                  'status', 'status_display', 'repayment_schedules', 'created_at', 'updated_at']
        read_only_fields = ['id', 'outstanding_amount', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        loan = Loan(**validated_data)
        loan.outstanding_amount = loan.principal_amount
        loan.save()

        # Auto-generate repayment schedule
        from datetime import timedelta
        from dateutil.relativedelta import relativedelta
        schedules = []
        for i in range(1, loan.tenure_months + 1):
            due_date = loan.disbursement_date + relativedelta(months=i)
            schedules.append(RepaymentSchedule(
                loan=loan,
                installment_number=i,
                due_date=due_date,
                amount=loan.monthly_installment,
            ))
        RepaymentSchedule.objects.bulk_create(schedules)
        return loan


class LoanListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list views without nested schedules."""
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    agent_name = serializers.CharField(source='assigned_agent.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    has_collections = serializers.SerializerMethodField()

    class Meta:
        model = Loan
        fields = ['id', 'customer', 'customer_name', 'branch', 'branch_name',
                  'assigned_agent', 'agent_name', 'principal_amount', 'outstanding_amount',
                  'tenure_months', 'monthly_installment', 'disbursement_date',
                  'status', 'status_display', 'has_collections', 'created_at']

    def get_has_collections(self, obj):
        return obj.collections.exists()


class LoanUpdateSerializer(serializers.ModelSerializer):
    """Update loan terms. Principal can only change while no collections exist."""

    class Meta:
        model = Loan
        fields = ['customer', 'branch', 'assigned_agent', 'principal_amount',
                  'tenure_months', 'monthly_installment', 'disbursement_date', 'status']

    def validate_principal_amount(self, value):
        if self.instance.collections.exists() and value != self.instance.principal_amount:
            raise serializers.ValidationError(
                "Cannot change the principal amount after collections have been recorded."
            )
        return value

    def validate(self, data):
        user = self.context['request'].user
        branch = data.get('branch', self.instance.branch)
        if user.role == 'BRANCH_MANAGER' and branch != user.branch:
            raise serializers.ValidationError("You can only manage loans in your own branch.")
        return data

    def update(self, instance, validated_data):
        old_principal = instance.principal_amount
        instance = super().update(instance, validated_data)
        # Principal changed (only possible with zero collections) — reset outstanding
        if instance.principal_amount != old_principal:
            instance.outstanding_amount = instance.principal_amount
            instance.save(update_fields=['outstanding_amount', 'updated_at'])
        return instance
