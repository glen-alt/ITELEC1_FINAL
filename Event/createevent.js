document.addEventListener("DOMContentLoaded", function() {
    const user = JSON.parse(localStorage.getItem("user"));
    // if (!user.role !== "eventorganizer") {
    //     window.location.href = "./Login.html";
    // } 
});   

// "1, 2 ,3" -> ["1", "2", "3"]
const toList = (value) =>
  value.split(",").map((s) => s.trim()).filter(Boolean);

async function addEvent() {
  const user = JSON.parse(localStorage.getItem("user"));
  const val = (id) => document.getElementById(id).value;

  const body = {
    creatorId: user.id, // the logged-in event organizer
    name: val("event-name"),
    details: val("event-details"),
    type: val("event-type"),
    visibility: val("event-visibility"),
    eventDate: val("event-date"), 
    registrationStart: val("reg-start"),
    registrationEnd: val("reg-end"),
    closingStart: val("close-start"),
    closingEnd: val("close-end"),
    location: val("event-venue"),
    comserve: val("event-comserve"),
    years: toList(val("event-years")),
    sections: toList(val("event-sections")).map((s) => s.toUpperCase()),
    departments: toList(val("event-departments")).map((s) => s.toUpperCase()),
  };

  try {
    const response = await fetch("http://localhost:3000/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to create event");
      return;
    }

    alert("Event created!");
    document.querySelectorAll(".event-form-box input").forEach((i) => (i.value = ""));
  } catch (error) {
    console.error("Error creating event:", error);
    alert("Could not reach the server");
  }
}