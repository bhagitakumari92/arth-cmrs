from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BankDepositViewSet

router = DefaultRouter()
router.register('', BankDepositViewSet, basename='deposit')

urlpatterns = [
    path('', include(router.urls)),
]
