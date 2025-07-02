from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from api import views
from django.conf import settings
from django.conf.urls.static import static 

router = DefaultRouter()
router.register(r'words', views.WordViewSet, basename='word')
router.register(r'badges', views.BadgeViewSet, basename='badge')
router.register(r'user-stats', views.UserStatsViewSet, basename='user-stats')
router.register(r'users', views.AdminUserViewSet, basename='user')


urlpatterns = [
    path("token/", views.MyTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("register/", views.RegisterView.as_view(), name="auth_register"),
    path("logout/", views.LogoutView.as_view(), name="auth_logout"),
    path("admin/dashboard-data/", views.AdminDashboardDataAPIView.as_view(), name="admin_dashboard_data"),
    path("user/is-staff/", views.UserIsStaffAPIView.as_view(), name="user_is_staff"),
    path("test/", views.testEndPoint, name="test_endpoint"),
    path("verify-email/<uuid:token>/", views.VerifyEmailView.as_view(), name="verify_email"),
    path("", views.getRoutes),
    path('', include(router.urls)),
]


urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
