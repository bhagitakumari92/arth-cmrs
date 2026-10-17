from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CashCollectionViewSet, AgentCashSubmissionViewSet

router = DefaultRouter()
router.register('submissions', AgentCashSubmissionViewSet, basename='submission')
router.register('', CashCollectionViewSet, basename='collection')

urlpatterns = [
    path('', include(router.urls)),
]
