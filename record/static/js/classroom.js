let activeClassId = null; //enroll student
let editingClassId = null;
let currentSelectedClassId = null;
let sortedAsc = true; //to sort enrolled students table
//editing enrolled student
let selectedStudent = null;
let isEditingStudent = false;
let selectedExtraClasses = []; //students can be enrolled to multiple classes

function getCSRFToken() {
        return document.cookie.split('; ')
            .find(row => row.startsWith('csrftoken'))
            ?.split('=')[1];
    }

document.addEventListener("DOMContentLoaded", function () {
    const saveBtn = document.getElementById("saveClass");
    const row = document.getElementById("classroomRow");
    const contentArea = document.getElementById("classContentArea");

//==STORING BUTTON CLASS==
    // STORE ALL CLASSES
    rebuildButtons();

    saveBtn.addEventListener("click", function () {
        const name = document.getElementById("className").value.trim();
        const year = document.getElementById("classYear").value.trim();
        const room = document.getElementById("classRoom").value.trim();
        const description = document.getElementById("classDesc").value.trim();

        const selectedDays = Array.from(document.querySelectorAll(".day-checkbox:checked"))
            .map(cb => cb.value);

        const startTime = document.getElementById("startTime").value;
        const endTime = document.getElementById("endTime").value;

        const schedule = `${selectedDays.join(", ")} | ${startTime} - ${endTime}`;

        if (!name) return;
        // UPDATE MODE
        if (editingClassId) {

            fetch(`/update-classroom/${editingClassId}/`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCSRFToken()
                },
                body: JSON.stringify({
                    name, 
                    year, 
                    room, 
                    description, 
                    schedule
                })
            })
            .then(res => res.json())
            .then(data => {

                const index = classes.findIndex(c => c.id === editingClassId);
                classes[index] = {
                    ...classes[index],
                    ...data
                };

                rebuildButtons(); 
                if (currentSelectedClassId === data.id) {//to update the form right away
                    showClassContent(classes[index]);
                }
                editingClassId = null;

                document.getElementById("classForm").reset();
                bootstrap.Modal.getInstance(document.getElementById('addClassModal')).hide();
            });

        }
        // CREATE MODE
        else {

            fetch("/save-classroom/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCSRFToken()
                },
                body: JSON.stringify({
                    name, year, room, description, schedule
                })
            })
            .then(res => res.json())
            .then(data => {

                classes.push(data);
                classes.sort((a, b) => a.name.localeCompare(b.name));

                rebuildButtons();

                document.getElementById("classForm").reset();
                bootstrap.Modal.getInstance(document.getElementById('addClassModal')).hide();
            });
        }

    });

//==CREATING BUTTON==
    function rebuildButtons() {

        // REMOVE OLD BUTTONS
        const oldBtns = row.querySelectorAll(".class-btn");
        oldBtns.forEach(btn => btn.remove());

        // ADD SORTED BUTTONS
        classes.forEach(cls => {

            const btn = document.createElement("button");
            btn.type = "button";
            btn.classList.add("class-btn");

            btn.innerHTML = `
                <div class="class-title">${cls.name}</div>
                <div class="class-year">${cls.year}</div>
            `;

            //to update the form right away
            btn.addEventListener("click", function () {
                //console.log("Clicked:", cls.name);
                currentSelectedClassId = cls.id;
                showClassContent(cls);
            });

            row.appendChild(btn);
        });
    }
//==DELETING CLASS==
window.deleteClass = function(id) {

    if (!confirm("Delete this class?")) return;

    fetch(`/delete-classroom/${id}/`, {
        method: "DELETE",
        headers: {
            "X-CSRFToken": getCSRFToken()
        }
    })
    .then(res => res.json())
    .then(data => {

        classes = classes.filter(c => c.id !== id);
        rebuildButtons();

        contentArea.innerHTML = `
            <div class="placeholder-text text-muted">
                Select a class to view details.
            </div>
        `;
    });
}
//==EDITING CLASS==
window.openEditClass = function(id) {

    const cls = classes.find(c => c.id === id);
    if (!cls) return;

    editingClassId = id;

    // fill form
    document.getElementById("className").value = cls.name || "";
    document.getElementById("classYear").value = cls.year || "";
    document.getElementById("classRoom").value = cls.room || "";
    document.getElementById("classDesc").value = cls.description || "";

    // reset checkboxes
    document.querySelectorAll(".day-checkbox").forEach(cb => cb.checked = false);

    // fill schedule
    if (cls.schedule) {
        const parts = cls.schedule.split("|");

        if (parts[0]) {
            parts[0].split(",").forEach(day => {
                const cb = document.querySelector(`.day-checkbox[value="${day.trim()}"]`);
                if (cb) cb.checked = true;
            });
        }

        if (parts[1]) {
            const times = parts[1].trim().split("-");
            document.getElementById("startTime").value = times[0]?.trim() || "";
            document.getElementById("endTime").value = times[1]?.trim() || "";
        }
    }

    // open modal
    const modal = new bootstrap.Modal(document.getElementById('addClassModal'));
    modal.show();
}

