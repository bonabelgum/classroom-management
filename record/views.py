from django.shortcuts import render,redirect
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.contrib.auth import authenticate, login as auth_login
from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout
import json
from record.models import ClassRoom
from django.views.decorators.http import require_http_methods
from .models import ActivityScore, Student, ClassRoom, Activity, CalendarEvent
import uuid
from django.views.decorators.csrf import csrf_exempt
from datetime import datetime,timedelta
from django.shortcuts import render
from django.utils import timezone

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
            .values("id", "first_name", "last_name", "student_uid")
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
    extra_class_ids = data.get("extra_class_ids", []) 

    try:
        classroom = ClassRoom.objects.get(id=classroom_id, user=request.user)
    except ClassRoom.DoesNotExist:
        return JsonResponse({"error": "Class not found"}, status=404)

    # ✅ CREATE ONE UNIQUE ID FOR THIS PERSON
    student_uid = uuid.uuid4()

    # ✅ MAIN CLASS
    student = Student.objects.create(
        classroom=classroom,
        first_name=first_name,
        last_name=last_name,
        student_uid=student_uid
    )

    # ✅ EXTRA CLASSES (same UID)
    for class_id in extra_class_ids:
        try:
            extra_class = ClassRoom.objects.get(id=class_id, user=request.user)

            Student.objects.create(
                classroom=extra_class,
                first_name=first_name,
                last_name=last_name,
                student_uid=student_uid
            )
        except ClassRoom.DoesNotExist:
            continue

    return JsonResponse({
        "id": student.id,
        "first_name": student.first_name,
        "student_uid": str(student.student_uid),
        "last_name": student.last_name
    })
