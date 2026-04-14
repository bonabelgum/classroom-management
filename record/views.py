from django.shortcuts import render,redirect
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.contrib.auth import authenticate, login as auth_login
from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout
import json
from record.models import ClassRoom
from django.views.decorators.http import require_http_methods
from .models import Student, ClassRoom

def home(request):
    return redirect('login')

#LOGIN
def login(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")

        user = authenticate(request, username=username, password=password)

        if user is not None:
            auth_login(request, user)  # logs user in
            return JsonResponse({
                "status": "success",
                "redirect": "/main_page/"
            })
        else:
            return JsonResponse({
                "status": "error",
                "message": "Invalid username or password"
            })

    return render(request, 'login.html')

#LOGOUT
@login_required(login_url='login')
def logout_view(request):
    logout(request)  # logs the user out
    return redirect('login')




#SIGNUP
def signup(request):
    if request.method == "POST":
        username = request.POST.get("username")
        email = request.POST.get("email")
        password1 = request.POST.get("password1")
        password2 = request.POST.get("password2")

        if User.objects.filter(username=username).exists():
            return JsonResponse({
                "status": "error",
                "message": "Username already exists"
            })

        if User.objects.filter(email=email).exists():
            return JsonResponse({
                "status": "error",
                "message": "Email already exists"
            })

        if password1 != password2:
            return JsonResponse({
                "status": "error",
                "message": "Passwords do not match"
            })

        User.objects.create_user(
            username=username,
            email=email,
            password=password1
        )

        return JsonResponse({
            "status": "success",
            "message": "Account created successfully!"
        })

    return render(request, 'signup.html')





#main page
@login_required(login_url='login')
def main_page(request):
    return render(request, 'dashboard.html')




#dashboard
@login_required(login_url='login')
def dashboard(request):
    return render(request, 'dashboard.html')




#classroom
@login_required(login_url='login')
def classroom(request):
    classes_qs = ClassRoom.objects.filter(user=request.user)

    classes = []

    for cls in classes_qs:
        students = list(
            Student.objects.filter(classroom=cls)
            .values("id", "first_name", "last_name")
        )

        classes.append({
            "id": cls.id,
            "name": cls.name,
            "year": cls.year,
            "room": cls.room,
            "schedule": cls.schedule,
            "description": cls.description,
            "students": students
        })

    return render(request, 'classroom.html', {'classes': classes})
#save classroom
@login_required(login_url='login')
def save_classroom(request):
    if request.method == "POST":
        data = json.loads(request.body)

        classroom = ClassRoom.objects.create(
            user=request.user,
            name=data.get('name'),
            year=data.get('year'),
            room=data.get('room'),
            schedule=data.get('schedule'),
            description=data.get('description')
        )

        return JsonResponse({
            "id": classroom.id,
            "name": classroom.name,
            "year": classroom.year,
            "schedule": classroom.schedule,
            "room": classroom.room,
            "description": classroom.description
        })
#delete classroom
@require_http_methods(["DELETE"])
@login_required(login_url='login')
def delete_classroom(request, id):
    try:
        classroom = ClassRoom.objects.get(id=id, user=request.user)
        classroom.delete()

        return JsonResponse({
            "success": True,
            "message": "Class deleted"
        })

    except ClassRoom.DoesNotExist:
        return JsonResponse({
            "success": False,
            "message": "Not found"
        }, status=404)
#editing classroom
@require_http_methods(["PUT"])
@login_required(login_url='login')
def update_classroom(request, id):
    data = json.loads(request.body)

    classroom = ClassRoom.objects.get(id=id, user=request.user)

    classroom.name = data.get("name")
    classroom.year = data.get("year")
    classroom.room = data.get("room")
    classroom.schedule = data.get("schedule")
    classroom.description = data.get("description")
    classroom.save()

    return JsonResponse({
        "id": classroom.id,
        "name": classroom.name,
        "year": classroom.year,
        "room": classroom.room,
        "schedule": classroom.schedule,
        "description": classroom.description
    })
#enroll student
@login_required(login_url='login')
@require_http_methods(["POST"])
def save_student(request):
    data = json.loads(request.body)

    classroom_id = data.get("classroom_id")
    first_name = data.get("first_name")
    last_name = data.get("last_name")

    try:
        classroom = ClassRoom.objects.get(id=classroom_id, user=request.user)
    except ClassRoom.DoesNotExist:
        return JsonResponse({"error": "Class not found"}, status=404)

    student = Student.objects.create(
        classroom=classroom,
        first_name=first_name,
        last_name=last_name
    )

    return JsonResponse({
        "id": student.id,
        "first_name": student.first_name,
        "last_name": student.last_name
    })
#update student
@require_http_methods(["PUT"])
@login_required(login_url='login')
def update_student(request, id):
    data = json.loads(request.body)

    student = Student.objects.get(id=id, classroom__user=request.user)

    student.first_name = data.get("first_name")
    student.last_name = data.get("last_name")
    student.save()

    return JsonResponse({
        "id": student.id,
        "first_name": student.first_name,
        "last_name": student.last_name
    })
#delete student
@require_http_methods(["DELETE"])
@login_required(login_url='login')
def delete_student(request, id):
    try:
        student = Student.objects.get(id=id, classroom__user=request.user)
        student.delete()

        return JsonResponse({"success": True})

    except Student.DoesNotExist:
        return JsonResponse({"error": "Not found"}, status=404)



#attendance
@login_required(login_url='login')
def attendance(request):
    return render(request, 'attendance.html')

#schedule
@login_required(login_url='login')
def schedule(request):
    return render(request, 'schedule.html')