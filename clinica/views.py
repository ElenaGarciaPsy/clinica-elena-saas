from rest_framework import viewsets, permissions, generics
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from .models import Patient, Appointment, PatientFile
# 👇 AQUÍ AÑADIMOS RegisterSerializer
from .serializers import PatientSerializer, AppointmentSerializer, PatientFileSerializer, RegisterSerializer, UserSerializer

# -----------------------------------------------------------
# VISTAS MULTI-USUARIO (SaaS) - ESTO YA LO TENÍAS
# -----------------------------------------------------------

# ... tus otras vistas ...

# Vista para VER y EDITAR el perfil del usuario logueado
class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # Devuelve el usuario que está haciendo la petición (self.request.user)
        return self.request.user

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all().order_by('-last_name')
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(therapist=self.request.user)

    def perform_create(self, serializer):
        serializer.save(therapist=self.request.user)


class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all().order_by('start_time')
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(therapist=self.request.user)

    def perform_create(self, serializer):
        patient_id = self.request.data.get('patient')
        patient = Patient.objects.get(pk=patient_id)
        if patient.therapist != self.request.user:
             raise permissions.PermissionDenied("No tienes permiso para agendar citas para este paciente.")
        serializer.save(therapist=self.request.user)


class PatientFileViewSet(viewsets.ModelViewSet):
    queryset = PatientFile.objects.all()
    serializer_class = PatientFileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user_patients = Patient.objects.filter(therapist=self.request.user)
        return self.queryset.filter(patient__in=user_patients)

    def perform_create(self, serializer):
        patient_id = self.request.data.get('patient')
        patient = Patient.objects.get(pk=patient_id)
        if patient.therapist != self.request.user:
             raise permissions.PermissionDenied("No tienes permiso para subir archivos a este paciente.")
        serializer.save()

# -----------------------------------------------------------
# NUEVA VISTA DE REGISTRO - ¡ESTO ES LO QUE FALTABA! 👇
# -----------------------------------------------------------

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,) # Permitir entrar a cualquiera para registrarse
    serializer_class = RegisterSerializer