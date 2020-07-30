from django.urls import path, include
from rest_framework.routers import DefaultRouter

from api.views import MemoViewSet

app_name = 'api'

router = DefaultRouter()
router.register(r'memo', MemoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
