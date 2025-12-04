"""
WSGI config for veterinaria_pochita project.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'veterinaria_pochita.settings')

application = get_wsgi_application()

