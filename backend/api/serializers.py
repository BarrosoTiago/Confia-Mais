from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer 
from django.db.models import Avg, Sum
from django.utils import timezone
import datetime

# --- IMPORTS PROTEGIDOS DOS MODELOS ---
try:
    from servicos.models import Servico
    from agendamentos.models import HorarioFuncionamento, Avaliacao, Agendamento
except ImportError:
    pass

User = get_user_model() 

# --- 1. SERIALIZER DE CADASTRO (O QUE ESTAVA DANDO ERRO) ---
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
        extra_kwargs = {'username': {'required': True}}

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
    
    # Este campo 'financeiro' é o que preenche o saldo na sua tabela do frontend
    financeiro = serializers.SerializerMethodField()

    servicos = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Servico.objects.all(), write_only=True
    )

    class Meta:
        model = Agendamento
        fields = '__all__'
        read_only_fields = ['data_hora_fim', 'cliente', 'status', 'criado_em']

    def get_financeiro(self, obj):
        """Calcula o saldo real buscando os pagamentos no app financeiro."""
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
        
        # Validação de conflito de horário
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
        
        # Gera automaticamente a Transação no app Financeiro
        from financeiro.models import Transacao
        Transacao.objects.create(agendamento=agendamento)
        
        return agendamento