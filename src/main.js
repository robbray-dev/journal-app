// ========================================
// SUPABASE INITIALIZATION
// ========================================

const SUPABASE_URL = import.meta.env.VITE_PROJECT_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_PUBLIC_ANON_KEY;
const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
);

// ========================================
// AUTH CHECK (for journal.html)
// ========================================

if (document.getElementById("calendarGrid")) {
  // This is the journal page - check auth
  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    if (!session) {
      // User not logged in, redirect to login page
      window.location.href = "index.html";
    } else {
      console.log("User authenticated:", session.user.email);
    }
  };

  checkAuth();
}

// ========================================
// JOURNAL PAGE LOGIC (journal.html)
// Only runs if journal elements exist
// ========================================

const monthSelect = document.getElementById("monthSelect");
const yearSelect = document.getElementById("yearSelect");
const calendarGrid = document.getElementById("calendarGrid");
const entryList = document.getElementById("entryList");
const emptyState = document.getElementById("emptyState");
const entryCountText = document.getElementById("entryCountText");
const selectedDateKicker = document.getElementById("selectedDateKicker");
const newEntryBtn = document.getElementById("newEntrybtn");
const menuBtn = document.getElementById("menuBtn");
const sideMenu = document.getElementById("sideMenu");

if (menuBtn && sideMenu) {
  menuBtn.addEventListener("click", () => {
    sideMenu.classList.toggle("open");
  });
}

