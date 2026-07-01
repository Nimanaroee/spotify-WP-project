"""Preliminary schema — refine once the official Phase 2 backend spec is released.

SupportTicket and TicketMessage models
"""
from django.db import models


class SupportTicket(models.Model):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    subject = models.CharField(max_length=200)
    status = models.CharField(max_length=50, default='open')


class TicketMessage(models.Model):
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE)
    sender = models.ForeignKey('users.User', on_delete=models.CASCADE)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
