# iot/views.py — ATUALIZADO para pagamento dividido
#
# Mudança principal: ao selecionar um agendamento, calcula o preço
# total dos serviços vinculados e envia junto ao publicar o contexto.

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.utils import timezone

from .models import AtendimentoAtivo
from .mqtt_publisher import publicar_atendimento_ativo, publicar_alerta
from agendamentos.models import Agendamento


def _calcular_valor_total_servico(agendamento):
    """
    Soma o preço de todos os serviços vinculados ao agendamento.
    Ajuste o nome do related_name/campo conforme seu model real
    (no diagrama ER do capítulo, isso seria via Agendamentos_has_Servicos).
    """
    if not agendamento:
        return None

    try:
        total = sum(
            float(servico.preco)
            for servico in agendamento.servicos.all()
        )
        return total if total > 0 else None
    except Exception:
        # Se a relação não existir ainda ou o campo tiver outro nome,
        # falha de forma segura: retorna None (modo sem total, igual antes)
        return None


class SelecionarAtendimentoAtivoView(APIView):
    """
    POST /api/iot/atendimento-ativo/

    Body esperado:
    {
        "agendamento_id": 42        // ou null para walk-in
        "nome_cliente": "Maria"     // obrigatório se agendamento_id for null
        "valor_total_manual": 80.0  // NOVO — opcional, para walk-in com preço conhecido
    }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        empreendedor = request.user
        agendamento_id = request.data.get("agendamento_id")
        nome_cliente = request.data.get("nome_cliente", "").strip()
        valor_total_manual = request.data.get("valor_total_manual")  # NOVO

        agendamento = None
        valor_total_esperado = None

        if agendamento_id:
            try:
                agendamento = Agendamento.objects.get(
                    id=agendamento_id,
                    empreendedor=empreendedor,
                )
                nome_cliente = agendamento.nome_cliente
                valor_total_esperado = _calcular_valor_total_servico(agendamento)  # NOVO
            except Agendamento.DoesNotExist:
                return Response(
                    {"erro": "Agendamento não encontrado para este usuário."},
                    status=status.HTTP_404_NOT_FOUND,
                )
        elif not nome_cliente:
            return Response(
                {"erro": "Informe agendamento_id ou nome_cliente para um walk-in."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        else:
            # Walk-in: usa o valor manual se foi informado pelo app
            if valor_total_manual is not None:
                valor_total_esperado = float(valor_total_manual)

        AtendimentoAtivo.objects.filter(
            empreendedor=empreendedor, is_ativo=True
        ).update(is_ativo=False, finalizado_em=timezone.now())

        contexto = AtendimentoAtivo.objects.create(
            empreendedor=empreendedor,
            agendamento=agendamento,
            nome_cliente_exibicao=nome_cliente,
            valor_total_esperado=valor_total_esperado,  # NOVO campo no model
            valor_acumulado=0,                          # NOVO — começa zerado
            is_ativo=True,
        )

        publicar_atendimento_ativo(
            empreendedor_id=empreendedor.id,
            nome_cliente=nome_cliente,
            contexto_id=contexto.id,
            valor_total_esperado=valor_total_esperado,  # NOVO
        )

        mensagem = (
            f"Painel atualizado. Total esperado: R$ {valor_total_esperado:.2f}"
            if valor_total_esperado
            else "Painel atualizado. Sem valor total definido — modo livre."
        )

        return Response(
            {
                "id": contexto.id,
                "nome_cliente_exibicao": contexto.nome_cliente_exibicao,
                "agendamento_id": agendamento.id if agendamento else None,
                "valor_total_esperado": valor_total_esperado,
                "mensagem": mensagem,
            },
            status=status.HTTP_201_CREATED,
        )


class CancelarAtendimentoAtivoView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        empreendedor = request.user
        atualizado = AtendimentoAtivo.objects.filter(
            empreendedor=empreendedor, is_ativo=True
        ).update(is_ativo=False, finalizado_em=timezone.now())

        if atualizado:
            publicar_alerta(empreendedor.id, "Selecao cancelada")

        return Response(status=status.HTTP_204_NO_CONTENT)


class AtendimentoAtivoAtualView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        contexto = AtendimentoAtivo.objects.filter(
            empreendedor=request.user, is_ativo=True
        ).first()

        if not contexto:
            return Response({"ativo": False})

        return Response({
            "ativo": True,
            "nome_cliente_exibicao": contexto.nome_cliente_exibicao,
            "agendamento_id": contexto.agendamento_id,
            "valor_total_esperado": contexto.valor_total_esperado,  # NOVO
            "valor_acumulado": contexto.valor_acumulado,            # NOVO
            "selecionado_em": contexto.selecionado_em,
        })