from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer 
from django.db.models import Avg # Importante para calcular média

User = get_user_model() 

# --- 1. SERIALIZER DE CADASTRO E VITRINE ---
class UserRegistrationSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all(), message="Este e-mail já está em uso.")]
    )
    
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        min_length=8,
        style={'input_type': 'password'},
        label="Senha"
    )
    
    password_confirm = serializers.CharField(
        write_only=True, 
        required=True, 
        style={'input_type': 'password'},
        label="Confirmação de Senha"
    )

    nome_completo = serializers.CharField(required=False, allow_blank=True)
    telefone = serializers.CharField(required=False, allow_blank=True)
    tipo_usuario = serializers.ChoiceField(choices=User.TIPO_CHOICES, default='CLIENTE')

    # Campos novos opcionais
    descricao = serializers.CharField(required=False, allow_blank=True)
    endereco = serializers.CharField(required=False, allow_blank=True)
    bairro = serializers.CharField(required=False, allow_blank=True)
    cidade = serializers.CharField(required=False, allow_blank=True)

    # --- NOVOS CAMPOS CALCULADOS (REPUTAÇÃO) ⭐ ---
    nota_media = serializers.SerializerMethodField()
    total_avaliacoes = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'password', 'password_confirm', 
            'nome_completo', 'telefone', 'tipo_usuario', 'foto', 'capa',
            'descricao', 'endereco', 'bairro', 'cidade',
            'nota_media', 'total_avaliacoes' # <--- Adicionados aqui
        ) 
        extra_kwargs = {
            'username': {
                'validators': [UniqueValidator(queryset=User.objects.all(), message="Este nome de usuário já está em uso.")]
            }
        }

    # Calcula a média das notas
    def get_nota_media(self, obj):
        # Import local para evitar erro de ciclo
        from agendamentos.models import Avaliacao
        
        # Filtra avaliações de agendamentos cujos serviços pertencem a este usuário (empreendedor)
        # O distinct() é importante caso o agendamento tenha 2 serviços do mesmo dono
        media = Avaliacao.objects.filter(agendamento__servicos__criado_por=obj).distinct().aggregate(Avg('nota'))
        
        resultado = media['nota__avg']
        return round(resultado, 1) if resultado else None

    # Conta quantas avaliações existem
    def get_total_avaliacoes(self, obj):
        from agendamentos.models import Avaliacao
        return Avaliacao.objects.filter(agendamento__servicos__criado_por=obj).distinct().count()

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "As senhas não correspondem."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            nome_completo=validated_data.get('nome_completo', ''),
            telefone=validated_data.get('telefone', ''),
            tipo_usuario=validated_data.get('tipo_usuario', 'CLIENTE'),
            foto=validated_data.get('foto'),
            capa=validated_data.get('capa'),
            descricao=validated_data.get('descricao', ''),
            endereco=validated_data.get('endereco', ''),
            bairro=validated_data.get('bairro', ''),
            cidade=validated_data.get('cidade', '')
        )
        return user

# --- 2. SERIALIZER DE ATUALIZAÇÃO ---
class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'nome_completo', 'telefone', 
            'foto', 'capa', 'tipo_usuario',
            'descricao', 'endereco', 'bairro', 'cidade'
        )
        read_only_fields = ('username', 'email', 'tipo_usuario')

# --- 3. SERIALIZER DE LOGIN ---
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        data['id'] = self.user.id
        data['username'] = self.user.username
        data['nome_completo'] = getattr(self.user, 'nome_completo', '')
        data['tipo_usuario'] = getattr(self.user, 'tipo_usuario', 'CLIENTE')
        
        if self.user.foto:
            data['foto'] = self.user.foto.url
        else:
            data['foto'] = None
            
        return data