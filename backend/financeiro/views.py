from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Sum
from django.utils import timezone
from .models import Transacao, Pagamento, Despesa, CalculadoraPrecificacao
from .serializers import TransacaoSerializer, PagamentoSerializer, DespesaSerializer, CalculadoraSerializer

class TransacaoViewSet(viewsets.ModelViewSet):
    serializer_class = TransacaoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # Se for ADMIN, vê transações dos serviços que ELE criou
        if user.tipo_usuario == 'ADMIN':
            return Transacao.objects.filter(
                agendamento__servicos__criado_por=user
            ).distinct().order_by('-data_criacao')
            
        # Se for CLIENTE, vê transações dos agendamentos DELE
        return Transacao.objects.filter(
            agendamento__cliente=user
        ).distinct().order_by('-data_criacao')

    # Removi o perform_create pois Transacao não tem campo 'usuario' direto.
    # Ela já nasce vinculada a um Agendamento.

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        Retorna totais do mês atual APENAS para o usuário logado (Admin).
        """
        user = request.user
        hoje = timezone.now()
        mes_atual = hoje.month
        ano_atual = hoje.year

        # 1. Identificar minhas transações (Caminho: Transacao -> Agendamento -> Servico -> Dono)
        # Usamos distinct() para não duplicar IDs se houver múltiplos serviços
        minhas_transacoes_ids = Transacao.objects.filter(
            agendamento__servicos__criado_por=user
        ).values_list('id', flat=True).distinct()
        
        # 2. Somar os pagamentos dessas transações
        total_receita = Pagamento.objects.filter(
            transacao__id__in=minhas_transacoes_ids,
            data_pagamento__month=mes_atual,
            data_pagamento__year=ano_atual
        ).aggregate(Sum('valor'))['valor__sum'] or 0

        # 3. Total Despesas no Mês (Despesa tem campo usuario direto)
        total_despesas = Despesa.objects.filter(
            usuario=user,
            data_despesa__month=mes_atual,
            data_despesa__year=ano_atual
        ).aggregate(Sum('valor'))['valor__sum'] or 0

        # 4. Lucro
        lucro = total_receita - total_despesas

        return Response({
            "mes": mes_atual,
            "receita": total_receita,
            "despesas": total_despesas,
            "lucro": lucro
        })

class DespesaViewSet(viewsets.ModelViewSet):
    serializer_class = DespesaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Despesa tem dono direto, então filtro simples funciona
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

class PagamentoViewSet(viewsets.ModelViewSet):
    serializer_class = PagamentoSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Filtra pagamentos onde o dono do serviço do agendamento sou EU
        return Pagamento.objects.filter(
            transacao__agendamento__servicos__criado_por=user
        ).distinct().order_by('-data_pagamento')

    # Removi perform_create pois Pagamento herda dono da Transação