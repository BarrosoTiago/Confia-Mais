from django.urls import path
from .views import UserRegistrationView, CustomTokenObtainPairView, LogoutView
from rest_framework_simplejwt.views import TokenRefreshView


urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    
    # URL de Login (usa nossa view customizada)
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    
    # URL de Logout (usa nossa view customizada)
    path('logout/', LogoutView.as_view(), name='user-logout'),
    
    # URL de Refresh (usa a view padrão do simplejwt)
    # Esta view lerá automaticamente o cookie 'refresh_token'
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]