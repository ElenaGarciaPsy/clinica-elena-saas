from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
# 👇 AQUÍ AÑADIMOS RegisterView AL FINAL DE LA LISTA
from clinica.views import PatientViewSet, AppointmentViewSet, PatientFileViewSet, RegisterView 
from rest_framework.authtoken.views import obtain_auth_token

router = DefaultRouter()
router.register(r'patients', PatientViewSet)
router.register(r'appointments', AppointmentViewSet)
router.register(r'files', PatientFileViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api-token-auth/', obtain_auth_token),
    
    # 👇 AQUÍ AÑADIMOS LA RUTA NUEVA
    path('api/register/', RegisterView.as_view(), name='register'),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)