//==clear forms==
const modalEl = document.getElementById('addClassModal');
modalEl.addEventListener('hidden.bs.modal', function () {
    // reset edit mode
    editingClassId = null;
    // clear form
    document.getElementById("classForm").reset();
    // clear checkboxes manually (important)
    document.querySelectorAll(".day-checkbox").forEach(cb => cb.checked = false);
    // clear time fields (sometimes reset() misses them)
    document.getElementById("startTime").value = "";
    document.getElementById("endTime").value = "";
});

//==SHOWING CLASS CONTENT==
    window.showClassContent = function (cls) {
        activeClassId = cls.id;

        contentArea.innerHTML = `
            <div class="class-content-card">

                <div class="class-header">
                    <div>Class Name: ${cls.name}</div>
                    <div>Year: ${cls.year || '-'}</div>
                    <div>Schedule: ${cls.schedule || '-'}</div>
                    <div>Room: ${cls.room || '-'}</div>
                </div>

                <div class="class-description">
                    Description: ${cls.description || '-'}
                </div>

                <hr>

                <div class="class-body">
                    
                    <div class="left-col">
                        <div class="placeholder-box">Attendance Data</div>
                        <div class="placeholder-box">More Data</div>

                        <button class="add-activity-btn" data-bs-toggle="modal" data-bs-target="#addActivityModal">
                            <i class="bi bi-plus-lg"></i>
                            Add activity
                        </button>

                        <div class="grade-tabs">
                            <button class="grade-tab active" onclick="switchTerm('prelim', this)">Prelim</button>
                            <button class="grade-tab" onclick="switchTerm('midterm', this)">Midterm</button>
                            <button class="grade-tab" onclick="switchTerm('prefinal', this)">Pre-Final</button>
                            <button class="grade-tab" onclick="switchTerm('final', this)">Final</button>
                        </div>

                        <!-- TAB CONTENT -->
                        <div id="termContent" class="term-content">
                            Prelim Content
                        </div>
                    </div>

                    <div class="right-col">
                        <div class="side-header">
                            <button class="enroll-btn"
                                    data-bs-toggle="modal"
                                    data-bs-target="#enrollStudentModal">
                                <i class="bi bi-person-plus"></i>
                                Enroll student
                            </button>
                        </div>

                        <div class="student-panel">

                        <div class="student-table-header">
                            <input type="text" id="studentSearch" class="form-control form-control-sm"
                                placeholder="Search student...">
                        </div>

                        <div class="student-table-wrapper">
                            <table class="table table-hover student-table">
                                <thead>
                                    <tr>
                                        <th onclick="sortStudents()">Name <i class="bi bi-arrow-down-up"></i></th>
                                    </tr>
                                </thead>
                                <tbody id="studentTableBody">
                                    ${
                                        (cls.students || []).map(st => `
                                            <tr data-id="${st.id}">
                                                <td>${st.last_name}, ${st.first_name}</td>
                                            </tr>
                                        `).join("")
                                    }
                                </tbody>
                            </table>
                        </div>

                    </div>

                        <!-- ACTION BUTTONS -->
                        <div class="delete-container">
                            <!-- EDIT BUTTON -->
                            <button class="edit-btn" onclick="openEditClass(${cls.id})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <!-- DELETE BUTTON -->
                            <button class="delete-btn" onclick="deleteClass(${cls.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                        
                    </div>
                    
                </div>

            </div>
        `;
    }

});

//==STUDENTS ENROLL==

document.addEventListener("input", function (e) {
    //students
    if (e.target.id === "studentSearch") {
        const val = e.target.value.toLowerCase();
        const rows = document.querySelectorAll("#studentTableBody tr");

        rows.forEach(row => {
            const name = row.innerText.toLowerCase();
            row.style.display = name.includes(val) ? "" : "none";
        });
    }
});