#update student
@require_http_methods(["PUT"])
@login_required(login_url='login')
def update_student(request, id):
    data = json.loads(request.body)

    student = Student.objects.get(id=id, classroom__user=request.user)

    Student.objects.filter(
        student_uid=student.student_uid,
        classroom__user=request.user
    ).update(
        first_name=data.get("first_name"),
        last_name=data.get("last_name")
    )

    return JsonResponse({
        "id": student.id,
        "student_uid": str(student.student_uid),
        "first_name": data.get("first_name"),
        "last_name": data.get("last_name")
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
#add acts
@csrf_exempt
def save_activity(request):
    if request.method == "POST":
        data = json.loads(request.body)

        classroom = ClassRoom.objects.get(id=data["classroom_id"])

        activity = Activity.objects.create(
            classroom=classroom,
            name=data["name"],
            type=data["type"],
            points=data["points"],
            period=data["period"],
            term=data["term"]
        )

        return JsonResponse({
            "id": activity.id,
            "name": activity.name,
            "type": activity.type,
            "points": activity.points,
            "period": activity.period,
            "term": activity.term
        })
def get_activities(request, class_id, term):
    activities = Activity.objects.filter(
        classroom_id=class_id,
        term=term
    ).values("id", "name", "type", "points", "period")

    return JsonResponse(list(activities), safe=False)
#del acts
@csrf_exempt
def delete_activity(request, activity_id):
    if request.method == "POST":
        try:
            activity = Activity.objects.get(id=activity_id)
            activity.delete()
            return JsonResponse({"success": True})
        except Activity.DoesNotExist:
            return JsonResponse({"success": False})
#populate acts student table
@login_required(login_url='login')
def get_activity_students(request, activity_id):
    try:
        activity = Activity.objects.get(id=activity_id, classroom__user=request.user)

        students = Student.objects.filter(classroom=activity.classroom)

        result = []

        for student in students:
            score_obj = ActivityScore.objects.filter(
                activity=activity,
                student=student
            ).first()

            result.append({
                "student_id": student.id,
                "name": f"{student.first_name} {student.last_name}",
                "score": score_obj.score if score_obj else None
            })

        return JsonResponse(result, safe=False)

    except Activity.DoesNotExist:
        return JsonResponse([], safe=False)
@csrf_exempt
@login_required(login_url='login')
def save_activity_scores(request, activity_id):
    if request.method == "POST":
        try:
            data = json.loads(request.body)

            activity = Activity.objects.get(
                id=activity_id,
                classroom__user=request.user
            )

            # update activity details
            activity.name = data.get("name", activity.name)
            activity.type = data.get("type", activity.type)
            activity.points = data.get("points", activity.points)
            activity.save()
            # EXISTING LOOP
            for item in data["scores"]:
                student_id = item.get("student_id")
                score = item.get("score")

                if not student_id:
                    continue

                try:
                    student = Student.objects.get(id=student_id)
                except Student.DoesNotExist:
                    continue

                ActivityScore.objects.update_or_create(
                    activity=activity,
                    student=student,
                    defaults={"score": score}
                )

            return JsonResponse({"success": True})

        except Exception as e:
            return JsonResponse({
                "success": False,
                "error": str(e)
            }, status=400) 
@login_required(login_url='login')
def get_student_activities(request, student_id):
    try:
        student = Student.objects.get(id=student_id)
        activities = Activity.objects.filter(classroom=student.classroom)
        result = []
        for act in activities:
            score_obj = ActivityScore.objects.filter(
                activity=act,
                student=student
            ).first()

            result.append({
                "id": act.id,
                "name": act.name,
                "type": act.type,
                "points": act.points,
                "term": act.term,
                "score": score_obj.score if score_obj else None
            })

        return JsonResponse(result, safe=False)

    except Student.DoesNotExist:
        return JsonResponse([], safe=False)




#attendance
@login_required(login_url='login')
def attendance(request):
    classrooms = ClassRoom.objects.filter(user=request.user)

    return render(request, 'attendance.html', {
        'classrooms': classrooms
    })
@login_required(login_url='login')
def get_students(request, class_id):
    try:
        classroom = ClassRoom.objects.get(id=class_id, user=request.user)
    except ClassRoom.DoesNotExist:
        return JsonResponse({'error': 'Class not found'}, status=404)

    students = Student.objects.filter(classroom=classroom)

    data = []
    for s in students:
        data.append({
            'id': str(s.student_uid),
            'name': f"{s.first_name} {s.last_name}"
        })

    return JsonResponse({'students': data})




#schedule
@login_required(login_url='login')
def schedule(request):
    return render(request, 'schedule.html')
# Get events
@login_required
def get_events(request):
    events = CalendarEvent.objects.filter(user=request.user)
    data = {}
    for event in events:
        date_str = event.date.strftime("%Y-%m-%d")
        if date_str not in data:
            data[date_str] = []
        data[date_str].append({"id": event.id, "title": event.title})
    return JsonResponse(data)

# Add event
@login_required
@csrf_exempt
def add_event(request):
    if request.method == "POST":
        body = json.loads(request.body)
        title = body.get("title")
        date_str = body.get("date")
        if not title or not date_str:
            return JsonResponse({"status": "error", "message": "Missing fields"}, status=400)

        date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
        event = CalendarEvent.objects.create(user=request.user, title=title, date=date_obj)
        return JsonResponse({"status": "success", "id": event.id})
# Delete event
@login_required
@csrf_exempt
def delete_event(request):
    if request.method == "POST":
        body = json.loads(request.body)
        event_id = body.get("id")
        try:
            event = CalendarEvent.objects.get(id=event_id, user=request.user)
            event.delete()
            return JsonResponse({"status": "success"})
        except CalendarEvent.DoesNotExist:
            return JsonResponse({"status": "error", "message": "Event not found"}, status=404)
#upcoming event
@login_required(login_url='login')
def upcoming_events(request):
    today = timezone.now().date()
    end_date = today + timedelta(days=14)

    events = CalendarEvent.objects.filter(
        user=request.user,
        date__range=[today, end_date]
    ).order_by('date')

    data = [
        {
            "title": e.title,
            "date": e.date.strftime("%b %d, %Y"),
        }
        for e in events
    ]

    return JsonResponse({"events": data})