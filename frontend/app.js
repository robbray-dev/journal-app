const monthSelect = document.getElementById("monthSelect");
const yearSelect = document.getElementById("yearSelect");
const prevBtn = document.getElementById("previousMonthBtn");
const nextBtn = document.getElementById("nextMonthBtn");
const calendarGrid = document.getElementById("calendarGrid");

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

let current = new Date();
let currentMonth = current.getMonth(); // 0-11
let currentYear = current.getFullYear(); // yyyy

function fillSelects() {
  // months
  monthSelect.innerHTML = months
    .map((m, i) => `<option value="${i}">${m}</option>`)
    .join("");

  // years (range)
  const startYear = currentYear - 10;
  const endYear = currentYear + 10;
  yearSelect.innerHTML = Array.from(
    { length: endYear - startYear + 1 },
    (_, idx) => {
      const y = startYear + idx;
      return `<option value="${y}">${y}</option>`;
    }
  ).join("");
}

function syncUI() {
  monthSelect.value = String(currentMonth);
  yearSelect.value = String(currentYear);
  renderCalendar(currentYear, currentMonth);
}

// Monday-start helper: JS getDay() returns 0=Sun..6=Sat
// We want 0=Mon..6=Sun
function mondayIndex(jsDay) {
  return (jsDay + 6) % 7;
}

function renderCalendar(year, monthIndex) {
  calendarGrid.innerHTML = ""; // clear

  // 1) figure out number of days in month
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  // 2) figure out what weekday the 1st lands on (Mon-start)
  const firstDayJs = new Date(year, monthIndex, 1).getDay(); // 0=Sun..6=Sat
  const offset = mondayIndex(firstDayJs); // 0..6 blanks before day 1

  // 3) total cells in grid (usually 35 or 42)
  const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7;

  // 4) build cells
  for (let cell = 0; cell < totalCells; cell++) {
    const dayNum = cell - offset + 1; // day number if in range

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cal-cell";
    btn.setAttribute("role", "gridcell");

    if (dayNum < 1 || dayNum > daysInMonth) {
      btn.classList.add("is-empty");
      btn.disabled = true;
      btn.textContent = "";
    } else {
      btn.textContent = String(dayNum);

      // store ISO date for later (click -> open entries)
      const iso = new Date(year, monthIndex, dayNum).toISOString().slice(0, 10);
      btn.dataset.date = iso;

      btn.addEventListener("click", () => {
        // placeholder: you’ll wire this to your “Add Entry” panel later
        document
          .querySelectorAll(".cal-cell.is-selected")
          .forEach((el) => el.classList.remove("is-selected"));
        btn.classList.add("is-selected");
        console.log("Selected date:", iso);
      });
    }

    calendarGrid.appendChild(btn);
  }
}

function shiftMonth(delta) {
  currentMonth += delta;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear -= 1;
  }
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear += 1;
  }
  syncUI();
}

// init
fillSelects();
syncUI();

// events
prevBtn.addEventListener("click", () => shiftMonth(-1));
nextBtn.addEventListener("click", () => shiftMonth(1));

monthSelect.addEventListener("change", (e) => {
  currentMonth = Number(e.target.value);
  syncUI();
});

yearSelect.addEventListener("change", (e) => {
  currentYear = Number(e.target.value);
  syncUI();
});
