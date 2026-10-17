from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReconciliationViewSet

router = DefaultRouter()
router.register('', ReconciliationViewSet, basename='reconciliation')

urlpatterns = [
    path('', include(router.urls)),
]
