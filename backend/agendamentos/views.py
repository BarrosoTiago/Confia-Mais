from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.core.mail import send_mail
from django.conf import settings
from datetime import datetime, timedelta
from django.db.models import Sum # <--- Necessário para somar despesas
from .models import Pagamento
from .serializers import PagamentoSerializer

# --- IMPORTS DE MODELOS E SERIALIZERS ---
from .models import Agendamento, HorarioFuncionamento, Avaliacao, Despesa
from .serializers import (
    AgendamentoSerializer, 
    HorarioSerializer, 
    AvaliacaoSerializer, 
    AvaliacaoPublicaSerializer, 
    DespesaSerializer # <--- Adicionado
)
from servicos.models import Servico

# --- CRUD DE DESPESAS (NOVO) 💸 ---
class DespesaViewSet(viewsets.ModelViewSet):
    serializer_class = DespesaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Cada empreendedor vê apenas suas próprias despesas
        return Despesa.objects.filter(usuario=self.request.user).order_by('-data')

    def perform_create(self, serializer):
        # Vincula a despesa ao usuário logado
        serializer.save(usuario=self.request.user)

# --- CRUD DE AGENDAMENTOS ---
class AgendamentoViewSet(viewsets.ModelViewSet):
    serializer_class = AgendamentoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Agendamento.objects.all()

        # 1. Visão do Empreendedor (ADMIN)
        if user.tipo_usuario == 'ADMIN':
            return queryset.filter(servicos__criado_por=user).distinct().order_by('-data_hora_inicio')
        
        # 2. Visão do Cliente
        queryset = queryset.filter(cliente=user)

        # Filtro extra: dashboard da loja específica
        empreendedor_id = self.request.query_params.get('empreendedor')
        if empreendedor_id:
            queryset = queryset.filter(servicos__criado_por_id=empreendedor_id)

        return queryset.distinct().order_by('-data_hora_inicio')

    def perform_create(self, serializer):
        user = self.request.user
        
        # Lógica de criação
        if user.tipo_usuario == 'ADMIN':
            cliente_id = self.request.data.get('cliente')
            agendamento = serializer.save(cliente_id=cliente_id if cliente_id else user.id)
        else:
            agendamento = serializer.save(cliente=user)

        # Força refresh para garantir integridade antes de notificar
        agendamento.refresh_from_db()
        try:
             self.enviar_emails(agendamento, user)
        except Exception as e:
             print(f"Erro no fluxo de notificação: {e}")

    def enviar_emails(self, agendamento, user):
        try:
            servicos = agendamento.servicos.all()
            if not servicos:
                return 

            primeiro_servico = servicos[0]
            email_empreendedor = None
            
            if primeiro_servico.criado_por:
                email_empreendedor = primeiro_servico.criado_por.email
            
            data_str = agendamento.data_hora_inicio.strftime('%d/%m às %H:%M')
            servicos_nomes = ", ".join([s.nome for s in servicos])
            
            # Email para o Empreendedor
            if email_empreendedor:
                send_mail(
                    subject=f"🔔 Novo Agendamento: {user.nome_completo or user.username}",
                    message=f"Cliente: {user.nome_completo}\nServiço(s): {servicos_nomes}\nData: {data_str}\n\nAcesse o painel para confirmar.",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email_empreendedor], 
                    fail_silently=True, 
                )

            # Email para o Cliente
            if user.email: 
                send_mail(
                    subject="⏳ Solicitação Recebida - Confia +",
                    message=f"Olá, {user.nome_completo or user.username}!\n\nRecebemos seu pedido para: {servicos_nomes}\nData: {data_str}.\n\nAguarde a confirmação do estabelecimento.",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email], 
                    fail_silently=True,
                )
        except Exception as e:
            print(f"❌ Erro ao enviar e-mail: {e}")

class HorarioViewSet(viewsets.ModelViewSet):
    serializer_class = HorarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return HorarioFuncionamento.objects.filter(usuario=self.request.user).order_by('dia_semana')

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

