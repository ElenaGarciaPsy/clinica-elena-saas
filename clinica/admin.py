from django.contrib import admin
from .models import Patient, Appointment, Invoice

# Esto hace que aparezcan en el panel de control
admin.site.register(Patient)
admin.site.register(Appointment)
admin.site.register(Invoice)