window.sortStudents = function () {

    const cls = classes.find(c => c.id === currentSelectedClassId);
    if (!cls || !cls.students) return;

    cls.students.sort((a, b) => {
        const nameA = `${a.last_name}, ${a.first_name}`;
        const nameB = `${b.last_name}, ${b.first_name}`;
        return sortedAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });

    sortedAsc = !sortedAsc;

    showClassContent(cls);
};
document.addEventListener("click", function (e) {
    const row = e.target.closest("#studentTableBody tr");
    if (!row) return;

    const id = parseInt(row.dataset.id);
    if (!id) return;

    const cls = classes.find(c => c.id === currentSelectedClassId);
    if (!cls || !cls.students) return;

    const student = cls.students.find(s => s.id === id);
    if (!student) return;

    openStudentModal(student);
});

window.openStudentModal = function (student) {

    selectedStudent = student;
    isEditingStudent = false;

    document.getElementById("studentModalName").textContent =
        `${student.last_name}, ${student.first_name}`;

    document.getElementById("studentModalGrade").textContent = "--";

    const modalEl = document.getElementById("studentModal");
    let modal = bootstrap.Modal.getInstance(modalEl);
    if (!modal) modal = new bootstrap.Modal(modalEl);

    modal.show();
};
/*ENROLL STUDENT MODAL */
document.addEventListener("click", function (e) {
    if (e.target.closest(".enroll-btn")) {

        const modalEl = document.getElementById("enrollStudentModal");
        const select = document.getElementById("otherClassSelect");
        select.innerHTML = `<option value="">Select class</option>`;

        let modal = bootstrap.Modal.getInstance(modalEl);
        if (!modal) {
            modal = new bootstrap.Modal(modalEl);
        }

        classes.forEach(c => {
            if (c.id !== currentSelectedClassId) {
                select.innerHTML += `<option value="${c.id}">
                    ${c.name} (${c.schedule || '-'})
                </option>`;
            }
        });

        selectedExtraClasses = [];
        document.getElementById("selectedClassesList").innerHTML = "";

        modal.show();
    }
});
window.saveStudent = function () {
    const firstName = document.getElementById("studentFirstName").value.trim();
    const lastName = document.getElementById("studentLastName").value.trim();

    if (!firstName || !lastName) return;

    fetch("/save-student/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken()
        },
        body: JSON.stringify({
            classroom_id: currentSelectedClassId,
            extra_class_ids: selectedExtraClasses,
            first_name: firstName,
            last_name: lastName
        })
    })
    .then(res => res.json())
    .then(data => {

        //add to current class
        const cls = classes.find(c => c.id === currentSelectedClassId);
        if (!cls.students) cls.students = [];
        cls.students.push(data);

        //ALSO add to other selected classes
        selectedExtraClasses.forEach(id => {
            const extraCls = classes.find(c => c.id === id);
            if (!extraCls) return;

            if (!extraCls.students) extraCls.students = [];

            extraCls.students.push({
                id: Date.now() + Math.random(), // temp id
                first_name: data.first_name,
                last_name: data.last_name
            });
        });

        // refresh current view
        showClassContent(cls);

        document.getElementById("enrollForm").reset();
        bootstrap.Modal.getInstance(document.getElementById('enrollStudentModal')).hide();
    });
};
//to add to other class
document.addEventListener("change", function (e) {
    if (e.target.id === "otherClassSelect") {

        const id = parseInt(e.target.value);
        if (!id) return;

        if (selectedExtraClasses.includes(id)) return;

        selectedExtraClasses.push(id);

        const cls = classes.find(c => c.id === id);

        const tag = document.createElement("div");
        tag.className = "badge bg-secondary d-flex align-items-center gap-2";
        tag.dataset.id = id;

        tag.innerHTML = `
            ${cls.name}
            <span style="cursor:pointer;">&times;</span>
        `;

        tag.querySelector("span").addEventListener("click", function () {
            selectedExtraClasses = selectedExtraClasses.filter(c => c !== id);
            tag.remove();
        });

        document.getElementById("selectedClassesList").appendChild(tag);

        e.target.value = "";
    }
});
//edit student
window.enableEditStudent = function () {
    if (!selectedStudent) return;
    isEditingStudent = true;
    // fill inputs
    document.getElementById("editFirstName").value = selectedStudent.first_name;
    document.getElementById("editLastName").value = selectedStudent.last_name;
    // toggle UI
    document.getElementById("editStudentForm").classList.remove("d-none");
    document.getElementById("editActions").classList.remove("d-none");
    document.getElementById("normalActions").classList.add("d-none");
};
window.cancelEditStudent = function () {

    isEditingStudent = false;

    document.getElementById("editStudentForm").classList.add("d-none");
    document.getElementById("editActions").classList.add("d-none");
    document.getElementById("normalActions").classList.remove("d-none");
};
window.saveEditStudent = function () {

    const firstName = document.getElementById("editFirstName").value.trim();
    const lastName = document.getElementById("editLastName").value.trim();

    if (!firstName || !lastName) return;

    fetch(`/update-student/${selectedStudent.id}/`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken()
        },
        body: JSON.stringify({
            classroom_id: currentSelectedClassId,
            extra_class_ids: selectedExtraClasses,
            first_name: firstName,
            last_name: lastName
        })
    })
    .then(res => res.json())
    .then(updated => {
        classes.forEach(cls => {
            cls.students.forEach(student => {
                if (student.student_uid === selectedStudent.student_uid) {
                    student.first_name = updated.first_name;
                    student.last_name = updated.last_name;
                }
            });
        });
        const currentClass = classes.find(c => c.id === currentSelectedClassId);
        showClassContent(currentClass);

        bootstrap.Modal.getInstance(document.getElementById("studentModal")).hide();
    });
};
//cancel editing modal if closed
document.getElementById("studentModal").addEventListener("hidden.bs.modal", function () {

    // reset edit state
    isEditingStudent = false;
    selectedStudent = null;

    // reset UI back to normal mode
    document.getElementById("editStudentForm").classList.add("d-none");
    document.getElementById("editActions").classList.add("d-none");
    document.getElementById("normalActions").classList.remove("d-none");

    // clear inputs (optional but clean)
    document.getElementById("editFirstName").value = "";
    document.getElementById("editLastName").value = "";
});
//delete student
window.deleteStudent = function () {
    if (!selectedStudent) return;
    // 1. confirm dialog
    const confirmDelete = confirm(
        `Are you sure you want to delete ${selectedStudent.last_name}, ${selectedStudent.first_name}?`
    );
    if (!confirmDelete) return;
    // 2. send request to backend
    fetch(`/delete-student/${selectedStudent.id}/`, {
        method: "DELETE",
        headers: {
            "X-CSRFToken": getCSRFToken()
        }
    })
    .then(res => res.json())
    .then(() => {
        // 3. remove from local state
        const cls = classes.find(c => c.id === currentSelectedClassId);
        cls.students = cls.students.filter(
            s => s.id !== selectedStudent.id
        );
        // 4. refresh UI
        showClassContent(cls);
        // 5. close modal
        bootstrap.Modal.getInstance(
            document.getElementById("studentModal")
        ).hide();
        // 6. reset selection
        selectedStudent = null;
    });
};

