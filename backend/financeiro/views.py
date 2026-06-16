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


class EntradasPeriodoView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        periodo = request.query_params.get('periodo', 'mes').lower()
        agora = timezone.now()
        hoje = agora.date()
        
        dados_grafico_dict = collections.OrderedDict()
        
        if periodo == 'dia':
            data_inicio = agora.replace(hour=0, minute=0, second=0, microsecond=0)
            texto_referencia = hoje.strftime('%d/%m/%Y')
            label_periodo = "Dia"
            for h in [0, 4, 8, 12, 16, 20]:
                dados_grafico_dict[f"{h:02d}:00"] = 0
        elif periodo == 'semana':
            inicio_semana = hoje - timedelta(days=hoje.weekday())
            data_inicio = timezone.make_aware(timezone.datetime.combine(inicio_semana, timezone.datetime.min.time()))
            texto_referencia = f"Semana de {inicio_semana.strftime('%d/%m')} a {hoje.strftime('%d/%m/%Y')}"
            label_periodo = "Semana"
            for d in ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']:
                dados_grafico_dict[d] = 0
        elif periodo == 'ano':
            data_inicio = agora.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            texto_referencia = agora.strftime('%Y')
            label_periodo = "Ano"
            for m in ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']:
                dados_grafico_dict[m] = 0
        else:
            data_inicio = agora.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            texto_referencia = agora.strftime('%B/%Y')
            label_periodo = "Mês"
            for s in ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5']:
                dados_grafico_dict[s] = 0

        pagamentos_user = Pagamento.objects.filter(
            transacao__agendamento__servicos__criado_por=user
        ).distinct()

        pagamentos_filtrados = pagamentos_user.filter(data_pagamento__gte=data_inicio).order_by('-data_pagamento')
        total_acumulado = pagamentos_filtrados.aggregate(total=Sum('valor'))['total'] or 0

        detalhes_pagamentos = []
        for p in pagamentos_filtrados:
            valor_float = float(p.valor)
            dt = p.data_pagamento
            agendamento = p.transacao.agendamento
            
            detalhes_pagamentos.append({
                "id": p.id,
                "valor": valor_float,
                "data_pagamento": dt.isoformat(),
                "forma_pagamento": p.forma_pagamento, 
                "observacao": p.observacao or "",
                "cliente": agendamento.cliente.nome_completo or agendamento.cliente.username if hasattr(agendamento, 'cliente') and agendamento.cliente else "Cliente"
            })

            if periodo == 'dia':
                chave = f"{(dt.hour // 4) * 4:02d}:00"
                if chave in dados_grafico_dict: dados_grafico_dict[chave] += valor_float
            elif periodo == 'semana':
                dias_semana = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
                chave = dias_semana[dt.weekday()]
                if chave in dados_grafico_dict: dados_grafico_dict[chave] += valor_float
            elif periodo == 'ano':
                meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
                chave = meses[dt.month - 1]
                if chave in dados_grafico_dict: dados_grafico_dict[chave] += valor_float
            else:
                dia_do_mes = dt.day
                chave = 'Semana 1' if dia_do_mes <= 7 else 'Semana 2' if dia_do_mes <= 14 else 'Semana 3' if dia_do_mes <= 21 else 'Semana 4' if dia_do_mes <= 28 else 'Semana 5'
                dados_grafico_dict[chave] += valor_float

        dados_grafico_formatados = [{"label": k, "valor": round(v, 2)} for k, v in dados_grafico_dict.items()]

        return Response({
            "periodo_selecionado": periodo,
            "label_periodo": label_periodo,
            "texto_referencia": texto_referencia, 
            "total_acumulado": float(total_acumulado),
            "quantidade_entradas": pagamentos_filtrados.count(),
            "dados_grafico": dados_grafico_formatados,
            "entradas": detalhes_pagamentos
        }, status=status.HTTP_OK)

class DespesasPeriodoView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        periodo = request.query_params.get('periodo', 'mes').lower()
        agora = timezone.now()
        hoje = agora.date()
        
        dados_grafico_dict = collections.OrderedDict()
        
        if periodo == 'dia':
            data_inicio = hoje
            texto_referencia = hoje.strftime('%d/%m/%Y')
            label_periodo = "Dia"
            for h in [0, 4, 8, 12, 16, 20]: dados_grafico_dict[f"{h:02d}:00"] = 0
        elif periodo == 'semana':
            inicio_semana = hoje - timedelta(days=hoje.weekday())
            data_inicio = inicio_semana
            texto_referencia = f"Semana de {inicio_semana.strftime('%d/%m')} a {hoje.strftime('%d/%m/%Y')}"
            label_periodo = "Semana"
            for d in ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']: dados_grafico_dict[d] = 0
        elif periodo == 'ano':
            data_inicio = hoje.replace(month=1, day=1)
            texto_referencia = hoje.strftime('%Y')
            label_periodo = "Ano"
            for m in ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']: dados_grafico_dict[m] = 0
        else:
            data_inicio = hoje.replace(day=1)
            texto_referencia = agora.strftime('%B/%Y')
            label_periodo = "Mês"
            for s in ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5']: dados_grafico_dict[s] = 0

        despesas_query = Despesa.objects.filter(usuario=user)

        if periodo == 'dia':
            despesas_filtradas = despesas_query.filter(data_despesa=data_inicio).order_by('-data_despesa')
        else:
            despesas_filtradas = despesas_query.filter(data_despesa__gte=data_inicio).order_by('-data_despesa')

        total_acumulado = despesas_filtradas.aggregate(total=Sum('valor'))['total'] or 0

        detalhes_despesas = []
        for d in despesas_filtradas:
            valor_float = float(d.valor)
            dt_despesa = d.data_despesa
            
            detalhes_despesas.append({
                "id": d.id,
                "descricao": d.descricao,
                "valor": valor_float,
                "data_despesa": dt_despesa.isoformat(),
                "categoria": d.categoria or "FIXA"
            })

            if periodo == 'dia':
                dados_grafico_dict["12:00"] += valor_float
            elif periodo == 'semana':
                dias_semana = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
                chave = dias_semana[dt_despesa.weekday()]
                if chave in dados_grafico_dict: dados_grafico_dict[chave] += valor_float
            elif periodo == 'ano':
                meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
                chave = meses[dt_despesa.month - 1]
                if chave in dados_grafico_dict: dados_grafico_dict[chave] += valor_float
            else:
                dia_do_mes = dt_despesa.day
                chave = 'Semana 1' if dia_do_mes <= 7 else 'Semana 2' if dia_do_mes <= 14 else 'Semana 3' if dia_do_mes <= 21 else 'Semana 4' if dia_do_mes <= 28 else 'Semana 5'
                if chave in dados_grafico_dict: dados_grafico_dict[chave] += valor_float

        dados_grafico_formatados = [{"label": k, "valor": round(v, 2)} for k, v in dados_grafico_dict.items()]

        return Response({
            "periodo_selecionado": periodo,
            "label_periodo": label_periodo,
            "texto_referencia": texto_referencia, 
            "total_acumulado": float(total_acumulado),
            "quantidade_despesas": despesas_filtradas.count(),
            "dados_grafico": dados_grafico_formatados,
            "despesas": detalhes_despesas
        }, status=status.HTTP_OK)