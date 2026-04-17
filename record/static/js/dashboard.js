document.addEventListener("DOMContentLoaded", () => {
loadReminders();
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