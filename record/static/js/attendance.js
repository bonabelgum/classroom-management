let currentStudents = [];
let currentPeriod = "prelim";
let takingAttendance = false;
let currentClassId = null;
//take attendance
let attendanceStartTime = null;
let currentSessionId = null;

document.addEventListener("DOMContentLoaded", function () {

    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[title]'));
    tooltipTriggerList.forEach(el => new bootstrap.Tooltip(el));

    //first table populate

    const classSection = document.getElementById("classTableSection");
    const studentSection = document.getElementById("studentTableSection");

    const classRows = document.querySelectorAll(".clickable-row");

    classRows.forEach(row => {
        row.addEventListener("click", function () {
            currentClassId = this.dataset.classId;

            console.log("Selected class:", currentClassId);

            loadStudents(currentClassId); // load students

            classSection.style.display = "none";
            studentSection.style.display = "block";
        });
    });
    //---

    const backBtn = document.getElementById("backBtn");

    // BACK BUTTON
    backBtn.addEventListener("click", function () {
        studentSection.style.display = "none";
        classSection.style.display = "block";
    });

    // SEARCH FUNCTION (CLASS TABLE)
    document.getElementById("searchClass").addEventListener("keyup", function () {
        searchTable("searchClass", "classTable");
    });

    // SEARCH FUNCTION (STUDENT TABLE)
    document.getElementById("searchStudent").addEventListener("keyup", function () {
        searchTable("searchStudent", "studentTable");
    });

    //atendance tabs
    document.querySelectorAll("#attendanceTabs .nav-link").forEach(tab => {
        tab.addEventListener("click", function () {
            
            document.querySelectorAll("#attendanceTabs .nav-link").forEach(t => t.classList.remove("active"));
            this.classList.add("active");

            currentPeriod = this.dataset.period;
            loadStudents(currentClassId);
        });
    });

});

// SEARCH FUNCTION
function searchTable(inputId, tableId) {
    const input = document.getElementById(inputId).value.toLowerCase();
    const rows = document.querySelectorAll(`#${tableId} tbody tr`);

    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(input) ? "" : "none";
    });
}

// SORT FUNCTION
function sortTable(tableId, columnIndex) {
    const table = document.getElementById(tableId);
    const rows = Array.from(table.rows).slice(1);
    let asc = table.getAttribute("data-sort") !== "asc";

    rows.sort((a, b) => {
        let A = a.cells[columnIndex].innerText;
        let B = b.cells[columnIndex].innerText;

        // If sorting date column
        if (columnIndex === 1) {
            A = new Date(A);
            B = new Date(B);
        } else {
            A = A.toLowerCase();
            B = B.toLowerCase();
        }
        return asc ? A.localeCompare(B) : B.localeCompare(A);
    });

    table.setAttribute("data-sort", asc ? "asc" : "desc");

    rows.forEach(row => table.tBodies[0].appendChild(row));
}
//second table
function renderTable() {
    renderStudentTable(currentStudents);
}
document.addEventListener("click", function (e) {
    const row = e.target.closest("tr");
    if (!row) return;
    // TAKE ATTENDANCE MODE
    if (takingAttendance) {
        if (e.target.classList.contains("take-present") ||
            e.target.classList.contains("take-absent")) {

            row.querySelectorAll("button").forEach(btn => btn.classList.remove("active"));

            const now = new Date();
            let status = "Absent";

            if (e.target.classList.contains("take-present")) {
                const diffMinutes = (now - attendanceStartTime) / 60000;
                status = diffMinutes <= 30 ? "Present" : "Late";
            }

            row.setAttribute("data-status", status);
            row.setAttribute("data-time", now.toISOString());

            e.target.classList.add("active");
        }
        return;
    }
    // VIEW / EDIT MODE
    row.querySelectorAll("button").forEach(btn => btn.classList.remove("active"));
    if (e.target.classList.contains("mark-present")) {
        if (!confirm("Mark this student as Present?")) return;

        e.target.classList.add("active");
        row.setAttribute("data-status", "Present");
    }
    if (e.target.classList.contains("mark-absent")) {
        if (!confirm("Mark this student as Absent?")) return;
        e.target.classList.add("active");
        row.setAttribute("data-status", "Absent");
    }

});
document.getElementById("newAttendanceBtn").addEventListener("click", () => {
    
    const now = new Date();

    const formattedDateTime = now.toLocaleString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    });

    if (!confirm(`Take attendance for ${formattedDateTime}?`)) return;
    attendanceStartTime = new Date();
    takingAttendance = true;

    document.getElementById("dateColumn").style.display = "none";
    document.getElementById("statusColumn").style.display = "none"; 
    document.getElementById("attendanceActions").style.display = "block";
    document.querySelectorAll(".status-cell").forEach(td => td.style.display = "none");

    const tbody = document.querySelector("#studentTable tbody");
    tbody.innerHTML = "";

    currentStudents.forEach(student => {
        tbody.innerHTML += `
            <tr data-student-id="${student.id}">
                <td>${student.name}</td>
                <td class="date-cell" style="display:none;"></td>
                <td class="status-cell" style="display:none;"></td>
                <td>
                    <button class="btn btn-success btn-sm take-present">✔</button>
                    <button class="btn btn-danger btn-sm take-absent">✖</button>
                </td>
            </tr>
        `;
    });
});
document.getElementById("saveAttendance").addEventListener("click", () => {
    const rows = document.querySelectorAll("#studentTable tbody tr");

    const records = [];

    rows.forEach(row => {
        const studentId = row.dataset.studentId;
        const status = row.getAttribute("data-status");
        const timestamp = row.getAttribute("data-time");

        records.push({studentId,status: status || null,timestamp});
    });

    fetch("/save-attendance/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken()
        },
        body: JSON.stringify({
            classId: currentClassId,
            period: currentPeriod,
            date_time: attendanceStartTime.toISOString(),
            records: records
        })
    })
    .then(res => res.json())
    .then(data => {
        console.log("Saved!", data);
        resetView();
        loadStudents(currentClassId); // reload latest
    });
});

