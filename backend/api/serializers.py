from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.contrib.auth import get_user_model
# Importação nova necessária para customizar o Login:
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer 

User = get_user_model() 

# --- SERIALIZER DE CADASTRO (O QUE VOCÊ JÁ TINHA) ---
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

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'password_confirm', 'nome_completo', 'telefone', 'tipo_usuario') 
        extra_kwargs = {
            'username': {
                'validators': [UniqueValidator(queryset=User.objects.all(), message="Este nome de usuário já está em uso.")]
            }
        }

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
            tipo_usuario=validated_data.get('tipo_usuario', 'CLIENTE')
        )
        return user

# --- NOVO: SERIALIZER DE LOGIN CUSTOMIZADO ---
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Estende o serializer padrão de login do JWT para retornar 
    dados extras além do token (como o tipo de usuário).
    """
    def validate(self, attrs):
        # 1. Gera os tokens padrão (access e refresh)
        data = super().validate(attrs)
        
        # 2. Adiciona dados extras na resposta JSON que o React vai ler
        data['id'] = self.user.id
        data['username'] = self.user.username
        data['nome_completo'] = getattr(self.user, 'nome_completo', '')
        data['tipo_usuario'] = getattr(self.user, 'tipo_usuario', 'CLIENTE')
        
        return data