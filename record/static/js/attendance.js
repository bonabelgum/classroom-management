document.addEventListener("DOMContentLoaded", function () {

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
        const A = a.cells[columnIndex].innerText.toLowerCase();
        const B = b.cells[columnIndex].innerText.toLowerCase();
        return asc ? A.localeCompare(B) : B.localeCompare(A);
    });

    table.setAttribute("data-sort", asc ? "asc" : "desc");

    rows.forEach(row => table.tBodies[0].appendChild(row));
}