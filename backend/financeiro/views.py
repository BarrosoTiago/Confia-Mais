from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum
from django.utils import timezone
from .models import Transacao, Pagamento, Despesa, CalculadoraPrecificacao
from agendamentos.models import Agendamento 
from .serializers import (
    TransacaoSerializer, 
    PagamentoSerializer, 
    DespesaSerializer, 
    CalculadoraSerializer
)

class FinanceiroDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        # Usamos o timezone consciente para evitar problemas de fuso horário no dashboard
        agora = timezone.now()
        hoje = agora.date()
        inicio_mes = agora.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # 1. Busca todos os IDs de agendamento que pertencem ao profissional logado
        ag_ids = Agendamento.objects.filter(servicos__criado_por=user).values_list('id', flat=True).distinct()

        # 2. CÁLCULOS DE RECEITA REAL (Dinheiro que já entrou via Pagamentos)
        pagamentos_base = Pagamento.objects.filter(transacao__agendamento_id__in=ag_ids)
        
        receita_total = pagamentos_base.aggregate(total=Sum('valor'))['total'] or 0
        receita_hoje = pagamentos_base.filter(data_pagamento__date=hoje).aggregate(total=Sum('valor'))['total'] or 0
        
        # CORREÇÃO: Filtro robusto para Entradas do Mês
        receita_mes = pagamentos_base.filter(
            data_pagamento__gte=inicio_mes
        ).aggregate(total=Sum('valor'))['total'] or 0

        # 3. VALOR PREVISTO / A RECEBER
        # REGRA DE NEGÓCIO: Só conta como valor previsto se o status for 'CONFIRMADO'.
        # Pedidos 'PENDENTES' não entram na soma de previsão financeira.
        total_confirmado = Agendamento.objects.filter(
            id__in=ag_ids, 
            status='CONFIRMADO'
        ).aggregate(total=Sum('servicos__preco'))['total'] or 0

        # 4. DESPESAS TOTAIS
        despesas_total = Despesa.objects.filter(usuario=user).aggregate(total=Sum('valor'))['total'] or 0

        return Response({
            "receita_hoje": float(receita_hoje),
            "receita_mes": float(receita_mes),
            "receita_total": float(receita_total),
            "total_previsto": float(total_confirmado),
            "fiado": float(max(0, total_confirmado - receita_total)),
            "despesas_total": float(despesas_total),
            "lucro_total": float(receita_total - despesas_total)
        })

class PagamentoViewSet(viewsets.ModelViewSet):
    serializer_class = PagamentoSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Pagamento.objects.filter(
            transacao__agendamento__servicos__criado_por=user
        ).distinct().order_by('-data_pagamento')

    def perform_create(self, serializer):
        agendamento_id = self.request.data.get('agendamento')
        serializer.validated_data.pop('agendamento', None)

        if agendamento_id:
            transacao, created = Transacao.objects.get_or_create(agendamento_id=agendamento_id)
            
            # Recalcula o valor total da transação baseado nos serviços
            total_servicos = transacao.agendamento.servicos.aggregate(total=Sum('preco'))['total'] or 0
            transacao.valor_total = total_servicos
            transacao.save()
            
            serializer.save(transacao=transacao)
        else:
            serializer.save()

class TransacaoViewSet(viewsets.ModelViewSet):
    serializer_class = TransacaoSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Transacao.objects.filter(
            agendamento__servicos__criado_por=self.request.user
        ).distinct().order_by('-data_criacao')

class DespesaViewSet(viewsets.ModelViewSet):
    serializer_class = DespesaSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self): 
        # CORREÇÃO: Alterado de '-data' para '-data_despesa'
        return Despesa.objects.filter(usuario=self.request.user).order_by('-data_despesa')
    
    def perform_create(self, serializer): 
        serializer.save(usuario=self.request.user)

class CalculadoraViewSet(viewsets.ModelViewSet):
    serializer_class = CalculadoraSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self): 
        return CalculadoraPrecificacao.objects.filter(usuario=self.request.user)
    
    def perform_create(self, serializer): 
        serializer.save(usuario=self.request.user)