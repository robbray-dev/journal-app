const monthSelect = document.getElementById("monthSelect");
const yearSelect = document.getElementById("yearSelect");
const prevBtn = document.getElementById("previousMonthBtn");
const nextBtn = document.getElementById("nextMonthBtn");
const calendarGrid = document.getElementById("calendarGrid");

const entryList = document.getElementById("entryList");
const emptyState = document.getElementById("emptyState");
const entryCountText = document.getElementById("entryCountText");
const selectedDateKicker = document.getElementById("selectedDateKicker");
const newEntryBtn = document.getElementById("newEntrybtn");

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
let currentMonth = current.getMonth();
let currentYear = current.getFullYear();

// demo “entries exist” map (replace later with localStorage / backend)
const entriesByDate = {
  // "YYYY-MM-DD": [{title, type, desc}]
  // Example:
  // "2025-12-15": [{ title: "Gratitude", type: "Entry", desc: "Grateful for..." }]
};

let selectedISO = null;

function fillSelects() {
  monthSelect.innerHTML = months
    .map((m, i) => `<option value="${i}">${m}</option>`)
    .join("");

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

function mondayIndex(jsDay) {
  return (jsDay + 6) % 7; // 0=Mon..6=Sun
}

function renderCalendar(year, monthIndex) {
  calendarGrid.innerHTML = "";

  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDayJs = new Date(year, monthIndex, 1).getDay(); // 0=Sun..6=Sat
  const offset = mondayIndex(firstDayJs);

  // ✅ remove trailing empty weeks:
  // only render up to the last real day, but keep leading blanks for alignment
  const usedCells = offset + daysInMonth;
  const totalCells = Math.ceil(usedCells / 7) * 7;

  const today = new Date();
  const todayISO = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  )
    .toISOString()
    .slice(0, 10);

  for (let cell = 0; cell < totalCells; cell++) {
    const dayNum = cell - offset + 1;
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

      const iso = new Date(year, monthIndex, dayNum).toISOString().slice(0, 10);
      btn.dataset.date = iso;

      // today highlight
      if (iso === todayISO) btn.classList.add("is-today");

      // entry indicator
      if (entriesByDate[iso]?.length) btn.classList.add("has-entry");

      // selected highlight
      if (selectedISO === iso) btn.classList.add("is-selected");

      btn.addEventListener("click", () => {
        selectedISO = iso;
        document
          .querySelectorAll(".cal-cell.is-selected")
          .forEach((el) => el.classList.remove("is-selected"));
        btn.classList.add("is-selected");
        renderRightPanelForDate(iso);
      });
    }

    calendarGrid.appendChild(btn);
  }
}

function renderRightPanelForDate(iso) {
  selectedDateKicker.textContent = iso;
  const items = entriesByDate[iso] || [];

  entryList.innerHTML = "";
  entryCountText.textContent = `${items.length} item${
    items.length === 1 ? "" : "s"
  }`;

  if (items.length === 0) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  items.forEach((it) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "drawer-item";

    row.innerHTML = `
      <div class="item-body">
        <div class="item-title">${it.title}</div>
        <div class="item-sub">${it.type}</div>
        <div class="item-desc">${it.desc}</div>
      </div>
      <span class="chev">›</span>
    `;

    entryList.appendChild(row);
  });
}

// quick add: creates a simple placeholder entry on selected day
newEntryBtn.addEventListener("click", () => {
  if (!selectedISO) {
    // default to today if nothing selected
    const t = new Date();
    selectedISO = new Date(t.getFullYear(), t.getMonth(), t.getDate())
      .toISOString()
      .slice(0, 10);
  }

  entriesByDate[selectedISO] ||= [];
  entriesByDate[selectedISO].push({
    title: "New entry",
    type: "Entry",
    desc: "Write something you learned or appreciated today…",
  });

  // refresh UI
  renderCalendar(currentYear, currentMonth);
  renderRightPanelForDate(selectedISO);
});

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

fillSelects();
syncUI();

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
