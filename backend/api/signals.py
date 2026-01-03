from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from django_rest_passwordreset.signals import reset_password_token_created

@receiver(reset_password_token_created)
def password_reset_token_created(sender, instance, reset_password_token, *args, **kwargs):
    """
    Dispara o e-mail com o Token quando o usuário pede para recuperar senha.
    """
    
    # O Token que o usuário vai digitar no site
    token = reset_password_token.key
    
    assunto = "🔑 Recuperação de Senha - Confia +"
    mensagem = (
        f"Olá, {reset_password_token.user.username}!\n\n"
        f"Recebemos um pedido para redefinir sua senha.\n"
        f"Seu código de autorização é:\n\n"
        f"{token}\n\n"
        f"Volte ao site e digite este código junto com sua nova senha.\n"
        f"Se não foi você, ignore este e-mail."
    )

    send_mail(
        subject=assunto,
        message=mensagem,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[reset_password_token.user.email],
        fail_silently=False,
    )
    print(f"📧 Token de recuperação enviado para: {reset_password_token.user.email}")