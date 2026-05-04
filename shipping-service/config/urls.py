from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/shipping/', include('apps.shipping.api.urls')),
]
