from rest_framework import serializers
from .models import Patient, Appointment, Invoice

class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = '__all__'  # ¡Traduce todos los campos!

class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = '__all__'

class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = '__all__'

from .models import Patient, Appointment, PatientFile # <--- Asegúrate de importar PatientFile aquí arriba también

class PatientFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientFile
        fields = '__all__'