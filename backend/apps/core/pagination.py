"""Pagination utilities

Spec reference: <phase1.md section> | core pagination

Responsibilities (TODO):
    - [ ] default PageNumberPagination subclass
"""
from rest_framework.pagination import PageNumberPagination


class DefaultPagination(PageNumberPagination):
    page_size = 10
