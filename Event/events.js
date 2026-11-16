const eventsContainer = document.getElementById("events-container");
const searchInput = document.getElementById("search-input");
const categorySelect = document.getElementById("search-category");
const orderSelect = document.getElementById("search-order");

const escapeHTML = (str) =>
  String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));

async function loadEvents() {
  try {
    const params = new URLSearchParams({
      q: searchInput.value,
      category: categorySelect.value,
      order: orderSelect.value,
    });

    const response = await fetch(`http://localhost:3000/api/events?${params}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    if (data.events.length === 0) {
      eventsContainer.innerHTML = "<p>No events found.</p>";
      return;
    }

    let html = "";
    for (const event of data.events) {
      const s = event.event_schedule;

      html += `
        <div class="event-card-blue" style="margin-top: 20px;">
          <div class="event-header-blue">
            <span class="event-name">${escapeHTML(event.event_name)}</span>
            <span class="event-hours">${escapeHTML(s.comserve)}</span>
          </div>
          <div class="event-body-blue">
            <div class="event-details-grid">
              <span>${escapeHTML(s.registrationTime)}</span>
              <span>${escapeHTML(s.eventDate)}</span>
              <span>${escapeHTML(s.closingTime)}</span>
              <span>${escapeHTML(s.location)}</span>
            </div>
            <button class="btn-register"
              onclick="localStorage.setItem('currentEventID', '${event.id}'); window.location.href='FormRegistration.html?eventId=${event.id}'">
              Register
            </button>
          </div>
        </div>`;
    }
    eventsContainer.innerHTML = html;
  } catch (error) {
    console.error("Error loading events:", error);
    eventsContainer.innerHTML = "<p>Failed to load events.</p>";
  }
}

// Wait 300ms after the last keystroke before searching
let timer;
searchInput.addEventListener("input", () => {
  clearTimeout(timer);
  timer = setTimeout(loadEvents, 300);
});
categorySelect.addEventListener("change", loadEvents);
orderSelect.addEventListener("change", loadEvents);

loadEvents();