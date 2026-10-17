from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LoanViewSet, RepaymentScheduleViewSet

router = DefaultRouter()
router.register('schedules', RepaymentScheduleViewSet, basename='schedule')
router.register('', LoanViewSet, basename='loan')

urlpatterns = [
    path('', include(router.urls)),
]
