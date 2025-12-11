from rest_framework import viewsets, permissions
from .models import Patient, Appointment, PatientFile
from .serializers import PatientSerializer, AppointmentSerializer, PatientFileSerializer

# -----------------------------------------------------------
# VISTAS MULTI-USUARIO (SaaS)
# -----------------------------------------------------------

class PatientViewSet(viewsets.ModelViewSet):
    """
    Lista todos los pacientes y solo permite ver/editar los propios.
    """
    queryset = Patient.objects.all().order_by('-last_name')
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]

    # ** CAMBIO CLAVE 1: FILTRAR POR EL USUARIO ACTUAL (Multi-tenancy) **
    def get_queryset(self):
        return self.queryset.filter(therapist=self.request.user)

    # ** CAMBIO CLAVE 2: ASIGNAR EL USUARIO AL CREAR UN NUEVO PACIENTE **
    def perform_create(self, serializer):
        serializer.save(therapist=self.request.user)


class AppointmentViewSet(viewsets.ModelViewSet):
    """
    Lista las citas y solo permite ver/editar las citas propias.
    """
    queryset = Appointment.objects.all().order_by('start_time')
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    # ** CAMBIO CLAVE 3: FILTRAR POR EL USUARIO ACTUAL **
    def get_queryset(self):
        return self.queryset.filter(therapist=self.request.user)

    # ** CAMBIO CLAVE 4: ASIGNAR EL USUARIO AL CREAR UNA NUEVA CITA **
    def perform_create(self, serializer):
        patient_id = self.request.data.get('patient')
        patient = Patient.objects.get(pk=patient_id)
        # Aseguramos que el paciente pertenezca a este terapeuta antes de crear la cita
        if patient.therapist != self.request.user:
             raise permissions.PermissionDenied("No tienes permiso para agendar citas para este paciente.")

        serializer.save(therapist=self.request.user)


class PatientFileViewSet(viewsets.ModelViewSet):
    """
    Permite subir y listar archivos de pacientes, filtrando por el terapeuta.
    """
    queryset = PatientFile.objects.all()
    serializer_class = PatientFileSerializer
    permission_classes = [permissions.IsAuthenticated]

    # ** CAMBIO CLAVE 5: FILTRAR POR PACIENTES DEL USUARIO ACTUAL **
    def get_queryset(self):
        # Filtra los archivos por los pacientes que pertenecen al usuario actual
        user_patients = Patient.objects.filter(therapist=self.request.user)
        return self.queryset.filter(patient__in=user_patients)

    # ** CAMBIO CLAVE 6: ASIGNAR EL USUARIO AL CREAR UN NUEVO ARCHIVO **
    def perform_create(self, serializer):
        patient_id = self.request.data.get('patient')
        patient = Patient.objects.get(pk=patient_id)
        # Aseguramos que el paciente pertenezca a este terapeuta antes de subir el archivo
        if patient.therapist != self.request.user:
             raise permissions.PermissionDenied("No tienes permiso para subir archivos a este paciente.")
        
        serializer.save()