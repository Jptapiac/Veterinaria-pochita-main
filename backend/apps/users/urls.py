from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    UserRegistrationView,
    UserProfileView,
    UserDetailView,
    ChangePasswordView,
    LogoutView,
    UserListView,
    VeterinariansPublicListView
)

app_name = 'users'

urlpatterns = [
    # Autenticación JWT
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    
    # Gestión de usuarios
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('me/', UserDetailView.as_view(), name='user_detail'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('list/', UserListView.as_view(), name='user_list'),
    path('veterinarians/', VeterinariansPublicListView.as_view(), name='veterinarians_public_list'),
]

