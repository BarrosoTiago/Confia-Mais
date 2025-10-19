from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TarefaViewSet

router = DefaultRouter()
router.register(r'tarefas', TarefaViewSet) # Cria as rotas para 'tarefas'

urlpatterns = [
    path('', include(router.urls)),
]