from decimal import Decimal
from django.db import transaction
from rest_framework import serializers
from .models import CashCollection, AgentCashSubmission, SubmissionCollectionMapping


class CashCollectionSerializer(serializers.ModelSerializer):
    loan_details = serializers.SerializerMethodField()
    agent_name = serializers.CharField(source='agent.get_full_name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = CashCollection
        fields = ['id', 'receipt_number', 'loan', 'loan_details', 'agent', 'agent_name',
                  'branch', 'branch_name', 'amount', 'collection_date', 'status',
                  'status_display', 'notes', 'idempotency_key', 'created_at']
        read_only_fields = ['id', 'receipt_number', 'agent', 'branch', 'created_at']

    def get_loan_details(self, obj):
        return {
            'id': obj.loan.id,
            'customer_name': obj.loan.customer.full_name,
            'principal_amount': str(obj.loan.principal_amount),
            'outstanding_amount': str(obj.loan.outstanding_amount),
        }

    def validate_amount(self, value):
        if value <= Decimal('0'):
            raise serializers.ValidationError("Collection amount must be positive.")
        return value

    def validate(self, data):
        loan = data.get('loan')
        user = self.context['request'].user

        # Agent can only collect against their assigned loans
        if user.role == 'COLLECTION_AGENT' and loan.assigned_agent != user:
            raise serializers.ValidationError("You can only collect against loans assigned to you.")

        # Overpayment policy: reject collections exceeding outstanding
        if data.get('amount') and loan.outstanding_amount and data['amount'] > loan.outstanding_amount:
            raise serializers.ValidationError(
                f"Collection amount (₹{data['amount']}) exceeds outstanding balance (₹{loan.outstanding_amount}). "
                "Overpayment is not allowed per system policy."
            )

        return data

    def create(self, validated_data):
        user = self.context['request'].user
        loan = validated_data['loan']

        # Agents record for themselves; admin/manager record on behalf of the loan's assigned agent
        if user.role == 'COLLECTION_AGENT':
            validated_data['agent'] = user
        else:
            validated_data['agent'] = loan.assigned_agent
        validated_data['branch'] = loan.branch
        validated_data['created_by'] = user

        collection = CashCollection(**validated_data)
        collection.save()

        # Update loan outstanding — this is the ONLY place loan balance is reduced
        loan.outstanding_amount -= collection.amount
        if loan.outstanding_amount <= 0:
            loan.outstanding_amount = Decimal('0.00')
            loan.status = 'CLOSED'
        loan.save()

        return collection


class SubmissionCollectionMappingSerializer(serializers.ModelSerializer):
    collection_receipt = serializers.CharField(source='collection.receipt_number', read_only=True)
    collection_amount = serializers.DecimalField(source='collection.amount', max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = SubmissionCollectionMapping
        fields = ['id', 'submission', 'collection', 'collection_receipt', 'collection_amount']


class AgentCashSubmissionSerializer(serializers.ModelSerializer):
    agent_name = serializers.CharField(source='agent.get_full_name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.get_full_name', read_only=True, default=None)
    collection_mappings = SubmissionCollectionMappingSerializer(many=True, read_only=True)
    collection_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False
    )

    class Meta:
        model = AgentCashSubmission
        fields = ['id', 'agent', 'agent_name', 'branch', 'branch_name',
                  'submission_date', 'expected_amount', 'actual_amount', 'difference',
                  'status', 'status_display', 'discrepancy_notes',
                  'verified_by', 'verified_by_name', 'verified_at',
                  'collection_mappings', 'collection_ids', 'created_at', 'updated_at']
        read_only_fields = ['id', 'agent', 'branch', 'expected_amount', 'submission_date',
                           'created_at', 'updated_at']

    def create(self, validated_data):
        collection_ids = validated_data.pop('collection_ids', [])
        user = self.context['request'].user

        with transaction.atomic():
            # Lock the collections to prevent concurrent submission
            collections_qs = CashCollection.objects.select_for_update().filter(
                id__in=collection_ids,
                status='COLLECTED'
            )
            if user.role == 'COLLECTION_AGENT':
                collections_qs = collections_qs.filter(agent=user)

            collections = list(collections_qs)

            if not collections:
                raise serializers.ValidationError("No eligible collections found. Collections must be in COLLECTED status.")

            # Verify all requested collections were found
            found_ids = {c.id for c in collections}
            requested_ids = set(collection_ids)
            if found_ids != requested_ids:
                missing = requested_ids - found_ids
                raise serializers.ValidationError(
                    f"Some collections are not eligible for submission: {sorted(missing)}"
                )

            if user.role == 'COLLECTION_AGENT':
                agent = user
            else:
                # Admin/manager submitting on behalf — all collections must be one agent's
                agent_ids = {c.agent_id for c in collections}
                if len(agent_ids) != 1:
                    raise serializers.ValidationError(
                        "A submission must contain collections from a single agent."
                    )
                agent = collections[0].agent

            expected_amount = sum(c.amount for c in collections)

            validated_data['agent'] = agent
            validated_data['branch'] = agent.branch
            validated_data['expected_amount'] = expected_amount

            submission = AgentCashSubmission(**validated_data)
            submission.save()

            # Create mappings and update collection statuses
            mappings = []
            for collection in collections:
                mappings.append(SubmissionCollectionMapping(
                    submission=submission, collection=collection
                ))
                collection.status = 'SUBMITTED'
                collection.save()

            SubmissionCollectionMapping.objects.bulk_create(mappings)

        return submission


class ReconciliationActionSerializer(serializers.Serializer):
    """Serializer for approve/reject actions."""
    actual_amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=True)
    discrepancy_notes = serializers.CharField(required=False, allow_blank=True)
    action = serializers.ChoiceField(choices=['approve', 'reject'], required=True)

    def validate(self, data):
        if data['action'] == 'reject' and not data.get('discrepancy_notes'):
            raise serializers.ValidationError("Discrepancy notes are required when rejecting a submission.")
        return data
