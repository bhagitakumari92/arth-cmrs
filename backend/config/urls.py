from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/accounts/', include('accounts.urls')),
    path('api/customers/', include('customers.urls')),
    path('api/loans/', include('loans.urls')),
    path('api/collections/', include('collections_app.urls')),
    path('api/reconciliation/', include('reconciliation.urls')),
    path('api/deposits/', include('deposits.urls')),
    path('api/dashboard/', include('dashboard.urls')),
]
