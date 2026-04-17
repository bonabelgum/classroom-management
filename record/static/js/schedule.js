let currentDate = new Date();
let events = {}; // { 'YYYY-MM-DD': [ {title} ] }

const calendar = document.getElementById("calendar");
const monthYear = document.getElementById("monthYear");
let viewModal;
document.addEventListener("DOMContentLoaded", () => {
    renderCalendar(); // Initial render
    const viewModalElement = document.getElementById("viewEventsModal");
    viewModal = new bootstrap.Modal(viewModalElement);
});
function renderCalendar() {
    calendar.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    monthYear.innerText = currentDate.toLocaleString("default", {
        month: "long",
        year: "numeric"
    });

    // empty slots
    for (let i = 0; i < firstDay; i++) {
        calendar.innerHTML += `<div></div>`;
    }

    for (let day = 1; day <= lastDate; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        const dayDiv = document.createElement("div");
        dayDiv.classList.add("day");

        dayDiv.innerHTML = `<div class="day-number">${day}</div>`;

        if (events[dateStr]) {
            const dayEvents = events[dateStr];

            dayEvents.slice(0, 2).forEach((event, index) => {
                const eventEl = document.createElement("div");
                eventEl.classList.add("event");

                eventEl.innerHTML = `
                    ${event.title}
                    <span onclick="deleteEvent('${dateStr}', ${index})"
                        class="ms-2 text-white"
                        style="cursor:pointer; font-size:14px;">
                        ✖
                    </span>
                `;
                dayDiv.appendChild(eventEl);
            });
            // If more than 2 events → show "+X more"
            if (dayEvents.length > 2) {
                const moreEl = document.createElement("div");
                moreEl.classList.add("more-events");

                const remaining = dayEvents.length - 2;
                moreEl.innerText = `+${remaining} more`;

                moreEl.onclick = () => openViewModal(dateStr);

                dayDiv.appendChild(moreEl);
            }
        }

        calendar.appendChild(dayDiv);
    }
}
// Navigation
document.getElementById("prevMonth").onclick = () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
};

document.getElementById("nextMonth").onclick = () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
};

// Modal

document.getElementById("addEventBtn").onclick = () => {
    const eventModal = new bootstrap.Modal(document.getElementById("eventModal"));
    eventModal.show();
};

document.getElementById("closeModal").onclick = () => {
    mbootstrap.Modal.getInstance(document.getElementById("eventModal")).hide();
};

// Save Event
function saveEvent() {
    const date = document.getElementById("eventDate").value;
    const title = document.getElementById("eventTitle").value;

    if (!date || !title) {
        alert("Fill all fields");
        return;
    }

    if (!events[date]) {
        events[date] = [];
    }

    events[date].push({ title });

    document.getElementById("eventTitle").value = "";

    bootstrap.Modal.getInstance(document.getElementById("eventModal")).hide();

    renderCalendar();
}

// Delete Event
function deleteEvent(date, index) {
    if (!confirm("Delete this task?")) return;

    events[date].splice(index, 1);

    if (events[date].length === 0) {
        delete events[date];
    }

    renderCalendar();
}

//open calendar modal
function openViewModal(date) {
    const container = document.getElementById("allEventsContainer");
    const title = document.getElementById("viewDateTitle");

    container.innerHTML = "";
    title.innerText = date;

    if (events[date]) {
        events[date].forEach((event, index) => {
            const el = document.createElement("div");
            el.classList.add("event");

            el.innerHTML = `
                ${event.title}
                <span onclick="deleteEvent('${date}', ${index}); openViewModal('${date}')">✖</span>
            `;

            container.appendChild(el);
        });
    }

    viewModal.show(); // always use the single instance
}
document.getElementById("closeViewModal").onclick = () => {
    document.getElementById("viewEventsModal").style.display = "none";
};