import uuid
from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator
from accounts.models import Branch, User
from loans.models import Loan


class CashCollection(models.Model):
    class Status(models.TextChoices):
        COLLECTED = 'COLLECTED', 'Collected (with agent)'
        SUBMITTED = 'SUBMITTED', 'Submitted to Branch'
        VERIFIED = 'VERIFIED', 'Verified by Branch'
        DEPOSITED = 'DEPOSITED', 'Deposited in Bank'
        SETTLED = 'SETTLED', 'Settled'

    receipt_number = models.CharField(max_length=50, unique=True, editable=False)
    loan = models.ForeignKey(Loan, on_delete=models.PROTECT, related_name='collections')
    agent = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name='collections',
        limit_choices_to={'role': 'COLLECTION_AGENT'}
    )
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT, related_name='collections')
    amount = models.DecimalField(
        max_digits=12, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    collection_date = models.DateField()
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.COLLECTED)
    notes = models.TextField(blank=True)
    idempotency_key = models.CharField(max_length=100, unique=True, null=True, blank=True,
                                       help_text='Client-supplied key to prevent duplicate submissions')
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='collections_created'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Receipt {self.receipt_number} - ₹{self.amount}"

    def save(self, *args, **kwargs):
        if not self.receipt_number:
            self.receipt_number = f"RCP-{uuid.uuid4().hex[:10].upper()}"
        super().save(*args, **kwargs)


class AgentCashSubmission(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending Verification'
        APPROVED = 'APPROVED', 'Approved'
        APPROVED_WITH_DISCREPANCY = 'APPROVED_WITH_DISCREPANCY', 'Approved with Discrepancy'
        REJECTED = 'REJECTED', 'Rejected'

    agent = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name='cash_submissions',
        limit_choices_to={'role': 'COLLECTION_AGENT'}
    )
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT, related_name='cash_submissions')
    submission_date = models.DateField(auto_now_add=True)
    expected_amount = models.DecimalField(max_digits=12, decimal_places=2)
    actual_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    difference = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.PENDING)
    discrepancy_notes = models.TextField(blank=True)
    verified_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='verified_submissions'
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Submission #{self.id} - {self.agent.username} - ₹{self.expected_amount}"

    def calculate_difference(self):
        if self.actual_amount is not None:
            self.difference = self.actual_amount - self.expected_amount
        return self.difference


class SubmissionCollectionMapping(models.Model):
    """Maps which collections are included in which submission."""
    submission = models.ForeignKey(
        AgentCashSubmission, on_delete=models.CASCADE, related_name='collection_mappings'
    )
    collection = models.ForeignKey(
        CashCollection, on_delete=models.PROTECT, related_name='submission_mappings'
    )

    class Meta:
        unique_together = ['submission', 'collection']
        # A collection can only appear in one submission
        constraints = [
            models.UniqueConstraint(fields=['collection'], name='unique_collection_submission')
        ]

    def __str__(self):
        return f"Submission #{self.submission_id} -> Collection {self.collection.receipt_number}"
