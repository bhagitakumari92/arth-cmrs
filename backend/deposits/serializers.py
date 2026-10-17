from django.db import transaction
from rest_framework import serializers
from .models import BankDeposit
from collections_app.models import AgentCashSubmission


class BankDepositSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    submission_details = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True, default=None)
    settled_by_name = serializers.CharField(source='settled_by.get_full_name', read_only=True, default=None)

    class Meta:
        model = BankDeposit
        fields = ['id', 'bank_name', 'deposit_date', 'amount', 'bank_reference',
                  'branch', 'branch_name', 'submission', 'submission_details',
                  'status', 'status_display', 'settled_amount', 'settlement_mismatch',
                  'settled_at', 'settled_by', 'settled_by_name', 'notes',
                  'created_by', 'created_by_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'branch', 'created_by', 'settled_at', 'settled_by',
                           'settlement_mismatch', 'created_at', 'updated_at']

    def get_submission_details(self, obj):
        sub = obj.submission
        return {
            'id': sub.id,
            'agent_name': sub.agent.get_full_name() or sub.agent.username,
            'expected_amount': str(sub.expected_amount),
            'actual_amount': str(sub.actual_amount) if sub.actual_amount else None,
            'difference': str(sub.difference) if sub.difference else None,
        }

    def validate_submission(self, value):
        if value.status not in ('APPROVED', 'APPROVED_WITH_DISCREPANCY'):
            raise serializers.ValidationError(
                "Only approved submissions can be deposited. "
                f"This submission is {value.get_status_display()}."
            )
        if hasattr(value, 'bank_deposit'):
            raise serializers.ValidationError(
                "This submission has already been deposited. "
                "Duplicate deposits are not allowed."
            )
        return value

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['branch'] = user.branch if user.branch else validated_data['submission'].branch
        validated_data['created_by'] = user

        with transaction.atomic():
            deposit = BankDeposit(**validated_data)
            deposit.save()

            # Update collection statuses to DEPOSITED
            for mapping in deposit.submission.collection_mappings.all():
                mapping.collection.status = 'DEPOSITED'
                mapping.collection.save()

        return deposit


class SettlementSerializer(serializers.Serializer):
    settled_amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=True)
    status = serializers.ChoiceField(choices=['SETTLED', 'FAILED', 'DELAYED'], required=True)
    notes = serializers.CharField(required=False, allow_blank=True)
