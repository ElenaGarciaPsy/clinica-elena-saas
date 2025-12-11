from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Patient(models.Model):
    therapist = models.ForeignKey(User, on_delete=models.CASCADE)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class Appointment(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pendiente'),
        ('CONFIRMED', 'Confirmada'),
        ('COMPLETED', 'Realizada'),
        ('CANCELLED', 'Cancelada'),
    ]
    therapist = models.ForeignKey(User, on_delete=models.CASCADE)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    is_online = models.BooleanField(default=False)

class Invoice(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    appointment = models.OneToOneField(Appointment, on_delete=models.SET_NULL, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    issue_date = models.DateField(default=timezone.now)
    invoice_number = models.CharField(max_length=50, unique=True)
    is_ticketbai_reported = models.BooleanField(default=False)

class PatientFile(models.Model):
    patient = models.ForeignKey(Patient, related_name='files', on_delete=models.CASCADE)
    file = models.FileField(upload_to='patient_files/')
    name = models.CharField(max_length=255, blank=True) # Nombre del archivo (ej: "Radiografía")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Archivo de {self.patient}"