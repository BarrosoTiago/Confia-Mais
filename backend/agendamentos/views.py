from rest_framework import viewsets, permissions, status, views, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum, Q, Count
from django.utils import timezone
from datetime import datetime, timedelta
from django.core.mail import send_mail
from django.conf import settings

# --- 1. IMPORT DOS MODELOS ---
# Removidos Pagamento e Despesa, que agora moram no app 'financeiro'
from .models import (
    Agendamento, HorarioFuncionamento, Avaliacao, Anotacao
)
from servicos.models import Servico, Categoria

# --- 2. IMPORT DOS SERIALIZERS ---
# AgendamentoSerializer e HorarioConfigSerializer vêm da pasta API ou local
from .serializers import (
    AgendamentoSerializer, # Agora importado localmente
    AnotacaoSerializer,
    AvaliacaoSerializer,
    AvaliacaoPublicaSerializer,
    HorarioSerializer # Substituindo o HorarioConfigSerializer se necessário
)

# --- 3. VIEWSETS PRINCIPAIS ---

class AgendamentoViewSet(viewsets.ModelViewSet):
    """
    Gerencia os agendamentos. A lógica financeira agora é calculada 
    dinamicamente pelo Serializer consultando o app Financeiro.
    """
    serializer_class = AgendamentoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Agendamento.objects.all()
        if user.tipo_usuario == 'ADMIN':
            return queryset.filter(servicos__criado_por=user).distinct().order_by('-data_hora_inicio')
        return queryset.filter(cliente=user).distinct().order_by('-data_hora_inicio')

    def perform_create(self, serializer):
        user = self.request.user
        if user.tipo_usuario == 'ADMIN':
            cliente_id = self.request.data.get('cliente')
            agendamento = serializer.save(cliente_id=cliente_id if cliente_id else user.id)
        else:
            agendamento = serializer.save(cliente=user)

        try:
             self.enviar_emails(agendamento, user)
        except Exception as e:
             print(f"Erro ao enviar e-mail: {e}")

    def enviar_emails(self, agendamento, user):
        servicos = agendamento.servicos.all()
        if not servicos: return 
        email_empreendedor = servicos[0].criado_por.email
        data_str = agendamento.data_hora_inicio.strftime('%d/%m às %H:%M')
        servicos_nomes = ", ".join([s.nome for s in servicos])
        
        if email_empreendedor:
            send_mail(
                subject=f"🔔 Novo Agendamento: {user.nome_completo or user.username}",
                message=f"Cliente: {user.nome_completo}\nServiços: {servicos_nomes}\nData: {data_str}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email_empreendedor], 
                fail_silently=True, 
            )

class HorarioViewSet(viewsets.ModelViewSet):
    serializer_class = HorarioSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return HorarioFuncionamento.objects.filter(usuario=self.request.user)
    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

class AnotacaoViewSet(viewsets.ModelViewSet):
    serializer_class = AnotacaoSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return Anotacao.objects.all().order_by('-data_criacao')

# --- 4. VIEWS DE UTILIDADE E DISPONIBILIDADE ---

class HorarioDisponivelView(APIView):
    """
    Lógica de geração de slots de horários vagos.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        data_str = request.query_params.get('data') 
        empreendedor_id = request.query_params.get('empreendedor_id')
        servico_id = request.query_params.get('servico_id') 
        
        if not data_str:
            return Response({"error": "Data é obrigatória"}, status=400)

        duracao_minutos = 30
        dono = None
        try:
            if servico_id:
                servico = Servico.objects.get(id=servico_id)
                dono = servico.criado_por
                duracao_minutos = servico.duracao_minutos
            elif empreendedor_id:
                from django.contrib.auth import get_user_model
                dono = get_user_model().objects.get(id=empreendedor_id)
        except:
            return Response({"error": "Não encontrado"}, status=404)

        try:
            data_obj = datetime.strptime(data_str, '%Y-%m-%d').date()
            config = HorarioFuncionamento.objects.get(usuario=dono, dia_semana=data_obj.weekday(), ativo=True)
        except:
            return Response([])

        slots = []
        atual = datetime.combine(data_obj, config.horario_inicio)
        fim_dia = datetime.combine(data_obj, config.horario_fim)
        
        almoco_ini = datetime.combine(data_obj, config.almoco_inicio) if config.almoco_inicio else None
        almoco_fim = datetime.combine(data_obj, config.almoco_fim) if config.almoco_fim else None

        while atual + timedelta(minutes=duracao_minutos) <= fim_dia:
            slot_fim = atual + timedelta(minutes=duracao_minutos)
            eh_almoco = False
            if almoco_ini and almoco_fim:
                if atual < almoco_fim and slot_fim > almoco_ini:
                    eh_almoco = True
            
            conflito = Agendamento.objects.filter(
                servicos__criado_por=dono,
                status__in=['PENDENTE', 'CONFIRMADO'],
                data_hora_inicio__lt=slot_fim,
                data_hora_fim__gt=atual
            ).exists()

            if not eh_almoco and not conflito:
                slots.append(atual.strftime('%H:%M'))
            
            atual += timedelta(minutes=30)

        return Response(slots)

class AvaliarAgendamentoView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request, pk):
        try:
            agendamento = Agendamento.objects.get(pk=pk, cliente=request.user)
            serializer = AvaliacaoSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(agendamento=agendamento)
                return Response(serializer.data, status=201)
            return Response(serializer.errors, status=400)
        except:
            return Response({"error": "Não encontrado"}, status=404)

class AvaliacoesLojaView(generics.ListAPIView):
    serializer_class = AvaliacaoPublicaSerializer
    permission_classes = [permissions.AllowAny]
    def get_queryset(self):
        emp_id = self.kwargs['empreendedor_id']
        return Avaliacao.objects.filter(agendamento__servicos__criado_por_id=emp_id)