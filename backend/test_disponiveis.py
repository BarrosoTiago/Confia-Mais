import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from agendamentos.views import HorarioDisponivelView
from django.test import RequestFactory
factory = RequestFactory()
request = factory.get('/api/agendamentos/disponiveis/', {'data': '2026-06-26', 'empreendedor_id': 7})
view = HorarioDisponivelView.as_view()
response = view(request)
print('STATUS:', response.status_code)
