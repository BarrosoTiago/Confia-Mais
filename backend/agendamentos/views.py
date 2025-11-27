from rest_framework import viewsets, permissions
from rest_framework.views import APIView # <--- Faltava isso
from rest_framework.response import Response # <--- Faltava isso
from .models import Agendamento, HorarioFuncionamento
from .serializers import AgendamentoSerializer, HorarioSerializer
from servicos.models import Servico # <--- Faltava isso

class AgendamentoViewSet(viewsets.ModelViewSet):
    serializer_class = AgendamentoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.tipo_usuario == 'ADMIN':
            return Agendamento.objects.all()
        return Agendamento.objects.filter(cliente=user)

    def perform_create(self, serializer):
        user = self.request.user
        # Se for ADMIN criando para um cliente específico
        if user.tipo_usuario == 'ADMIN':
            cliente_id = self.request.data.get('cliente')
            if cliente_id:
                serializer.save(cliente_id=cliente_id)
            else:
                serializer.save(cliente=user)
        # Se for CLIENTE criando
        else:
            serializer.save(cliente=user)

class HorarioViewSet(viewsets.ModelViewSet):
    serializer_class = HorarioSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        # Retorna apenas os horários do usuário logado
        return HorarioFuncionamento.objects.filter(usuario=self.request.user).order_by('dia_semana')

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

class HorarioDisponivelView(APIView):
    """
    Retorna os horários de funcionamento do dono de um serviço específico.
    GET /api/horarios/disponiveis/?servico_id=1
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        servico_id = request.query_params.get('servico_id')
        if not servico_id:
            return Response({"erro": "ID do serviço não fornecido"}, status=400)

        try:
            # 1. Acha o serviço
            servico = Servico.objects.get(id=servico_id)
            dono = servico.criado_por
            
            if not dono:
                return Response([]) # Serviço sem dono (legado)

            # 2. Pega os horários desse dono
            horarios = HorarioFuncionamento.objects.filter(usuario=dono).order_by('dia_semana')
            
            # 3. Serializa e devolve
            serializer = HorarioSerializer(horarios, many=True)
            return Response(serializer.data)

        except Servico.DoesNotExist:
            return Response({"erro": "Serviço não encontrado"}, status=404)