document.getElementById("cancelAttendance").addEventListener("click", () => {
    if (!confirm("Cancel this attendance session?")) return;

    resetView();

    // reload original state from server
    if (currentClassId) {
        loadStudents(currentClassId);
    }
});
document.getElementById("deleteAttendance").addEventListener("click", () => {

    if (!currentSessionId) {
        alert("No attendance session selected.");
        return;
    }

    const selectedText = document.querySelector("#dateFilter option:checked")?.textContent;

    if (!selectedText) {
        alert("Attendance session is empty.");
        return;
    }

    if (!confirm(`Are you sure to delete this "${selectedText}" attendance session?`)) {
        return;
    }

    fetch(`/delete-session/${currentSessionId}/`, {
        method: "POST",
        headers: {
            "X-CSRFToken": getCSRFToken()
        }
    })
    .then(res => res.json())
    .then(data => {
        console.log("Deleted:", data);
        updateDeleteButtonState();
        currentSessionId = null;
        loadStudents(currentClassId);
    });
});
function updateDeleteButtonState() {
    const deleteBtn = document.getElementById("deleteAttendance");

    deleteBtn.disabled = !currentSessionId;
}


//get student
function loadStudents(classId) {
    fetch(`/get-students/${classId}/`)
        .then(res => res.json())
        .then(studentData => {
            currentStudents = studentData.students;
            return fetch(`/get-attendance/${classId}/${currentPeriod}/`);
        })
        .then(res => res.json())
        .then(data => {

            populateDateFilter(data.sessions);

            currentSessionId = data.latest?.id || null; 
            updateDeleteButtonState();

            if (data.latest && data.latest.records) {
                renderAttendance(data.latest.records, data.latest.date_time);
            } else {
                renderStudentTable(currentStudents);
            }
        });
}
function renderStudentTable(students) {
    const tbody = document.querySelector("#studentTable tbody");

    currentStudents = students;

    tbody.innerHTML = "";

    students.forEach(student => {
        tbody.innerHTML += `
            <tr data-student-id="${student.id}">
                <td>${student.name}</td>
                <td>—</td>
                <td class="status-cell">--</td>
                <td>
                    <button class="btn btn-success btn-sm mark-present">✔</button>
                    <button class="btn btn-danger btn-sm mark-absent">✖</button>
                </td>
            </tr>
        `;
    });
}
function renderAttendance(records, dateTime) {
    const tbody = document.querySelector("#studentTable tbody");

    tbody.innerHTML = "";

    currentStudents.forEach(student => {
        const record = records.find(r => r.studentId == student.id);

        tbody.innerHTML += `
            <tr data-student-id="${student.id}">
                <td>${student.name}</td>
                <td>${dateTime ? new Date(dateTime).toLocaleString() : "—"}</td>
                <td class="status-cell">
                    ${record && record.status ? record.status : "--"}
                </td>
                <td>
                    <button class="btn btn-success btn-sm mark-present">✔</button>
                    <button class="btn btn-danger btn-sm mark-absent">✖</button>
                </td>
            </tr>
        `;
    });
}
document.getElementById("dateFilter").addEventListener("change", function () {
    const sessionId = this.value;

    currentSessionId = sessionId || null;
    updateDeleteButtonState();

    if (!sessionId) return;

    fetch(`/get-session/${sessionId}/`)
        .then(res => res.json())
        .then(data => {
            renderAttendance(data.records, data.date_time);
        });
});
//populate date filter
function populateDateFilter(sessions) {
    const dateFilter = document.getElementById("dateFilter");

    dateFilter.innerHTML = "";

    sessions.forEach(s => {
        dateFilter.innerHTML += `
            <option value="${s.id}">
                ${new Date(s.date_time).toLocaleString()}
            </option>
        `;
    });
}


//update attendance


function resetView() {
    takingAttendance = false;
    document.getElementById("dateColumn").style.display = "";
    document.getElementById("statusColumn").style.display = "";

    document.getElementById("attendanceActions").style.display = "none";

    document.querySelectorAll(".status-cell").forEach(td => td.style.display = "");
}
function getCSRFToken() {
    let cookieValue = null;

    if (document.cookie && document.cookie !== "") {
        const cookies = document.cookie.split(";");

        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();

            if (cookie.startsWith("csrftoken=")) {
                cookieValue = cookie.substring("csrftoken=".length);
                break;
            }
        }
    }

    return cookieValue;
}