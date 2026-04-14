from django.db import models
from django.contrib.auth.models import User
import uuid

class Record(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
class ClassRoom(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    year = models.CharField(max_length=50, blank=True)
    room = models.CharField(max_length=100, blank=True)
    schedule = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name
class Student(models.Model):
    student_uid = models.UUIDField(default=uuid.uuid4, editable=False)
    classroom = models.ForeignKey(ClassRoom, on_delete=models.CASCADE)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)