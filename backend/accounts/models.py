from django.contrib.auth.models import AbstractUser
from django.db import models


class Branch(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, unique=True)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Admin'
        COLLECTION_AGENT = 'COLLECTION_AGENT', 'Collection Agent'
        BRANCH_MANAGER = 'BRANCH_MANAGER', 'Branch Manager'

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.COLLECTION_AGENT)
    branch = models.ForeignKey(
        Branch, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='users',
        help_text='Branch assignment for agents and managers'
    )
    phone = models.CharField(max_length=15, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['username']

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN

    @property
    def is_collection_agent(self):
        return self.role == self.Role.COLLECTION_AGENT

    @property
    def is_branch_manager(self):
        return self.role == self.Role.BRANCH_MANAGER