// Only run journal code if we're on the journal page
if (calendarGrid) {
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

  const entriesByDate = {
    "2025-12-16": [
      {
        title: "Morning reflection",
        type: "Entry",
        desc: "Started the day with meditation and coffee. Feeling grateful for the small moments.",
      },
    ],
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
      },
    ).join("");
  }

  function syncUI() {
    monthSelect.value = String(currentMonth);
    yearSelect.value = String(currentYear);
    renderCalendar(currentYear, currentMonth);
  }

  function mondayIndex(jsDay) {
    return (jsDay + 6) % 7;
  }

  function formatDate(iso) {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function renderCalendar(year, monthIndex) {
    calendarGrid.innerHTML = "";

    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const firstDayJs = new Date(year, monthIndex, 1).getDay();
    const offset = mondayIndex(firstDayJs);

    const usedCells = offset + daysInMonth;
    const totalCells = Math.ceil(usedCells / 7) * 7;

    const today = new Date();
    const todayISO = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
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

        const iso = new Date(year, monthIndex, dayNum)
          .toISOString()
          .slice(0, 10);
        btn.dataset.date = iso;

        if (iso === todayISO) btn.classList.add("is-today");
        if (entriesByDate[iso]?.length) btn.classList.add("has-entry");
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
    selectedDateKicker.textContent = formatDate(iso);
    const items = entriesByDate[iso] || [];

    entryList.innerHTML = "";
    entryCountText.textContent = `${items.length} item${
      items.length === 1 ? "" : "s"
    }`;

    if (items.length === 0) {
      emptyState.style.display = "block";
      entryList.style.display = "none";
      return;
    }

    emptyState.style.display = "none";
    entryList.style.display = "flex";

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

  // Modal elements
  const modalOverlay = document.getElementById("modalOverlay");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const entryForm = document.getElementById("entryForm");

  // Open modal when clicking "+ Add Entry"
  if (newEntryBtn) {
    newEntryBtn.addEventListener("click", () => {
      modalOverlay.classList.add("show");
      document.body.style.overflow = "hidden";
    });
  }

  // Close modal function
  function closeModal() {
    if (modalOverlay) {
      modalOverlay.classList.remove("show");
      document.body.style.overflow = "";
      if (entryForm) entryForm.reset();
    }
  }

  // Close modal buttons
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

  // Close on overlay click
  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (
      e.key === "Escape" &&
      modalOverlay &&
      modalOverlay.classList.contains("show")
    ) {
      closeModal();
    }
  });

  // Handle form submission
  if (entryForm) {
    entryForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!selectedISO) {
        const t = new Date();
        selectedISO = new Date(t.getFullYear(), t.getMonth(), t.getDate())
          .toISOString()
          .slice(0, 10);
      }

      const title = document.getElementById("entry-title").value;
      const did = document.getElementById("entry-did").value;
      const learned = document.getElementById("entry-learned").value;

      // Prepare entry data for Spring Boot API
      const entryData = {
        title: title,
        entryDate: selectedISO,
        what_did: did,
        what_learned: learned,
      };

      try {
        // Get Supabase session token
        const {
          data: { session },
        } = await supabaseClient.auth.getSession();

        // ADD THESE DEBUG LINES HERE ⬇️
        console.log("Sending token:", session.access_token);
        console.log(
          "Token starts with:",
          session.access_token.substring(0, 50),
        );
        // ⬆️ ADD THESE DEBUG LINES HERE

        if (!session) {
          alert("Not authenticated!");
          window.location.href = "index.html";
          return;
        }

        // Call Spring Boot API
        const response = await fetch("http://localhost:8080/api/v1/entries", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`, // Send Supabase JWT
          },
          body: JSON.stringify(entryData),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const savedEntry = await response.json();
        console.log("Entry saved:", savedEntry);

        // Update local data (temporary - you should fetch from API instead)
        entriesByDate[selectedISO] ||= [];
        entriesByDate[selectedISO].push({
          title: title,
          type: "Entry",
          desc: `Did: ${did} | Learned: ${learned}`,
        });

        renderCalendar(currentYear, currentMonth);
        renderRightPanelForDate(selectedISO);
        closeModal();

        alert("Entry saved successfully!");
      } catch (error) {
        console.error("Error saving entry:", error);
        alert("Failed to save entry: " + error.message);
      }
    });
  }

  // Initialize calendar
  fillSelects();
  syncUI();

  monthSelect.addEventListener("change", (e) => {
    currentMonth = Number(e.target.value);
    syncUI();
  });

  yearSelect.addEventListener("change", (e) => {
    currentYear = Number(e.target.value);
    syncUI();
  });
}

// ========================================
// ENTRIES PAGE LOGIC (entries.html)
// Only runs if entriesGrid exists
// ========================================

const entriesGrid = document.getElementById("entriesGrid");

if (entriesGrid) {
  loadEntries();
}

async function loadEntries() {
  try {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    if (!session) {
      window.location.href = "index.html";
      return;
    }

    const response = await fetch("http://localhost:8080/api/v1/entries", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const entries = await response.json();
    renderEntries(entries);
  } catch (err) {
    console.error("Failed to load entries:", err);
  }
}

function renderEntries(entries) {
  entriesGrid.innerHTML = "";

  if (entries.length === 0) {
    entriesGrid.innerHTML = "<p>No entries yet.</p>";
    return;
  }

  entries.forEach((entry) => {
    const card = document.createElement("div");
    card.className = "entry-card";

    card.innerHTML = `
      <div class="entry-header">
        <div class="entry-date">
          <span class="date-badge">
            ${new Date(entry.entryDate).toLocaleDateString()}
          </span>
        </div>
        <button class="entry-menu">⋮</button>
      </div>

      <h3 class="entry-title">${entry.title}</h3>

      <div class="entry-section">
        <div class="entry-label">What I Did</div>
        <div class="entry-text">${entry.what_did}</div>
      </div>

      <div class="entry-section">
        <div class="entry-label">What I Learned</div>
        <div class="entry-text">${entry.what_learned}</div>
      </div>
    `;

    entriesGrid.appendChild(card);
  });
}

// ========================================
// AUTH PAGE LOGIC (index.html)
// Only runs if auth elements exist
// ========================================

const tabs = document.querySelectorAll(".tab");
const tabContents = document.querySelectorAll(".tab-content");

// Tab switching
if (tabs.length > 0) {
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetTab = tab.dataset.tab;

      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      tabContents.forEach((content) => {
        content.classList.remove("active");
        if (content.id === `${targetTab}-content`) {
          content.classList.add("active");
        }
      });

      const successMessage = document.getElementById("successMessage");
      if (successMessage) {
        successMessage.classList.remove("show");
      }
    });
  });
}

// Login form
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    clearErrors("login");

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;

      console.log("Login successful:", data);
      showSuccess("Successfully signed in! Redirecting...");

      setTimeout(() => {
        window.location.href = "journal.html";
      }, 1500);
    } catch (error) {
      showError("login-password", error.message || "Invalid email or password");
    }
  });
}

// Signup form
const signupForm = document.getElementById("signupForm");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const confirmPassword = document.getElementById(
      "signup-confirm-password",
    ).value;

    clearErrors("signup");

    if (password.length < 8) {
      showError("signup-password", "Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      showError("signup-confirm-password", "Passwords do not match");
      return;
    }

    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
      });

      if (error) throw error;

      console.log("Signup successful:", data);
      showSuccess("Account created!");
    } catch (error) {
      showError("signup-email", error.message || "Failed to create account");
    }
  });
}

// Forgot password link
const forgotPasswordLink = document.getElementById("forgotPasswordLink");
if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "forgot-password.html";
  });
}

// Helper functions
function showError(fieldId, message) {
  const input = document.getElementById(fieldId);
  const errorDiv = document.getElementById(`${fieldId}-error`);

  if (input && errorDiv) {
    input.classList.add("error");
    errorDiv.textContent = message;
    errorDiv.classList.add("show");
  }
}

function clearErrors(formType) {
  const inputs = document.querySelectorAll(`#${formType}-content .form-input`);
  const errors = document.querySelectorAll(
    `#${formType}-content .error-message`,
  );

  inputs.forEach((input) => input.classList.remove("error"));
  errors.forEach((error) => {
    error.classList.remove("show");
    error.textContent = "";
  });
}

function showSuccess(message) {
  const successDiv = document.getElementById("successMessage");
  if (successDiv) {
    successDiv.textContent = message;
    successDiv.classList.add("show");
  }
}
