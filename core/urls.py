from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token
# Importamos TODAS las vistas (incluyendo la nueva UserProfileView)
from clinica.views import PatientViewSet, AppointmentViewSet, PatientFileViewSet, RegisterView, UserProfileView

# Configuración del Router (URLs automáticas)
router = DefaultRouter()
router.register(r'patients', PatientViewSet)
router.register(r'appointments', AppointmentViewSet)
router.register(r'files', PatientFileViewSet)

# Lista de URLs manuales
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api-token-auth/', obtain_auth_token),
    
    # Nuevas rutas para Registro y Perfil
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/profile/', UserProfileView.as_view(), name='profile'),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)