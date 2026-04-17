const attendanceData = {
    prelim: [
        {
            date: "2026-04-15 09:00 AM",
            students: [
                { name: "John Doe", status: "Present" },
                { name: "Jane Smith", status: "Late" }
            ]
        },
        {
            date: "2026-04-10 09:00 AM",
            students: [
                { name: "John Doe", status: "Absent" },
                { name: "Jane Smith", status: "Present" }
            ]
        }
    ],
    midterm: [
        {
            date: "2026-05-01 09:00 AM",
            students: [
                { name: "John Doe", status: "Present" },
                { name: "Jane Smith", status: "Present" }
            ]
        },
        {
            date: "2026-05-03 09:00 AM",
            students: [
                { name: "John Doe", status: "Late" },
                { name: "Jane Smith", status: "Absent" }
            ]
        }
    ],
    prefinal: [],
    final: []
};

let currentPeriod = "prelim";
let takingAttendance = false;

document.addEventListener("DOMContentLoaded", function () {

    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[title]'));
    tooltipTriggerList.forEach(el => new bootstrap.Tooltip(el));

    const classRows = document.querySelectorAll(".clickable-row");
    const classSection = document.getElementById("classTableSection");
    const studentSection = document.getElementById("studentTableSection");
    const backBtn = document.getElementById("backBtn");

    // CLICK ROW → SHOW SECOND TABLE
    classRows.forEach(row => {
        row.addEventListener("click", function () {
            classSection.style.display = "none";
            studentSection.style.display = "block";
        });
    });

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
            renderTable();
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
    const tbody = document.querySelector("#studentTable tbody");
    const dateFilter = document.getElementById("dateFilter");

    tbody.innerHTML = "";
    dateFilter.innerHTML = '<option value="">All Dates</option>';

    const records = attendanceData[currentPeriod];

    if (!records.length) return;

    // latest first
    records.sort((a, b) => new Date(b.date) - new Date(a.date));

    records.forEach(record => {
        dateFilter.innerHTML += `<option value="${record.date}">${record.date}</option>`;
    });

    const latest = records[0];

    latest.students.forEach(student => {
        tbody.innerHTML += `
            <tr>
                <td>${student.name}</td>
                <td>${latest.date}</td>
                <td>
                    <div class="mt-1">
                        <button class="btn btn-success btn-sm mark-present" title="Mark Present">✔</button>
                        <button class="btn btn-danger btn-sm mark-absent" title="Mark Absent">✖</button>
                    </div>
                </td>
            </tr>
        `;
    });
}
document.addEventListener("click", function (e) {

    if (takingAttendance) return;

    const row = e.target.closest("tr");
    if (!row) return;

    // REMOVE ACTIVE FROM BOTH BUTTONS
    row.querySelectorAll("button").forEach(btn => btn.classList.remove("active"));

    // PRESENT
    if (e.target.classList.contains("mark-present")) {
        if (!confirm("Mark this student as Present?")) return;

        e.target.classList.add("active");
        row.setAttribute("data-status", "Present");
    }
    // ABSENT
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

    takingAttendance = true;

    document.getElementById("dateColumn").style.display = "none";
    document.getElementById("attendanceActions").style.display = "block";

    const tbody = document.querySelector("#studentTable tbody");
    tbody.innerHTML = "";

    ["John Doe", "Jane Smith"].forEach(name => {
        tbody.innerHTML += `
            <tr>
                <td>${name}</td>
                <td class="date-cell" style="display:none;"></td>
                <td>
                    <button class="btn btn-success btn-sm take-present" title="Present">✔</button>
                    <button class="btn btn-danger btn-sm take-absent" title="Absent">✖</button>
                </td>
            </tr>
        `;
    });
});
document.getElementById("saveAttendance").addEventListener("click", () => {
    const now = new Date().toLocaleString();

    const rows = document.querySelectorAll("#studentTable tbody tr");
    const students = [];

    rows.forEach(row => {
        const name = row.cells[0].innerText;
        const status = row.getAttribute("data-status") || "Absent";

        students.push({ name, status });
    });

    attendanceData[currentPeriod].push({
        date: now,
        students
    });

    resetView();
    renderTable();
});

document.getElementById("cancelAttendance").addEventListener("click", () => {
    resetView();
    renderTable();
});
document.getElementById("deleteAttendance").addEventListener("click", () => {
    if (!confirm("Are you sure you want to delete this attendance session?")) return;

    // Just reset like cancel (no save)
    resetView();
    renderTable();
});
function resetView() {
    takingAttendance = false;
    document.getElementById("dateColumn").style.display = "";
    document.getElementById("attendanceActions").style.display = "none";
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