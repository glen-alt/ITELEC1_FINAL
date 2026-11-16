document.addEventListener("DOMContentLoaded", async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        window.location.href = "./Login.html";
    }
    const comservecontainer = document.getElementById("comservelist");
    try {
        const userId = user.schoolid;
        const response = await fetch(
        `http://localhost:3000/api/events/participatedIn?userId=${userId}`
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        let html = "";
        for (const event of data.events) {
        const schedule = event.event_schedule;
        if (event.attendance === "absent"){
            html += `
                <div class="event-card">
                <div class="event-header">
                    <span class="event-name">${event.department} | ${event.event_name}</span>
                    <span class="event-hours">8 hours</span>
                </div>
                <div class="event-body">
                    <div class="event-details">
                    <span>${schedule.registrationTime}</span>
                    <span>${schedule.eventDate}</span>
                    <span>${schedule.closingTime}</span>
                    <span>${schedule.location}</span>
                    </div>
                    <button class="btn-status">${event.attendance}</button>
                </div>
                </div>`
            ;
        }
        
        }
        comservecontainer.innerHTML += html;

        if (!response.ok) {
            console.error("Failed to fetch events:", events);
            alert(events.message || "Failed to fetch events. Please try again.");
            return;
        }
    } catch (error) {
        console.error("Error occurred while fetching events:", error);
        alert("Could not reach the server. Please try again.");
    };
});