class HorarioDisponivelView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        servico_id = request.query_params.get('servico_id')
        data_str = request.query_params.get('data')

        if not servico_id or not data_str:
            return Response({"erro": "Parâmetros obrigatórios"}, status=400)

        try:
            servico = Servico.objects.get(id=servico_id)
            dono = servico.criado_por
            duracao = getattr(servico, 'duracao_minutos', 30)
        except Servico.DoesNotExist:
            return Response({"erro": "Serviço não encontrado"}, status=404)

        try:
            data_obj = datetime.strptime(data_str, '%Y-%m-%d').date()
            dia_semana = data_obj.weekday()
        except ValueError:
            return Response({"erro": "Data inválida"}, status=400)

        try:
            config = HorarioFuncionamento.objects.get(usuario=dono, dia_semana=dia_semana)
        except HorarioFuncionamento.DoesNotExist:
            return Response([]) 

        if not config.ativo:
            return Response([])

        slots = []
        inicio = datetime.combine(data_obj, config.horario_inicio)
        fim = datetime.combine(data_obj, config.horario_fim)
        
        almoco_ini = datetime.combine(data_obj, config.almoco_inicio) if config.almoco_inicio else None
        almoco_fim = datetime.combine(data_obj, config.almoco_fim) if config.almoco_fim else None

        atual = inicio
        delta = timedelta(minutes=duracao)

        ocupados = Agendamento.objects.filter(
            servicos__criado_por=dono,
            data_hora_inicio__date=data_obj,
            status__in=['PENDENTE', 'CONFIRMADO']
        ).values_list('data_hora_inicio', flat=True)
        
        lista_ocupados = [t.strftime('%H:%M') for t in ocupados]

        while atual + delta <= fim:
            hora_str = atual.strftime('%H:%M')
            slot_fim = atual + delta # Horário que o serviço terminaria
            
            # 1. Verifica se o período do serviço invade o almoço
            eh_almoco = False
            if almoco_ini and almoco_fim:
                # Se o início do serviço OU o fim dele estiverem dentro do intervalo de almoço
                if (atual >= almoco_ini and atual < almoco_fim) or (slot_fim > almoco_ini and slot_fim <= almoco_fim):
                    eh_almoco = True

            # 2. Verifica conflito com outros agendamentos (lógica mais precisa)
            conflito = Agendamento.objects.filter(
                servicos__criado_por=dono,
                data_hora_inicio__lt=slot_fim, # Começa antes do serviço atual terminar
                data_hora_fim__gt=atual,       # Termina depois do serviço atual começar
                status__in=['PENDENTE', 'CONFIRMADO']
            ).exists()

            if not eh_almoco and not conflito:
                slots.append(hora_str)

            # Pula para o próximo slot (ex: de 30 em 30 min)
            atual += delta
        
        return Response(slots)

# --- VIEW PARA SALVAR AVALIAÇÃO ⭐ ---
class AvaliarAgendamentoView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            agendamento = Agendamento.objects.get(pk=pk, cliente=request.user)
            
            if agendamento.status != 'CONCLUIDO':
                return Response({"erro": "Você só pode avaliar serviços concluídos."}, status=400)
            
            if hasattr(agendamento, 'avaliacao'):
                return Response({"erro": "Este serviço já foi avaliado."}, status=400)

            serializer = AvaliacaoSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(agendamento=agendamento)
                return Response(serializer.data, status=201)
            
            return Response(serializer.errors, status=400)

        except Agendamento.DoesNotExist:
            return Response({"erro": "Agendamento não encontrado."}, status=404)

# --- VIEW PARA LISTAR COMENTÁRIOS DA LOJA (Público) 💬 ---
class AvaliacoesLojaView(APIView):
    permission_classes = [permissions.AllowAny] 

    def get(self, request, empreendedor_id):
        try:
            avaliacoes = Avaliacao.objects.filter(
                agendamento__servicos__criado_por_id=empreendedor_id
            ).distinct().order_by('-criado_em')

            serializer = AvaliacaoPublicaSerializer(avaliacoes, many=True)
            return Response(serializer.data)
        except Exception:
            return Response([], status=200)

# --- DASHBOARD FINANCEIRO COMPLETO 💰 ---
class FinanceiroDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # 1. Receita: Soma dos serviços agendados (Confirmados ou Concluídos)
        agendamentos = Agendamento.objects.filter(
            servicos__criado_por=user,
            status__in=['CONFIRMADO', 'CONCLUIDO']
        ).distinct()

        total_receita = 0
        for ag in agendamentos:
            for servico in ag.servicos.all():
                total_receita += servico.preco

        # 2. Despesas: Soma de todas as despesas lançadas
        total_despesas = Despesa.objects.filter(usuario=user).aggregate(Sum('valor'))['valor__sum'] or 0

        # 3. Lucro Líquido
        lucro = total_receita - total_despesas

        return Response({
            "receita": total_receita,
            "despesas": total_despesas,
            "saldo": lucro,
            "lucro": lucro
        })

class PagamentoViewSet(viewsets.ModelViewSet):
    serializer_class = PagamentoSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Pagamento.objects.all()

    def perform_create(self, serializer):
        # Salva o pagamento
        pagamento = serializer.save()
        
        # LÓGICA AUTOMÁTICA: 
        # Se o cliente pagou tudo, muda o status do agendamento para CONCLUIDO
        agendamento = pagamento.agendamento
        total_servico = sum([s.preco for s in agendamento.servicos.all()])
        total_pago = sum([p.valor for p in agendamento.pagamentos.all()])

        if total_pago >= total_servico:
            agendamento.status = 'CONCLUIDO'
            agendamento.save()