from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Sum
from django.utils import timezone
from .models import Transacao, Pagamento, Despesa, CalculadoraPrecificacao
from .serializers import TransacaoSerializer, PagamentoSerializer, DespesaSerializer, CalculadoraSerializer

class TransacaoViewSet(viewsets.ModelViewSet):
    serializer_class = TransacaoSerializer
    permission_classes = [permissions.IsAdminUser] # Só Admin mexe no dinheiro
    queryset = Transacao.objects.all().order_by('-data_criacao')

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        Endpoint especial para o Dashboard: Retorna totais do mês atual.
        URL: /api/financeiro/transacoes/dashboard/
        """
        hoje = timezone.now()
        mes_atual = hoje.month
        ano_atual = hoje.year

        # 1. Total Recebido no Mês (Soma dos Pagamentos)
        total_receita = Pagamento.objects.filter(
            data_pagamento__month=mes_atual,
            data_pagamento__year=ano_atual
        ).aggregate(Sum('valor'))['valor__sum'] or 0

        # 2. Total Despesas no Mês
        total_despesas = Despesa.objects.filter(
            data_despesa__month=mes_atual,
            data_despesa__year=ano_atual
        ).aggregate(Sum('valor'))['valor__sum'] or 0

        # 3. Lucro
        lucro = total_receita - total_despesas

        return Response({
            "mes": mes_atual,
            "receita": total_receita,
            "despesas": total_despesas,
            "lucro": lucro
        })

class DespesaViewSet(viewsets.ModelViewSet):
    serializer_class = DespesaSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Despesa.objects.all().order_by('-data_despesa')

# <--- ADICIONE ISSO: Preenche o campo 'usuario' automaticamente ao salvar
    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)
        
class CalculadoraViewSet(viewsets.ModelViewSet):
    serializer_class = CalculadoraSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def get_queryset(self):
        # Retorna apenas a calculadora do usuário logado
        return CalculadoraPrecificacao.objects.filter(usuario=self.request.user)