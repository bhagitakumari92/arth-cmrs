from django.urls import path
from .views import DashboardSummaryView, DashboardRecentActivityView

urlpatterns = [
    path('summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('recent/', DashboardRecentActivityView.as_view(), name='dashboard-recent'),
]
