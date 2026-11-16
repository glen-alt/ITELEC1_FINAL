document.addEventListener("DOMContentLoaded", async () => {

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        window.location.href = "./Login.html";
    } else {
        document.getElementById("username").textContent = `${user.username}`;
        document.getElementById("department").textContent = `${user.department}`;
        if (user.year == 1) {
            document.getElementById("year").textContent = "1st";
        } else if (user.year == 2) {
            document.getElementById("year").textContent = "2nd";
        } else if (user.year == 3) {
            document.getElementById("year").textContent = "3rd";
        } else if (user.year == 4) {
            document.getElementById("year").textContent = "4th";
        }
        document.getElementById("section").textContent = `Section ${user.year}${user.section}`;
        document.getElementsByClassName("student-id")[0].textContent = `${user.schoolid}`;
    }

    const schooleventscontainer = document.getElementById("events-section");
    try {
        const response = await fetch("http://localhost:3000/api/events");
        const data = await response.json();

        let html = "";
        for (const event of data.events) {
        const schedule = typeof event.event_schedule === "string"
            ? JSON.parse(event.event_schedule)
            : event.event_schedule;

        const params = typeof event.required_parameters === "string"
            ? JSON.parse(event.required_parameters)
            : event.required_parameters;

        html += `
            <div class="event-item">
            <div class="event-title">${params?.department ?? "N/A"} | ${event.event_name}</div>
            <div class="event-details-grid">
                <span>Opening Time: ${schedule.registrationTime}</span>
                <span>Closing Time: ${schedule.closingTime}</span>
                <span>Date: ${schedule.eventDate}</span>
                <span>Location: ${schedule.location}</span>
            </div>
            </div>`;
        }
        schooleventscontainer.innerHTML += html;

        if (!response.ok) {
            console.error("Failed to fetch events:", events);
            alert(events.message || "Failed to fetch events. Please try again.");
            return;
        }
    } catch (error) {
        console.error("Error occurred while fetching events:", error);
        alert("Could not reach the server. Please try again.");
    }
});   