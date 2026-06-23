import collections                          # ← CORRIGIDO: import faltando
from decimal import Decimal                 # ← CORRIGIDO: import faltando

from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta
from .models import Transacao, Pagamento, Despesa, CalculadoraPrecificacao
from agendamentos.models import Agendamento 
from .serializers import (
    TransacaoSerializer, 
    PagamentoSerializer, 
    DespesaSerializer, 
    CalculadoraSerializer
)

class SaudeFinanceiraView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        usuario = request.user
        hoje = timezone.now().date()
        inicio_mes = hoje.replace(day=1)
        
        calc = CalculadoraPrecificacao.objects.filter(usuario=usuario).first()
        custo_fixo_calculadora = calc.custo_fixo_mensal if calc else Decimal('0.00')
        
        despesas_mes = Despesa.objects.filter(usuario=usuario, data_despesa__gte=inicio_mes, data_despesa__lte=hoje)
        custo_fixo_real = despesas_mes.filter(categoria__iexact='Fixo').aggregate(total=Sum('valor'))['total'] or Decimal('0.00')
        custo_variavel_real = despesas_mes.filter(categoria__iexact='Variável').aggregate(total=Sum('valor'))['total'] or Decimal('0.00')
        
        custo_fixo_total = max(custo_fixo_calculadora, custo_fixo_real)
        total_despesas = custo_fixo_real + custo_variavel_real

        entradas_mes = Pagamento.objects.filter(
            transacao__agendamento__servicos__criado_por=usuario,
            data_pagamento__gte=inicio_mes
        ).aggregate(total=Sum('valor'))['total'] or Decimal('0.00')

        faturamento_total = entradas_mes
        lucro_liquido = faturamento_total - total_despesas
        
        margem_lucro = 0
        if faturamento_total > 0:
            margem_lucro = round((lucro_liquido / faturamento_total) * 100, 2)
            
        margem_contribuicao_estimada = Decimal('0.50') 
        ponto_equilibrio = custo_fixo_total / margem_contribuicao_estimada if custo_fixo_total > 0 else Decimal('0.00')

        transacoes_pendentes = Transacao.objects.filter(
            agendamento__servicos__criado_por=usuario,
            status_pagamento__in=['PENDENTE', 'PARCIAL']
        )
        
        total_pendente = sum([t.saldo_restante() for t in transacoes_pendentes])
        
        atraso_7_dias = Decimal('0.00')
        atraso_30_dias = Decimal('0.00')
        atraso_critico = Decimal('0.00')

        for t in transacoes_pendentes:
            dias_atraso = (hoje - t.agendamento.data_hora_inicio.date()).days
            saldo = t.saldo_restante()
            if dias_atraso <= 7:
                atraso_7_dias += saldo
            elif dias_atraso <= 30:
                atraso_30_dias += saldo
            else:
                atraso_critico += saldo

        grafico_fluxo = []
        for i in range(4, -1, -1):
            mes_alvo = hoje - timedelta(days=i*30)
            label_mes = mes_alvo.strftime('%b')
            
            ent = Pagamento.objects.filter(
                transacao__agendamento__servicos__criado_por=usuario,
                data_pagamento__month=mes_alvo.month,
                data_pagamento__year=mes_alvo.year
            ).aggregate(total=Sum('valor'))['total'] or Decimal('0.00')
            
            sai = Despesa.objects.filter(
                usuario=usuario,
                data_despesa__month=mes_alvo.month,
                data_despesa__year=mes_alvo.year
            ).aggregate(total=Sum('valor'))['total'] or Decimal('0.00')
            
            grafico_fluxo.append({
                "label": label_mes,
                "entradas": float(ent),
                "saidas": float(sai)
            })

        dados_saude = {
            "metricas": {
                "margem_lucro": float(margem_lucro),
                "ponto_equilibrio": float(ponto_equilibrio),
                "liquidez": 1.2 if total_despesas == 0 else round(float(faturamento_total / total_despesas), 2),
                "capital_giro": float(custo_fixo_total * 2),
                "total_pendente": float(total_pendente),
                "pmr": 15,
                "pmp": 30
            },
            "grafico_fluxo": grafico_fluxo,
            "grafico_inadimplencia": [
                { "name": "Até 7 dias", "value": float(atraso_7_dias), "color": "#2DCE89" },
                { "name": "8 a 30 dias", "value": float(atraso_30_dias), "color": "#FB6340" },
                { "name": "Mais de 30 dias", "value": float(atraso_critico), "color": "#F5365C" }
            ],
            "grafico_margins": [
                { "name": "Fixas", "margem": float(custo_fixo_real) },
                { "name": "Variáveis", "margem": float(custo_variavel_real) }
            ]
        }

        return Response(dados_saude)

class FinanceiroDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        agora = timezone.now()
        hoje = agora.date()
        inicio_mes = agora.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        ag_ids = Agendamento.objects.filter(servicos__criado_por=user).values_list('id', flat=True).distinct()

        pagamentos_base = Pagamento.objects.filter(transacao__agendamento_id__in=ag_ids)
        
        receita_total = pagamentos_base.aggregate(total=Sum('valor'))['total'] or 0
        receita_hoje = pagamentos_base.filter(data_pagamento__date=hoje).aggregate(total=Sum('valor'))['total'] or 0
        
        receita_mes = pagamentos_base.filter(
            data_pagamento__gte=inicio_mes
        ).aggregate(total=Sum('valor'))['total'] or 0

        total_confirmado = Agendamento.objects.filter(
            id__in=ag_ids, 
            status='CONFIRMADO'
        ).aggregate(total=Sum('servicos__preco'))['total'] or 0

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
        }, status=status.HTTP_200_OK)

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
        }, status=status.HTTP_200_OK)


class ClientesInadimplentesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        usuario = request.user
        hoje = timezone.now().date()
        
        transacoes_pendentes = Transacao.objects.filter(
            agendamento__servicos__criado_por=usuario,
            agendamento__status__in=['CONFIRMADO', 'CONCLUIDO'],
            status_pagamento__in=['PENDENTE', 'PARCIAL']
        ).distinct().order_by('agendamento__data_hora_inicio')
        
        lista_inadimplentes = []
        total_devido_acumulado = 0
        clientes_unicos = set()
        
        for t in transacoes_pendentes:
            agendamento = t.agendamento
            cliente = agendamento.cliente
            
            if not agendamento or not cliente:
                continue
                
            data_servico = agendamento.data_hora_inicio.date()
            
            if data_servico <= hoje:
                dias_atraso = (hoje - data_servico).days
            else:
                dias_atraso = 0
                
            valor_devido = float(t.saldo_restante())
            
            if valor_devido <= 0:
                continue
                
            nomes_servicos = ", ".join([s.nome for s in agendamento.servicos.all()])
            
            telefone_cliente = getattr(cliente, 'telefone', '') or getattr(cliente, 'celular', '')
            telefone_limpo = "".join(filter(str.isdigit, str(telefone_cliente)))
            if not telefone_limpo.startswith('55') and len(telefone_limpo) >= 10:
                telefone_limpo = f"55{telefone_limpo}"

            total_devido_acumulado += valor_devido
            clientes_unicos.add(cliente.id)
            
            lista_inadimplentes.append({
                "id": t.id,
                "cliente": cliente.nome_completo or cliente.get_full_name() or cliente.username,
                "servico": nomes_servicos,
                "dataConclusao": data_servico.strftime('%d/%m/%Y'),
                "diasAtraso": dias_atraso,
                "valor": valor_devido,
                "telefone": telefone_limpo
            })
            
        return Response({
            "totalDevido": round(total_devido_acumulado, 2),
            "quantidade": len(clientes_unicos),
            "inadimplentes": lista_inadimplentes
        }, status=status.HTTP_200_OK)