import threading  # <-- Novo import para o disparo assíncrono
from rest_framework import viewsets, permissions, status, views, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum, Q, Count
from django.utils import timezone
from datetime import datetime, timedelta
from django.core.mail import send_mail
from django.conf import settings

import time

# --- 1. IMPORT DOS MODELOS ---
from .models import (
    Agendamento, HorarioFuncionamento, Avaliacao, Anotacao
)
from servicos.models import Servico, Categoria

# --- 2. IMPORT DOS SERIALIZERS ---
from .serializers import (
    AgendamentoSerializer, 
    AnotacaoSerializer,
    AvaliacaoSerializer,
    AvaliacaoPublicaSerializer,
    HorarioSerializer 
)

# --- 3. VIEWSETS PRINCIPAIS ---

class AgendamentoViewSet(viewsets.ModelViewSet):
    """
    Gerencia os agendamentos de forma otimizada.
    """
    serializer_class = AgendamentoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Agendamento.objects.all()
        
        if user.tipo_usuario == 'ADMIN':
            # ADMIN vê: Agendamentos dos seus serviços OU agendamentos que ele mesmo registrou
            return queryset.filter(
                Q(servicos__criado_por=user) | Q(cliente=user)
            ).distinct().order_by('-data_hora_inicio')
            
        # CLIENTE vê apenas os próprios agendamentos
        return queryset.filter(cliente=user).distinct().order_by('-data_hora_inicio')

    def perform_create(self, serializer):
        print("\n⏱️ ====== INÍCIO DO PROCESSO DE AGENDAMENTO ======")
        t_inicio = time.time()
        
        user = self.request.user
        if user.tipo_usuario == 'ADMIN':
            cliente_id = self.request.data.get('cliente')
            print(f"⏱️ [Marcar 1] Tipo ADMIN. Tempo decorrido: {time.time() - t_inicio:.4f}s")
            # Se o admin não selecionou cliente, salva para ele mesmo
            agendamento = serializer.save(cliente_id=cliente_id if cliente_id else user.id)
        else:
            print(f"⏱️ [Marcar 1] Tipo CLIENTE. Tempo decorrido: {time.time() - t_inicio:.4f}s")
            agendamento = serializer.save(cliente=user)

        print(f"⏱️ [Marcar 2] Banco de dados salvou o agendamento. Tempo decorrido: {time.time() - t_inicio:.4f}s")

        # Dispara o e-mail em uma thread separada (Não bloqueia o cliente/admin)
        try:
            email_thread = threading.Thread(
                target=self.enviar_emails_background, 
                args=(agendamento.id, user.nome_completo or user.username)
            )
            email_thread.start()
            print(f"⏱️ [Marcar 3] Thread de e-mail disparada. Tempo decorrido: {time.time() - t_inicio:.4f}s")
        except Exception as e:
            print(f"❌ Erro ao iniciar thread de e-mail: {e}")

        print("⏱️ ====== FIM DO PERFORME_CREATE ======\n")

    def enviar_emails_background(self, agendamento_id, usuario_nome):
        """
        Executa a busca dos dados e a comunicação com o SMTP em segundo plano.
        """
        try:
            agendamento = Agendamento.objects.get(id=agendamento_id)
            servicos = agendamento.servicos.all()
            if not servicos: 
                return 
                
            # Verifica se o criador do serviço existe antes de buscar o e-mail
            primeiro_servico = servicos[0]
            if primeiro_servico.criado_por and primeiro_servico.criado_por.email:
                email_empreendedor = primeiro_servico.criado_por.email
                data_str = agendamento.data_hora_inicio.strftime('%d/%m às %H:%M')
                servicos_nomes = ", ".join([s.nome for s in servicos])
                
                send_mail(
                    subject=f"🔔 Novo Agendamento: {usuario_nome}",
                    message=f"Cliente: {usuario_nome}\nServiços: {servicos_nomes}\nData: {data_str}",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email_empreendedor], 
                    fail_silently=True, 
                )
        except Exception as e:
            print(f"Erro ao enviar e-mail em background: {e}")

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

        # Otimização de queries acopladas usando filtros diretos na base de dados
        agendamentos_conflitantes = Agendamento.objects.filter(
            servicos__criado_por=dono,
            status__in=['PENDENTE', 'CONFIRMADO']
        )

        while atual + timedelta(minutes=duracao_minutos) <= fim_dia:
            slot_fim = atual + timedelta(minutes=duracao_minutos)
            eh_almoco = False
            if almoco_ini and almoco_fim:
                if atual < almoco_fim and slot_fim > almoco_ini:
                    eh_almoco = True
            
            conflito = agendamentos_conflitantes.filter(
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