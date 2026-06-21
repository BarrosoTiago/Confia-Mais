# iot/views.py

import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.utils import timezone

from .models import AtendimentoAtivo
from .mqtt_publisher import publicar_atendimento_ativo, publicar_alerta
from agendamentos.models import Agendamento

logger = logging.getLogger(__name__)


def _calcular_valor_total_servico(agendamento):
    if not agendamento:
        return None
    try:
        total = sum(
            float(servico.preco)
            for servico in agendamento.servicos.all()
        )
        return total if total > 0 else None
    except Exception as e:
        logger.warning(f"[VIEW] Erro ao calcular valor total: {e}")
        return None


class SelecionarAtendimentoAtivoView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logger.info(f"[VIEW] POST /api/iot/atendimento-ativo/ — user={request.user.id}")

        empreendedor = request.user
        agendamento_id = request.data.get("agendamento_id")
        nome_cliente = request.data.get("nome_cliente", "").strip()
        valor_total_manual = request.data.get("valor_total_manual")

        agendamento = None
        valor_total_esperado = None

        if agendamento_id:
            try:
                agendamento = Agendamento.objects.get(
                    id=agendamento_id,
                    empreendedor=empreendedor,
                )
                nome_cliente = agendamento.nome_cliente
                valor_total_esperado = _calcular_valor_total_servico(agendamento)
                logger.info(f"[VIEW] Agendamento {agendamento_id} encontrado — cliente={nome_cliente}, valor={valor_total_esperado}")
            except Agendamento.DoesNotExist:
                logger.warning(f"[VIEW] Agendamento {agendamento_id} não encontrado para user={empreendedor.id}")
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
            if valor_total_manual is not None:
                valor_total_esperado = float(valor_total_manual)
            logger.info(f"[VIEW] Walk-in: cliente={nome_cliente}, valor={valor_total_esperado}")

        AtendimentoAtivo.objects.filter(
            empreendedor=empreendedor, is_ativo=True
        ).update(is_ativo=False, finalizado_em=timezone.now())

        contexto = AtendimentoAtivo.objects.create(
            empreendedor=empreendedor,
            agendamento=agendamento,
            nome_cliente_exibicao=nome_cliente,
            valor_total_esperado=valor_total_esperado,
            valor_acumulado=0,
            is_ativo=True,
        )
        logger.info(f"[VIEW] AtendimentoAtivo criado — id={contexto.id}")

        # ← LOGS para rastrear o publish
        logger.info(f"[VIEW] Chamando publicar_atendimento_ativo — empreendedor_id={empreendedor.id}, nome={nome_cliente}, valor={valor_total_esperado}")
        try:
            publicar_atendimento_ativo(
                empreendedor_id=empreendedor.id,
                nome_cliente=nome_cliente,
                contexto_id=contexto.id,
                valor_total_esperado=valor_total_esperado,
            )
            logger.info(f"[VIEW] publicar_atendimento_ativo executado sem exceção")
        except Exception as e:
            logger.error(f"[VIEW] ERRO em publicar_atendimento_ativo: {e}", exc_info=True)

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
        logger.info(f"[VIEW] DELETE /api/iot/atendimento-ativo/cancelar/ — user={request.user.id}")
        empreendedor = request.user
        atualizado = AtendimentoAtivo.objects.filter(
            empreendedor=empreendedor, is_ativo=True
        ).update(is_ativo=False, finalizado_em=timezone.now())

        if atualizado:
            publicar_alerta(empreendedor.id, "Selecao cancelada")
            logger.info(f"[VIEW] Painel cancelado para user={empreendedor.id}")

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
            "valor_total_esperado": contexto.valor_total_esperado,
            "valor_acumulado": contexto.valor_acumulado,
            "selecionado_em": contexto.selecionado_em,
        })