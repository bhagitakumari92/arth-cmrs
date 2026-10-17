from django.contrib import admin
from .models import Loan, RepaymentSchedule

admin.site.register(Loan)
admin.site.register(RepaymentSchedule)
