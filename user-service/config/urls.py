from django.contrib import admin
from django.urls import path, include
from apps.users.api.health import HealthCheckAPIView

urlpatterns = [
    path('admin/', admin.site.urls),
    # top-level health check for compose healthcheck
    path('health/', HealthCheckAPIView.as_view()),
    # connect to users app API urls
    path('api/users/', include('apps.users.api.urls')),
    # management app (admin-only REST endpoints)
    path('api/management/', include('apps.management.urls')),
]