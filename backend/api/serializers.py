import re
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer 
from django.db.models import Avg, Sum
from django.utils import timezone
import datetime

# Novos imports para as validações de senha e erros
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

# --- IMPORTS PROTEGIDOS DOS MODELOS ---
try:
    from servicos.models import Servico
    from agendamentos.models import HorarioFuncionamento, Avaliacao, Agendamento
except ImportError:
    pass

User = get_user_model() 

# --- 1. SERIALIZER DE CADASTRO (BLINDADO) ---
class UserRegistrationSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all(), message="Este e-mail já está em uso.")]
    )
    
    password = serializers.CharField(
        write_only=True, required=True, min_length=8,
        style={'input_type': 'password'}
    )
    
    password_confirm = serializers.CharField(
        write_only=True, required=True, style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'password', 'password_confirm', 
            'nome_completo', 'telefone', 'tipo_usuario', 'foto', 'capa',
            'descricao', 'endereco', 'bairro', 'cidade', 'setup_concluido'
        ) 
        extra_kwargs = {
            'username': {'required': True},
            'nome_completo': {'required': True},
            'telefone': {'required': True}
        }

    # Validação do Telefone (DDD + 9 Obrigatórios)
    def validate_telefone(self, value):
        numero_limpo = re.sub(r'\D', '', value)
        
        if len(numero_limpo) != 11:
            raise serializers.ValidationError("O telefone deve conter o DDD e o dígito 9. Exemplo: (84) 99999-9999")
        
        if numero_limpo[2] != '9':
            raise serializers.ValidationError("O número de telefone deve iniciar com o dígito 9 após o DDD.")
            
        return value

    # Validação da Senha (Bloqueia senhas apenas numéricas ou fracas)
    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    # Validação Geral (Senhas iguais e campos em branco)
    def validate(self, attrs):
        if attrs.get('password') != attrs.get('password_confirm'):
            raise serializers.ValidationError({"password": "As senhas não correspondem."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm', None)
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            # Adicionados nome e telefone para serem salvos corretamente
            nome_completo=validated_data.get('nome_completo'),
            telefone=validated_data.get('telefone'),
            tipo_usuario=validated_data.get('tipo_usuario', 'CLIENTE'),
            setup_concluido=False
        )
        return user

# --- 2. SERIALIZER DE ATUALIZAÇÃO (PERFIL) ---
class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'nome_completo', 'telefone',
            'foto', 'capa', 'tipo_usuario', 'descricao', 
            'endereco', 'bairro', 'cidade', 'setup_concluido'
        ]
        read_only_fields = ['id', 'username', 'email', 'tipo_usuario']

# --- 3. SERIALIZER DE LOGIN ---
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['id'] = self.user.id
        data['username'] = self.user.username
        data['tipo_usuario'] = getattr(self.user, 'tipo_usuario', 'CLIENTE')
        data['setup_concluido'] = getattr(self.user, 'setup_concluido', False)
        return data

# --- 4. SERIALIZERS DE SERVIÇOS E HORÁRIOS ---
class ServicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Servico
        fields = '__all__'
        read_only_fields = ['criado_por']

class HorarioConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = HorarioFuncionamento
        fields = '__all__'
        read_only_fields = ['usuario']

# --- 5. SERIALIZER DE AGENDAMENTO (COM CÁLCULO FINANCEIRO REAL) ---
class AgendamentoSerializer(serializers.ModelSerializer):
    servicos_detalhes = ServicoSerializer(source='servicos', many=True, read_only=True)
    cliente_nome = serializers.ReadOnlyField(source='cliente.nome_completo')
    
    financeiro = serializers.SerializerMethodField()

    servicos = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Servico.objects.all(), write_only=True
    )

    class Meta:
        model = Agendamento
        fields = '__all__'
        read_only_fields = ['data_hora_fim', 'cliente', 'status', 'criado_em']

    def get_financeiro(self, obj):
        try:
            from financeiro.models import Pagamento
            total_servicos = sum(s.preco for s in obj.servicos.all())
            total_pago = Pagamento.objects.filter(transacao__agendamento=obj).aggregate(Sum('valor'))['valor__sum'] or 0
            
            return {
                "total_estimado": float(total_servicos),
                "total_pago": float(total_pago),
                "restante": float(max(0, total_servicos - total_pago)),
                "esta_pago": total_pago >= total_servicos
            }
        except Exception:
            return {"total_estimado": 0, "total_pago": 0, "restante": 0, "esta_pago": False}

    def validate(self, attrs):
        inicio_solicitado = attrs.get('data_hora_inicio')
        servicos_solicitados = attrs.get('servicos')
        
        if not servicos_solicitados:
            raise serializers.ValidationError("Selecione pelo menos um serviço.")
            
        duracao_total = sum([s.duracao_minutos for s in servicos_solicitados])
        fim_solicitado = inicio_solicitado + datetime.timedelta(minutes=duracao_total)
        
        conflitos = Agendamento.objects.filter(
            servicos__criado_por=servicos_solicitados[0].criado_por,
            status__in=['PENDENTE', 'CONFIRMADO'],
            data_hora_inicio__lt=fim_solicitado,
            data_hora_fim__gt=inicio_solicitado
        )
        if self.instance:
            conflitos = conflitos.exclude(pk=self.instance.pk)
            
        if conflitos.exists():
            raise serializers.ValidationError({"data_hora_inicio": "Horário indisponível."})
            
        attrs['data_hora_fim_calculado'] = fim_solicitado
        return attrs

    def create(self, validated_data):
        fim = validated_data.pop('data_hora_fim_calculado')
        servicos = validated_data.pop('servicos')
        agendamento = Agendamento.objects.create(data_hora_fim=fim, **validated_data)
        agendamento.servicos.set(servicos)
        
        from financeiro.models import Transacao
        Transacao.objects.create(agendamento=agendamento)
        
        return agendamento