//==PERIODS TAB==
let activeTerm = "prelim";

window.switchTerm = function(term, btn) {

    activeTerm = term;

    // update active tab highlight
    document.querySelectorAll(".grade-tab").forEach(b => {
        b.classList.remove("active");
    });

    btn.classList.add("active");

    // change content area
    const content = document.getElementById("termContent");

    if (term === "prelim") {
        content.innerHTML = "Prelim Page Content";
    }
    else if (term === "midterm") {
        content.innerHTML = "Midterm Page Content";
    }
    else if (term === "prefinal") {
        content.innerHTML = "Pre-Final Page Content";
    }
    else if (term === "final") {
        content.innerHTML = "Final Page Content";
    }
};
//add acitivities
window.saveActivity = function () {
    const period = document.getElementById("activityPeriod").value;
    const name = document.getElementById("activityName").value.trim();
    const points = document.getElementById("activityPoints").value;
    const type = document.getElementById("activityType").value;

    if (!period ||!name || !points || !type) return;

    const cls = classes.find(c => c.id === currentSelectedClassId);
    if (!cls) return;

    if (!cls.activities) cls.activities = [];

    const newActivity = {
        id: Date.now(), // temporary frontend id
        period,
        name,
        points,
        type,
        term: activeTerm // important: Prelim/Midterm/etc
    };

    cls.activities.push(newActivity);

    // refresh UI
    showClassContent(cls);

    // reset form
    document.getElementById("activityForm").reset();

    // close modal
    bootstrap.Modal.getInstance(
        document.getElementById("addActivityModal")
    ).hide();
};