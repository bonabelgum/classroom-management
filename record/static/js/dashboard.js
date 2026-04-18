document.addEventListener("DOMContentLoaded", () => {
    loadReminders();

    fetch('/dashboard-stats/')
        .then(res => res.json())
        .then(data => {
            document.getElementById("totalClasses").textContent = data.classes;
            document.getElementById("totalStudents").textContent = data.students;
        });

    //top students
    fetch('/dashboard-top-students/')
        .then(res => res.json())
        .then(data => {

            const container = document.getElementById("topStudentsList");

            container.innerHTML = data.map((s, index) => `
                <div class="top-student-card">

                    <div>
                        <div class="fw-semibold">${index + 1}. ${s.name}</div>
                        <div class="small text-muted">${s.class}</div>
                    </div>

                    <div class="grade-badge">
                        ${s.grade}
                    </div>

                </div>
            `).join("");

        });
});
function loadReminders() {
    fetch("/upcoming-events/")
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById("reminderList");
            container.innerHTML = "";

            if (data.events.length === 0) {
                container.innerHTML = `<div class="empty">No upcoming events</div>`;
                return;
            }

            data.events.forEach(event => {
                const item = document.createElement("div");
                item.classList.add("reminder-item");

                item.innerHTML = `
                    <div class="reminder-icon">📅</div>
                    <div class="reminder-content">
                        <div class="title">${event.title}</div>
                        <div class="date">${event.date}</div>
                    </div>
                `;

                container.appendChild(item);
            });
        });
}