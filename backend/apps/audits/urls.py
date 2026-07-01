from django.urls import path
from . import views

urlpatterns = [
    path('', views.MonthlyAuditListView.as_view(), name='audits'),
    path('<int:pk>/settle/', views.SettlePaymentView.as_view(), name='audit-settle'),
]
