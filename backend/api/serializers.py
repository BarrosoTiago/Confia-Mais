from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer para o registro de novos usuários.
    """
    
    # 1. Define o campo de e-mail com validação de unicidade
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all(), message="Este e-mail já está em uso.")]
    )
    
    # 2. Define o campo de senha apenas para escrita
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        min_length=8,
        style={'input_type': 'password'},
        label="Senha"
    )
    
    # 3. Define o campo de confirmação de senha apenas para escrita
    password_confirm = serializers.CharField(
        write_only=True, 
        required=True, 
        style={'input_type': 'password'},
        label="Confirmação de Senha"
    )

    class Meta:
        model = User
        # 4. Lista os campos que o serializer vai aceitar e validar
        fields = ('username', 'email', 'password', 'password_confirm') 
        extra_kwargs = {
            'username': {
                'validators': [UniqueValidator(queryset=User.objects.all(), message="Este nome de usuário já está em uso.")]
            }
        }

    def validate(self, attrs):
        """
        # 5. Validação de nível de objeto (para comparar campos)
        """
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "As senhas não correspondem."})
        return attrs

    def create(self, validated_data):
        # 6. Lógica de criação do objeto (com hash de senha)
        validated_data.pop('password_confirm')
        
        # Usa o método create_user para salvar a senha com hash
        user = User.objects.create_user(**validated_data)

        #Define o email explicitamente
        user.email = validated_data['email']
        user.save()
        
        return user