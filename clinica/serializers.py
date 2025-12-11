from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Patient, Appointment, PatientFile

class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = '__all__'
        read_only_fields = ('therapist',)

class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = '__all__'
        read_only_fields = ('therapist',)

class PatientFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientFile
        fields = '__all__'
        read_only_fields = ('uploaded_at',)

# -----------------------------------------------------------
# NUEVO SERIALIZADOR DE REGISTRO - ¡ESTO ES LO QUE FALTABA! 👇
# -----------------------------------------------------------

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('username', 'password', 'email')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user