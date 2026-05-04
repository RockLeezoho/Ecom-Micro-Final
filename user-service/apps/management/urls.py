from django.urls import path, include

urlpatterns = [
    path('', include('apps.management.api.urls')),
]
