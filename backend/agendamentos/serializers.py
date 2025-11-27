from rest_framework import serializers # <--- Essa é a linha que estava faltando
from .models import Agendamento, HorarioFuncionamento 
from servicos.models import Servico
from datetime import timedelta
from django.utils import timezone

class AgendamentoSerializer(serializers.ModelSerializer):
    servicos = serializers.PrimaryKeyRelatedField(
        queryset=Servico.objects.all(), 
        many=True
    )

    class Meta:
        model = Agendamento
        fields = '__all__'
        # Mantemos data_hora_fim como leitura (calculado)
        read_only_fields = ('data_hora_fim',) 
        
        # --- A CORREÇÃO PARA O CLIENTE CONSEGUIR AGENDAR ---
        # Torna o campo 'cliente' opcional na entrada (Frontend não precisa mandar)
        # A View se encarrega de preencher com o usuário logado.
        extra_kwargs = {
            'cliente': {'required': False}
        }

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['servicos_detalhes'] = [
            {"id": s.id, "nome": s.nome, "preco": s.preco} for s in instance.servicos.all()
        ]
        try:
            representation['cliente_nome'] = instance.cliente.nome_completo or instance.cliente.username
            representation['cliente_telefone'] = instance.cliente.telefone or ""
        except:
            representation['cliente_nome'] = "Desconhecido"
            representation['cliente_telefone'] = ""
        return representation

    def validate(self, attrs):
        inicio = attrs.get('data_hora_inicio')
        servicos_selecionados = attrs.get('servicos')
        
        # 1. Validação de Data no Passado
        if self.instance:
            if self.instance.data_hora_inicio != inicio and inicio < timezone.now():
                 raise serializers.ValidationError({"data_hora_inicio": "Não é possível remarcar para o passado."})
        elif inicio < timezone.now():
             raise serializers.ValidationError({"data_hora_inicio": "Não é possível agendar para o passado."})

        # 2. Resolver Serviços
        if not servicos_selecionados and self.instance:
             servicos_selecionados = self.instance.servicos.all()
             
        if not servicos_selecionados:
             raise serializers.ValidationError({"servicos": "Selecione pelo menos um serviço."})

        duracao_total = sum([s.duracao_minutos for s in servicos_selecionados])
        fim = inicio + timedelta(minutes=duracao_total)

        # 3. Validação de Horário (BLINDADA)
        if servicos_selecionados:
            primeiro_servico = servicos_selecionados[0]
            dono_servico = primeiro_servico.criado_por 

            if dono_servico:
                dia_semana = inicio.weekday()
                try:
                    regra = HorarioFuncionamento.objects.get(dia_semana=dia_semana, usuario=dono_servico)
                    
                    if regra.fechado:
                        raise serializers.ValidationError({
                            "data_hora_inicio": f"Fechado na {regra.get_dia_semana_display()}."
                        })

                    hora_inicio = inicio.time()
                    hora_fim = fim.time()

                    if hora_inicio < regra.horario_abertura or hora_fim > regra.horario_fechamento:
                        raise serializers.ValidationError({
                            "data_hora_inicio": f"Horário inválido. Atendimento das {regra.horario_abertura.strftime('%H:%M')} às {regra.horario_fechamento.strftime('%H:%M')}."
                        })

                except HorarioFuncionamento.DoesNotExist:
                    raise serializers.ValidationError({
                        "data_hora_inicio": "O estabelecimento ainda não configurou os horários para este dia."
                    })
            else:
                pass 

        # 4. Conflitos
        conflitos = Agendamento.objects.filter(
            data_hora_inicio__lt=fim,
            data_hora_fim__gt=inicio,
            status__in=['PENDENTE', 'CONFIRMADO'] 
        )

        if self.instance:
            conflitos = conflitos.exclude(id=self.instance.id)

        if conflitos.exists():
            raise serializers.ValidationError({"data_hora_inicio": "Este horário já está ocupado."})

        attrs['data_hora_fim'] = fim
        
        return attrs

class HorarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = HorarioFuncionamento
        fields = '__all__'
        read_only_fields = ('usuario',)

    def validate(self, attrs):
        user = self.context['request'].user
        dia = attrs.get('dia_semana')

        if not self.instance:
            if HorarioFuncionamento.objects.filter(usuario=user, dia_semana=dia).exists():
                raise serializers.ValidationError({"dia_semana": "Dia já configurado. Atualize a página."})
        return attrs