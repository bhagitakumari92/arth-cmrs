from django.contrib import admin
from .models import CashCollection, AgentCashSubmission, SubmissionCollectionMapping

admin.site.register(CashCollection)
admin.site.register(AgentCashSubmission)
admin.site.register(SubmissionCollectionMapping)
