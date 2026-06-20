# iot/views.py
#
# Endpoints que o APP MOBILE chama (não o ESP32) para definir
# qual agendamento está "no painel" antes do profissional ir para a bancada.

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.utils import timezone

from .models import AtendimentoAtivo
from .mqtt_publisher import publicar_atendimento_ativo, publicar_alerta
from agendamentos.models import Agendamento


class SelecionarAtendimentoAtivoView(APIView):
    """
    POST /api/iot/atendimento-ativo/

    Chamado pelo APP quando o profissional toca em um cliente da lista
    (ou em "Atendimento sem agendamento" para um walk-in).

    Body esperado:
    {
        "agendamento_id": 42        // ou null para walk-in
        "nome_cliente": "Maria"     // obrigatório se agendamento_id for null
    }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        import traceback
        try:
            empreendedor = request.user
            agendamento_id = request.data.get("agendamento_id")
            nome_cliente = request.data.get("nome_cliente", "").strip()

            agendamento = None
            if agendamento_id:
                try:
                    agendamento = Agendamento.objects.get(
                        id=agendamento_id,
                        empreendedor=request.user,  # garante que é agendamento do seu negócio
                    )
                    nome_cliente = agendamento.nome_cliente  # usa a property
                except Agendamento.DoesNotExist:
                    return Response(
                        {"erro": "Agendamento não encontrado para este usuário."},
                        status=status.HTTP_404_NOT_FOUND,
                    )
            elif not nome_cliente:
                return Response(
                    {"erro": "Informe agendamento_id ou nome_cliente."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            AtendimentoAtivo.objects.filter(
                empreendedor=empreendedor, is_ativo=True
            ).update(is_ativo=False, finalizado_em=timezone.now())

            contexto = AtendimentoAtivo.objects.create(
                empreendedor=empreendedor,
                agendamento=agendamento,
                nome_cliente_exibicao=nome_cliente,
                is_ativo=True,
            )

            publicar_atendimento_ativo(
                empreendedor_id=empreendedor.id,
                nome_cliente=nome_cliente,
                contexto_id=contexto.id,
            )

            return Response(
                {
                    "id": contexto.id,
                    "nome_cliente_exibicao": contexto.nome_cliente_exibicao,
                    "agendamento_id": agendamento.id if agendamento else None,
                    "mensagem": "Painel atualizado. Pode iniciar o atendimento no teclado.",
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            # Mostra o erro EXATO no terminal e retorna no body da resposta
            tb = traceback.format_exc()
            print("=" * 60)
            print("ERRO NA VIEW IoT:")
            print(tb)
            print("=" * 60)
            return Response(
                {"erro": str(e), "traceback": tb},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

class CancelarAtendimentoAtivoView(APIView):
    """
    DELETE /api/iot/atendimento-ativo/

    Permite que o profissional cancele a seleção pelo app
    (ex: selecionou o cliente errado por engano).
    """
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
    """
    GET /api/iot/atendimento-ativo/

    Permite que o app consulte o estado atual do painel
    (útil ao reabrir o app e ver "o que está rolando agora").
    """
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
            "selecionado_em": contexto.selecionado_em,
        })