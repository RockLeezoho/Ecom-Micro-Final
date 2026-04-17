from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # connect to users app API urls
    path('api/users/', include('apps.users.api.urls')),
]