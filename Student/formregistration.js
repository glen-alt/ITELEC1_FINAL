const eventId = localStorage.getItem("currentEventID");
const user = JSON.parse(localStorage.getItem("user"));
const schoolId = user?.schoolid;

// Pre-fill the ID so the student can't register someone else by typing a different one
document.getElementById("student-id").value = schoolId ?? "";
console.log("Event ID:", eventId, "School ID:", schoolId);

async function registerForEvent() {
  if (!eventId || !schoolId) {
    alert("Missing event or login information. Go back and pick an event again.");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/api/events/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, schoolId }),
    });
    const data = await response.json();

    alert(data.message);

    if (response.ok || response.status === 409) {
      window.location.href = "events.html"; // change to your events page
    }
  } catch (error) {
    console.error("Error registering:", error);
    alert("Could not reach the server");
  }
}


document.getElementById("student-id").value = schoolId ?? "";

async function loadEventDetails() {
  const title = document.getElementById("event-title");

  if (!eventId) {
    title.textContent = "NO EVENT SELECTED";
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/api/events/${eventId}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    // textContent is used instead of innerHTML, so the name can't inject HTML
    title.textContent = data.event.event_name.toUpperCase();
  } catch (error) {
    console.error("Error loading event:", error);
    title.textContent = "EVENT NOT FOUND";
  }
}

loadEventDetails();