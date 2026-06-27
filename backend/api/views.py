from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated  # ← ADICIONAR ESTA LINHA
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import get_user_model
from django.db.models import Count, Q, Sum
from django.utils import timezone
from django.conf import settings

# Imports
import random
import requests
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

from rest_framework.parsers import MultiPartParser, FormParser, JSONParser 

from .serializers import (
    UserRegistrationSerializer, 
    CustomTokenObtainPairSerializer,
    UserUpdateSerializer,
    ServicoSerializer,
    HorarioConfigSerializer
)

try:
    from agendamentos.models import Agendamento, HorarioFuncionamento
    from financeiro.models import Despesa, Pagamento, Transacao
    from servicos.models import Servico
except ImportError:
    pass

User = get_user_model()

# --- 1. REGISTRO ---
class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny] 
    authentication_classes = ()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # 0. LÓGICA DE REIVINDICAÇÃO DE CONTA (Vínculo Mágico)
        # Se o usuário informou um telefone, varremos agendamentos "avulsos" com esse telefone
        if getattr(user, 'telefone', None):
            import re
            telefone_limpo = re.sub(r'\D', '', user.telefone)
            # Vincula agendamentos que estão sem cliente e cujo telefone avulso bata
            Agendamento.objects.filter(
                cliente__isnull=True, 
                cliente_telefone_avulso=telefone_limpo
            ).update(cliente=user)

        # 1. Gera o código de 6 dígitos
        codigo = str(random.randint(100000, 999999))
        user.codigo_verificacao = codigo
        user.save()

        # 2. Dispara o e-mail de Boas-Vindas via Brevo
        try:
            url = "https://api.brevo.com/v3/smtp/email"
            payload = {
                "sender": {"name": "Equipe Confia+", "email": "emilyamorim964@gmail.com"},
                "to": [{"email": user.email}],
                "subject": "Bem-vindo ao Confia+! Verifique seu e-mail",
                "htmlContent": f"<html><body><h2>Olá, {user.username}!</h2><p>Falta pouco para acessar o seu painel.</p><p>Seu código de verificação é: <strong>{codigo}</strong></p></body></html>"
            }
            headers = {
                "accept": "application/json",
                "api-key": getattr(settings, 'BREVO_API_KEY', ''),
                "content-type": "application/json"
            }
            resposta = requests.post(url, json=payload, headers=headers)
            resposta.raise_for_status()
        except Exception as e:
            print(f"[ERRO E-MAIL DE CADASTRO] {e}")

        return Response({
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "tipo_usuario": getattr(user, 'tipo_usuario', 'CLIENTE'),
                "setup_concluido": False
            },
            "message": "Usuário registrado! Enviamos um código para o seu e-mail."
        }, status=status.HTTP_201_CREATED)

