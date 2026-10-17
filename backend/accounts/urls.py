from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, BranchViewSet

router = DefaultRouter()
router.register('users', UserViewSet, basename='user')
router.register('branches', BranchViewSet, basename='branch')

urlpatterns = [
    path('', include(router.urls)),
]
