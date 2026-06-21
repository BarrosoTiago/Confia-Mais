# iot/migrations/0002_pagamento_dividido.py
#
# Migration para os campos novos: valor_total_esperado e
# valor_acumulado em AtendimentoAtivo, e o novo model ParcelaPagamento.
#
# Ajuste o nome da migration anterior em "dependencies" conforme
# o histórico real do seu projeto.

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("iot", "0001_initial"),          # ajuste ao nome real da sua primeira migration
        ("financeiro", "0001_initial"),   # ajuste ao app/migration real de Transacao
    ]

    operations = [
        migrations.AddField(
            model_name="atendimentoativo",
            name="valor_total_esperado",
            field=models.DecimalField(
                max_digits=10, decimal_places=2, null=True, blank=True,
                help_text="Preço do serviço. Null = modo livre (sem total definido).",
            ),
        ),
        migrations.AddField(
            model_name="atendimentoativo",
            name="valor_acumulado",
            field=models.DecimalField(
                max_digits=10, decimal_places=2, default=0,
                help_text="Soma das parcelas já registradas para este atendimento.",
            ),
        ),
        migrations.CreateModel(
            name="ParcelaPagamento",
            fields=[
                ("id", models.BigAutoField(
                    auto_created=True, primary_key=True,
                    serialize=False, verbose_name="ID",
                )),
                ("forma_pagamento", models.CharField(
                    max_length=10,
                    choices=[
                        ("PIX", "Pix"),
                        ("CARTAO", "Cartão"),
                        ("DINHEIRO", "Dinheiro"),
                        ("FIADO", "Fiado"),
                    ],
                )),
                ("valor", models.DecimalField(max_digits=10, decimal_places=2)),
                ("registrado_em", models.DateTimeField(auto_now_add=True)),
                ("transacao", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="parcelas",
                    to="financeiro.transacao",  # ajuste ao app real
                )),
            ],
        ),
    ]