# --- 1.5 VERIFICAÇÃO DE E-MAIL ---
class VerificarEmailView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = ()

    def post(self, request):
        email = request.data.get('email')
        codigo_digitado = request.data.get('codigo')

        try:
            user = User.objects.get(email=email)

            if user.email_verificado:
                return Response({"mensagem": "Este e-mail já está verificado!"}, status=status.HTTP_400_BAD_REQUEST)

            if not codigo_digitado or user.codigo_verificacao != codigo_digitado:
                return Response({"erro": "Código inválido ou incorreto."}, status=status.HTTP_400_BAD_REQUEST)

            # Tudo certo! Marca como verificado e limpa o código.
            user.email_verificado = True
            user.codigo_verificacao = None
            user.save()

            return Response({"mensagem": "E-mail verificado com sucesso! Você já pode fazer login."}, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({"erro": "Usuário não encontrado."}, status=status.HTTP_404_NOT_FOUND)

# --- 2. LOGIN ---
class CustomLoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer 

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        
        # Bloqueia a porta se o e-mail não estiver verificado
        try:
            user = User.objects.get(email=email)
            if not user.email_verificado:
                return Response(
                    {"erro": "email_nao_verificado", "mensagem": "Por favor, verifique seu e-mail antes de entrar."}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        except User.DoesNotExist:
            pass # Deixa seguir para o Django dar o erro padrão

        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            access_token = response.data.get('access')
            refresh_token = response.data.get('refresh')
            if access_token and refresh_token:
                response.set_cookie(
                    key='refresh_token', value=refresh_token,
                    httponly=True, samesite='Strict', secure=False, 
                )
        return response

# --- 3. QUEM SOU EU (UserMe) ---
class UserMeView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserUpdateSerializer
    # O segredo para as fotos: estes parsers ensinam o Django a ler o arquivo
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_object(self):
        return self.request.user

    def get(self, request, *args, **kwargs):
        response = super().get(request, *args, **kwargs)
        user = self.request.user
        
        deve_configurar_horarios = False

        if getattr(user, 'tipo_usuario', '') == 'EMPREENDEDOR':
            if hasattr(user, 'horarios_funcionamento') and not user.horarios_funcionamento.exists():
                deve_configurar_horarios = True
        
        # Garante que as URLs das fotos venham completas
        if user.foto:
            response.data['foto'] = request.build_absolute_uri(user.foto.url)
        if user.capa:
            response.data['capa'] = request.build_absolute_uri(user.capa.url)
            
        response.data['deve_configurar_horarios'] = deve_configurar_horarios
        return response

# --- 4. EXCLUIR CONTA ---
class DeleteAccountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        user = request.user
        password = request.data.get('password')

        if not password:
            return Response({"detail": "Senha obrigatória."}, status=status.HTTP_400_BAD_REQUEST)
        if not user.check_password(password):
            return Response({"detail": "Senha incorreta."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user.delete()
            return Response({"detail": "Conta excluída."}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- 5. LOGOUT ---
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
 
    def post(self, request):
        refresh_token = request.data.get('refresh')
 
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()  # invalida server-side
            except TokenError:
                # Token já expirado ou inválido — tudo bem, logout prossegue
                pass
 
        return Response({'detail': 'Logout realizado com sucesso.'}, status=status.HTTP_200_OK)

# --- 6. LISTAS ---
class ClienteListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    def list(self, request, *args, **kwargs):
        user_admin = self.request.user
        clientes = User.objects.filter(meus_agendamentos__servicos__criado_por=user_admin).distinct().annotate(
            visitas_concluidas=Count('meus_agendamentos', filter=Q(meus_agendamentos__status='CONCLUIDO', meus_agendamentos__servicos__criado_por=user_admin))
        )
        data = []
        for c in clientes:
            data.append({
                "id": c.id, "nome": c.nome_completo or c.username,
                "email": c.email, "telefone": getattr(c, 'telefone', 'Não informado'),
                "visitas": c.visitas_concluidas, "foto": c.foto.url if c.foto else None
            })
        return Response(data)

class EmpreendedorListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny] 
    serializer_class = UserRegistrationSerializer 
    def get_queryset(self):
        return User.objects.filter(tipo_usuario='EMPREENDEDOR')

class EmpreendedorDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = UserRegistrationSerializer
    def get_queryset(self):
        return User.objects.filter(tipo_usuario='EMPREENDEDOR')

# --- 7. VIEWSETS DO ONBOARDING E VITRINE ---

class ServicoViewSet(viewsets.ModelViewSet):
    serializer_class = ServicoSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        empreendedor_id = self.request.query_params.get('empreendedor_id')
        if empreendedor_id:
            return Servico.objects.filter(criado_por_id=empreendedor_id)

        user = self.request.user
        if user.is_authenticated and getattr(user, 'tipo_usuario', None) == 'EMPREENDEDOR':
            return Servico.objects.filter(criado_por=user)
        
        return Servico.objects.all()

    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user)

class HorarioConfigViewSet(viewsets.ModelViewSet):
    serializer_class = HorarioConfigSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return HorarioFuncionamento.objects.filter(usuario=self.request.user)
    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

# --- 8. DASHBOARD ---
class DashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from datetime import datetime
        
        user = request.user

        if getattr(user, 'tipo_usuario', 'CLIENTE') != 'EMPREENDEDOR':
            return Response(
                {"detail": "Acesso negado. Apenas empreendedores têm acesso ao dashboard."}, 
                status=status.HTTP_403_FORBIDDEN
            )

        hoje = datetime.now().date()
        mes_atual = hoje.month
        ano_atual = hoje.year

        nome_usuario = getattr(user, 'nome_completo', None) or getattr(user, 'first_name', None) or user.username
        foto_url = None
        if hasattr(user, 'foto') and user.foto:
            foto_url = request.build_absolute_uri(user.foto.url)

        try:
            # 1. Entradas Mês (Baseado em Pagamentos Reais)
            entradas_mes_query = Pagamento.objects.filter(
                transacao__agendamento__servicos__criado_por=user,
                data_pagamento__month=mes_atual,
                data_pagamento__year=ano_atual
            ).aggregate(total=Sum('valor'))
            entradas_mes = entradas_mes_query['total'] or 0.00

            # 2. Recebidos Hoje (Baseado em Pagamentos Reais)
            recebidos_hoje_query = Pagamento.objects.filter(
                transacao__agendamento__servicos__criado_por=user,
                data_pagamento__date=hoje
            ).aggregate(total=Sum('valor'))
            recebidos_hoje = recebidos_hoje_query['total'] or 0.00

            # 3. A Receber (Fiados Pendentes reais)
            transacoes_pendentes = Transacao.objects.filter(
                agendamento__servicos__criado_por=user,
                status_pagamento__in=['PENDENTE', 'PARCIAL', 'EM_ABERTO']
            )
            a_receber = sum([(float(t.valor_total) - float(t.valor_pago)) for t in transacoes_pendentes])

            # 4. Clientes Pendentes (Baseado nas transações)
            clientes_pendentes = transacoes_pendentes.values('agendamento__cliente').distinct().count()

            # 5. Despesas do Mês
            despesas_query = Despesa.objects.filter(
                usuario=user,
                data_despesa__month=mes_atual,
                data_despesa__year=ano_atual,
                pago=True
            ).aggregate(total=Sum('valor'))
            despesas = despesas_query['total'] or 0.00

            balanco_total = float(entradas_mes) - float(despesas)

            proximos_agendamentos = Agendamento.objects.filter(
                servicos__criado_por=user,
                data_hora_inicio__date__gte=hoje
            ).order_by('data_hora_inicio')[:5]

            meses_pt = {
                1: 'JAN', 2: 'FEV', 3: 'MAR', 4: 'ABR', 5: 'MAI', 6: 'JUN',
                7: 'JUL', 8: 'AGO', 9: 'SET', 10: 'OUT', 11: 'NOV', 12: 'DEZ'
            }

            ultimos_agendamentos_lista = []
            for ag in proximos_agendamentos:
                data_local = ag.data_hora_inicio
                
                primeiro_servico = ag.servicos.first()
                nome_servico = primeiro_servico.nome if primeiro_servico else "Sem serviço"
                preco_servico = primeiro_servico.preco if primeiro_servico else 0.00

                nome_cliente = ag.nome_cliente

                ultimos_agendamentos_lista.append({
                    "id": ag.id,
                    "dia": data_local.strftime('%d'),
                    "mes_abreviado": meses_pt[data_local.month],
                    "cliente_nome": nome_cliente,
                    "servico_nome": nome_servico,
                    "horario": data_local.strftime('%H:%M'),
                    "preco": f"{preco_servico:.2f}",
                    "status": ag.status
                })

            return Response({
                "perfil": {
                    "id": user.id,
                    "nome": nome_usuario,
                    "foto": foto_url
                },
                "metrics": {
                    "recebidos_hoje": float(recebidos_hoje),
                    "entradas_mes": float(entradas_mes),
                    "a_receber": float(a_receber),
                    "clientes_pendentes": clientes_pendentes,
                    "balanco_total": float(balanco_total),
                    "despesas": float(despesas)
                },
                "proximos_agendamentos": ultimos_agendamentos_lista
            })

        except Exception as e:
            return Response({
                "error_message": str(e),
                "detail": "Erro interno capturado no views.py do servidor."
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# --- 9. RECUPERAÇÃO DE SENHA (VIA BREVO API) ---
class SolicitarRecuperacaoSenhaView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')

        try:
            user = User.objects.get(email=email)

            # Gera um código aleatório de 6 dígitos
            codigo = str(random.randint(100000, 999999))
            user.codigo_recuperacao = codigo
            user.save()

            # Disparo HTTP direto para a API do Brevo
            try:
                url = "https://api.brevo.com/v3/smtp/email"
                
                payload = {
                    "sender": {
                        "name": "Equipe Confia+",
                        "email": "emilyamorim964@gmail.com"
                    },
                    "to": [{"email": user.email}],
                    "subject": "Recuperação de Senha - Confia+",
                    "htmlContent": (
                        f"<html><body>"
                        f"<h2>Olá, {user.nome_completo or user.username}!</h2>"
                        f"<p>Seu código de verificação para redefinir a senha é: <strong>{codigo}</strong></p>"
                        f"<br><p>Se você não solicitou isso, pode ignorar esta mensagem com segurança.</p>"
                        f"</body></html>"
                    )
                }
                
                headers = {
                    "accept": "application/json",
                    "api-key": getattr(settings, 'BREVO_API_KEY', ''),
                    "content-type": "application/json"
                }

                resposta = requests.post(url, json=payload, headers=headers)
                resposta.raise_for_status()

            except Exception as email_error:
                print(f"[ERRO E-MAIL BREVO] {email_error}")
                if 'resposta' in locals():
                    print(f"Detalhe do erro do Brevo: {resposta.text}")
                    
                return Response(
                    {"erro": "Falha ao enviar e-mail. Verifique a configuração do servidor de e-mail."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        except User.DoesNotExist:
            pass  

        return Response(
            {"mensagem": "Se o e-mail estiver cadastrado, enviaremos um código."},
            status=status.HTTP_200_OK
        )


class RedefinirSenhaView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        codigo_digitado = request.data.get('codigo')
        nova_senha = request.data.get('nova_senha')

        try:
            user = User.objects.get(email=email)

            if not codigo_digitado or user.codigo_recuperacao != codigo_digitado:
                return Response(
                    {"erro": "Código inválido ou expirado."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                validate_password(nova_senha, user)
            except DjangoValidationError as e:
                return Response({"erro": list(e.messages)}, status=status.HTTP_400_BAD_REQUEST)

            user.set_password(nova_senha)
            user.codigo_recuperacao = None
            user.save()

            return Response(
                {"mensagem": "Senha redefinida com sucesso! Faça login."},
                status=status.HTTP_200_OK
            )

        except User.DoesNotExist:
            return Response({"erro": "Usuário não encontrado."}, status=status.HTTP_404_NOT_FOUND)


            