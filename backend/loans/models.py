from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator
from accounts.models import Branch, User
from customers.models import Customer


class Loan(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        CLOSED = 'CLOSED', 'Closed'

    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='loans')
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT, related_name='loans')
    assigned_agent = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name='assigned_loans',
        limit_choices_to={'role': 'COLLECTION_AGENT'}
    )
    principal_amount = models.DecimalField(
        max_digits=12, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    outstanding_amount = models.DecimalField(
        max_digits=12, decimal_places=2,
        help_text='Remaining principal to be collected'
    )
    tenure_months = models.PositiveIntegerField(default=12)
    monthly_installment = models.DecimalField(
        max_digits=12, decimal_places=2,
        help_text='Fixed monthly installment amount'
    )
    disbursement_date = models.DateField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='loans_created'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Loan #{self.id} - {self.customer.full_name} - ₹{self.principal_amount}"

    def save(self, *args, **kwargs):
        if not self.pk:
            self.outstanding_amount = self.principal_amount
        super().save(*args, **kwargs)


class RepaymentSchedule(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PAID = 'PAID', 'Paid'
        PARTIALLY_PAID = 'PARTIALLY_PAID', 'Partially Paid'
        OVERDUE = 'OVERDUE', 'Overdue'

    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name='repayment_schedules')
    installment_number = models.PositiveIntegerField()
    due_date = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['loan', 'installment_number']
        unique_together = ['loan', 'installment_number']

    def __str__(self):
        return f"Loan #{self.loan_id} - EMI {self.installment_number} - ₹{self.amount}"
