from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator
from accounts.models import Branch, User
from collections_app.models import AgentCashSubmission


class BankDeposit(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        SETTLED = 'SETTLED', 'Settled'
        FAILED = 'FAILED', 'Failed'
        DELAYED = 'DELAYED', 'Delayed'

    bank_name = models.CharField(max_length=200)
    deposit_date = models.DateField()
    amount = models.DecimalField(
        max_digits=12, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    bank_reference = models.CharField(max_length=100, unique=True)
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT, related_name='deposits')
    submission = models.OneToOneField(
        AgentCashSubmission, on_delete=models.PROTECT,
        related_name='bank_deposit',
        limit_choices_to={'status__in': ['APPROVED', 'APPROVED_WITH_DISCREPANCY']}
    )
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    settled_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    settlement_mismatch = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    settled_at = models.DateTimeField(null=True, blank=True)
    settled_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='settled_deposits'
    )
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='deposits_created'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Deposit {self.bank_reference} - ₹{self.amount} ({self.status})"

    def calculate_settlement_mismatch(self):
        if self.settled_amount is not None:
            self.settlement_mismatch = self.settled_amount - self.amount
        return self.settlement_mismatch
